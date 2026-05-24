import json
import math
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamo = boto3.resource("dynamodb", region_name="sa-east-1")
table  = dynamo.Table("PsicoCare")

PERFIS_WESAD = {
    "S14": "hiperreativo",
    "S16": "dissociativo",
    "S17": "neutro",
}

def normaliza(val, vmin, vmax):
    if vmax == vmin:
        return 0.0
    return max(0.0, min(1.0, (val - vmin) / (vmax - vmin)))

def calc_rmssd(ibis):
    if len(ibis) < 2:
        return 0.0
    diffs = [ibis[i+1] - ibis[i] for i in range(len(ibis)-1)]
    return math.sqrt(sum(d**2 for d in diffs) / len(diffs))

def calc_stress_physio(hr, ibi, rmssd, hr_min, hr_max, ibi_min, ibi_max, rmssd_min, rmssd_max):
    hr_n    = normaliza(hr,    hr_min,    hr_max)
    ibi_n   = 1 - normaliza(ibi,   ibi_min,   ibi_max)
    rmssd_n = normaliza(rmssd, rmssd_min, rmssd_max)
    return round(0.40 * hr_n + 0.40 * ibi_n + 0.20 * rmssd_n, 4)

def hora_para_label(hora):
    if 7 <= hora <= 9:     return "baseline"
    elif 10 <= hora <= 17: return "stress"
    elif 18 <= hora <= 20: return "amusement"
    else:                  return "meditation"

def gerar_insight_fixo(perfil, fase_dia, flag, divergence):
    momento = {
        "baseline":   "manhã",
        "stress":     "tarde",
        "amusement":  "fim da tarde",
        "meditation": "noite"
    }.get(fase_dia, "dia")

    if flag == "anxiety_risk":
        if perfil == "dissociativo":
            return {
                "title":    "Alerta: Ansiedade Dissociativa",
                "body":     f"[{momento}] Alto estresse fisiológico detectado com baixo relato subjetivo — possível padrão de ansiedade dissociativa. Recomenda-se atenção redobrada na próxima sessão.",
                "category": "stress"
            }
        elif perfil == "hiperreativo":
            return {
                "title":    "Alerta: Ansiedade Hiperreativa",
                "body":     f"[{momento}] Sinais fisiológicos elevados com sofrimento não reconhecido — padrão hiperreativo identificado. Considere explorar gatilhos recentes.",
                "category": "stress"
            }
        else:
            return {
                "title":    "Alerta: Ansiedade Não Reconhecida",
                "body":     f"[{momento}] O corpo apresentou sinais elevados de estresse enquanto o relato subjetivo foi baixo — possível ansiedade não reconhecida.",
                "category": "stress"
            }

    elif flag == "overreported":
        if perfil == "hiperreativo":
            return {
                "title":    "Sofrimento Subjetivo Elevado",
                "body":     f"[{momento}] O sofrimento relatado excedeu a resposta fisiológica — padrão de ansiedade hiperreativa. Pode indicar ruminação ou antecipação de eventos.",
                "category": "humor"
            }
        else:
            return {
                "title":    "Sofrimento Subjetivo Elevado",
                "body":     f"[{momento}] O estresse relatado foi maior do que os sinais fisiológicos — possível ansiedade antecipatória ou dificuldade de regulação emocional.",
                "category": "humor"
            }

    else:  # aligned
        if perfil == "dissociativo":
            return {
                "title":    "Estado Estável",
                "body":     f"[{momento}] Percepção subjetiva alinhada com a fisiologia — momento de equilíbrio para o perfil dissociativo. Bom indicador de regulação emocional.",
                "category": "bem-estar"
            }
        else:
            return {
                "title":    "Estado Equilibrado",
                "body":     f"[{momento}] A percepção subjetiva está alinhada com o estado fisiológico — sem divergências significativas detectadas.",
                "category": "bem-estar"
            }

def resolver_patient_id(event):
    patient_id = None

    path_params = event.get("pathParameters") or {}
    patient_id = path_params.get("patientId")

    if not patient_id:
        qs = event.get("queryStringParameters") or {}
        patient_id = qs.get("patientId")

    if not patient_id:
        body = event.get("body")
        if body:
            try:
                parsed = json.loads(body) if isinstance(body, str) else body
                patient_id = parsed.get("patientId")
            except Exception:
                pass

    if not patient_id:
        patient_id = event.get("patientId")

    if not patient_id:
        return None, None

    if patient_id.startswith("PATIENT#"):
        pk         = patient_id
        patient_id = patient_id[len("PATIENT#"):]
    else:
        pk = f"PATIENT#{patient_id}"

    return pk, patient_id

def handler(event, context):

    # 1. Resolver patientId
    pk, patient_id = resolver_patient_id(event)

    if not patient_id:
        return _resp(400, {
            "error": "patientId é obrigatório",
            "exemplos": {
                "direto":  '{"patientId": "S16_baseline_test"}',
                "real":    '{"patientId": "240fa940-1010-4047-a07f-d34e7bb0e3b2"}',
                "query":   "?patientId=S16_baseline_test",
            }
        })

    # 2. Buscar perfil do paciente no DynamoDB para pegar wesadId
    perfil_item = table.get_item(
        Key={"PK": pk, "SK": pk}
    ).get("Item", {})

    wesad_id = perfil_item.get("wesadId")  # ex: "S16_baseline_test"

    # Se tiver wesadId usa os dados do WESAD, senão usa os do próprio paciente
    pk_dados = f"PATIENT#{wesad_id}" if wesad_id else pk

    # 3. Buscar HEALTH_BATCHes
    resp = table.query(
        KeyConditionExpression=Key("PK").eq(pk_dados) & Key("SK").begins_with("HEALTH_BATCH#"),
        ScanIndexForward=False,
        Limit=10
    )
    batches = resp.get("Items", [])

    if not batches:
        return _resp(404, {
            "error":      f"Sem dados fisiológicos para {pk_dados}",
            "pk_paciente": pk,
            "pk_dados":    pk_dados,
            "wesad_id":    wesad_id,
            "dica":        "Adicione o atributo 'wesadId' no item do paciente no DynamoDB"
        })

    # 4. Agregar dataPoints
    hrs, ibis, temps = [], [], []
    label_counts = {}

    for batch in batches:
        for dp in batch.get("dataPoints", []):
            hr   = float(dp.get("hr",   dp.get("HR",   0)) or 0)
            ibi  = float(dp.get("ibi",  dp.get("IBI",  0)) or 0)
            temp = float(dp.get("temp", dp.get("TEMP", 0)) or 0)
            lbl  = dp.get("label_nome", dp.get("label", "desconhecido"))

            if hr  > 0: hrs.append(hr)
            if ibi > 0: ibis.append(ibi)
            if temp > 0: temps.append(temp)
            label_counts[lbl] = label_counts.get(lbl, 0) + 1

    if not hrs:
        return _resp(400, {"error": "dataPoints sem valores de HR válidos"})

    # 5. Calcular métricas
    n          = len(hrs)
    hr_mean    = sum(hrs)   / n
    ibi_mean   = sum(ibis)  / len(ibis)  if ibis  else 850.0
    temp_mean  = sum(temps) / len(temps) if temps else 30.0
    rmssd      = calc_rmssd(ibis) if len(ibis) >= 2 else 0.0

    hr_min,    hr_max    = min(hrs),  max(hrs)
    ibi_min,   ibi_max   = (min(ibis), max(ibis)) if ibis else (600, 1300)
    rmssd_min, rmssd_max = 0.0, max(rmssd * 2, 1.0)

    sf = calc_stress_physio(
        hr_mean, ibi_mean, rmssd,
        hr_min, hr_max,
        ibi_min, ibi_max,
        rmssd_min, rmssd_max
    )

    # 6. Perfil: WESAD fixo ou inferido
    subject_key = (wesad_id or patient_id).split("_")[0].upper()  # "S16_baseline_test" → "S16"
    perfil = PERFIS_WESAD.get(subject_key)

    if not perfil:
        if hr_mean > 90 and ibi_mean < 700:
            perfil = "hiperreativo"
        elif hr_mean > 85 and ibi_mean < 750 and rmssd < 30:
            perfil = "dissociativo"
        else:
            perfil = "neutro"

    # 7. Flag de divergência
    label_dominante = max(label_counts, key=label_counts.get) if label_counts else "baseline"
    hora_atual      = datetime.now().hour
    fase_dia        = hora_para_label(hora_atual)

    ss         = 0.30
    sf_adj     = round(sf * 0.9, 4)
    divergence = round(sf_adj - ss, 4)

    if divergence >= 0.3:    flag = "anxiety_risk"
    elif divergence <= -0.3: flag = "overreported"
    else:                    flag = "aligned"

    # 8. Gerar insight com regras fixas
    insight = gerar_insight_fixo(perfil, fase_dia, flag, divergence)

    # 9. Salvar INSIGHT# no DynamoDB com o PK do paciente real (Verina)
    ts = datetime.now().isoformat()
    table.put_item(Item={
        "PK": pk,           # PATIENT#240fa940-... (Verina)
        "SK": f"INSIGHT#{ts}",
        "type": "INSIGHT",
        "data": {
            "title":         insight["title"],
            "body":          insight["body"],
            "category":      insight["category"],
            "weekStart":     datetime.now().strftime("%Y-%m-%d"),
            "isRead":        False,
            "perfil":        perfil,
            "flag":          flag,
            "divergence":    str(divergence),
            "stress_physio": str(sf),
            "hr_mean":       str(round(hr_mean, 1)),
            "ibi_mean":      str(round(ibi_mean, 1)),
            "rmssd":         str(round(rmssd, 1)),
            "label":         label_dominante,
            "amostras":      n,
            "wesad_id":      wesad_id or "proprio",
        },
        "createdAt": ts
    })

    return _resp(200, {
        "message":       "Insight gerado com sucesso",
        "pk_paciente":   pk,
        "pk_dados":      pk_dados,
        "perfil":        perfil,
        "flag":          flag,
        "divergence":    divergence,
        "stress_physio": sf,
        "hr_mean":       round(hr_mean, 1),
        "ibi_mean":      round(ibi_mean, 1),
        "rmssd":         round(rmssd, 1),
        "amostras":      n,
        "insight":       insight
    })


def _resp(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body, ensure_ascii=False)
    }