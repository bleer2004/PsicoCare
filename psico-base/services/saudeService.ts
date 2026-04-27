import { initialize, requestPermission, readRecords, getGrantedPermissions } from 'react-native-health-connect';

const PERMISSOES = [
  { accessType: 'read' as const, recordType: 'HeartRate' as const },
  { accessType: 'read' as const, recordType: 'RestingHeartRate' as const },
  { accessType: 'read' as const, recordType: 'HeartRateVariabilityRmssd' as const },
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'SleepSession' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'Distance' as const },
  { accessType: 'read' as const, recordType: 'OxygenSaturation' as const },
  { accessType: 'read' as const, recordType: 'BloodPressure' as const },
  { accessType: 'read' as const, recordType: 'BodyTemperature' as const },
  { accessType: 'read' as const, recordType: 'Weight' as const },
  { accessType: 'read' as const, recordType: 'Height' as const },
];

// Normaliza nomes diferentes entre o que o Health Connect retorna e o que pedimos
function normalizarTipo(tipo: string): string {
  return tipo
    .replace('Rmssd', '')
    .replace('Session', '')
    .toLowerCase();
}

export async function solicitarPermissoes() {
  try {
    console.log("1. Inicializando...");
    const isInitialized = await initialize();
    console.log("2. Inicializado:", isInitialized);
    if (!isInitialized) throw new Error("Health Connect não disponível");

    console.log("3. Buscando permissões existentes...");
    const jaTemPermissoes = await getGrantedPermissions();
    console.log("4. Já tem:", jaTemPermissoes.map((p: any) => p.recordType));

    const tiposJaConcedidos = jaTemPermissoes.map((p: any) => normalizarTipo(p.recordType));
    const faltando = PERMISSOES.filter(p => !tiposJaConcedidos.includes(normalizarTipo(p.recordType)));
    console.log("5. Faltando:", faltando.map(p => p.recordType));

    if (faltando.length > 0) {
      console.log("6. Chamando requestPermission...");
      await requestPermission(faltando);
      console.log("7. requestPermission retornou!");
    } else {
      console.log("✅ Todas as permissões já concedidas!");
    }
  } catch (err: any) {
    console.error("ERRO solicitarPermissoes:", err?.message, err);
    throw err;
  }
}

export async function getDadosSaude() {
  try {
    console.log("Inicializando Health Connect...");
    const isInitialized = await initialize();
    if (!isInitialized) throw new Error("Health Connect não disponível neste dispositivo");

    console.log("Lendo dados...");
    const agora = new Date();
    const semanaPassada = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

    const intervalo7d = {
      operator: 'between' as const,
      startTime: semanaPassada.toISOString(),
      endTime: agora.toISOString(),
    };

    const [
      fc, fcRepouso, hrv, passos, sono,
      calorias, distancia, oxigenio,
      pressao, temperatura, peso, altura
    ] = await Promise.all([
      readRecords('HeartRate',                 { timeRangeFilter: intervalo7d }),
      readRecords('RestingHeartRate',          { timeRangeFilter: intervalo7d }),
      readRecords('HeartRateVariabilityRmssd', { timeRangeFilter: intervalo7d }),
      readRecords('Steps',                     { timeRangeFilter: intervalo7d }),
      readRecords('SleepSession',              { timeRangeFilter: intervalo7d }),
      readRecords('ActiveCaloriesBurned',      { timeRangeFilter: intervalo7d }),
      readRecords('Distance',                  { timeRangeFilter: intervalo7d }),
      readRecords('OxygenSaturation',          { timeRangeFilter: intervalo7d }),
      readRecords('BloodPressure',             { timeRangeFilter: intervalo7d }),
      readRecords('BodyTemperature',           { timeRangeFilter: intervalo7d }),
      readRecords('Weight',                    { timeRangeFilter: intervalo7d }),
      readRecords('Height',                    { timeRangeFilter: intervalo7d }),
    ]);

    console.log("FC raw:",        JSON.stringify(fc.records.at(-1), null, 2));
    console.log("HRV raw:",       JSON.stringify(hrv.records.at(-1), null, 2));
    console.log("Passos raw:",    JSON.stringify(passos.records, null, 2));
    console.log("Sono raw:",      JSON.stringify(sono.records.at(-1), null, 2));
    console.log("Pressao raw:",   JSON.stringify(pressao.records.at(-1), null, 2));
    console.log("Oxigenio raw:",  JSON.stringify(oxigenio.records.at(-1), null, 2));
    console.log("Distancia raw:", JSON.stringify(distancia.records, null, 2));
    console.log("Calorias raw:",  JSON.stringify(calorias.records, null, 2));
    console.log("Peso raw:",      JSON.stringify(peso.records.at(-1), null, 2));
    console.log("Altura raw:",    JSON.stringify(altura.records.at(-1), null, 2));

    // 💤 Sono total
    const horasSono = sono.records.length > 0
      ? sono.records.reduce((acc, r) =>
          acc + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60 * 60), 0)
      : null;

    // 💤 Fases do sono (sessão mais recente)
    let faseSono = null;
    if (sono.records.length > 0) {
      const ultimaSessao: any = sono.records.at(-1);
      if (ultimaSessao?.stages?.length > 0) {
        const calcHoras = (stageId: number) =>
          ultimaSessao.stages
            .filter((s: any) => s.stage === stageId)
            .reduce((acc: number, s: any) =>
              acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60), 0);

        faseSono = {
          leve:     parseFloat(calcHoras(4).toFixed(1)),
          profundo: parseFloat(calcHoras(5).toFixed(1)),
          rem:      parseFloat(calcHoras(6).toFixed(1)),
        };
      }
    }

    const totalPassos    = passos.records.reduce((acc, r) => acc + (r.count ?? 0), 0);
    const totalDistancia = distancia.records.reduce((acc, r: any) => acc + (r.distance?.inMeters ?? 0), 0);
    const totalCalorias  = calorias.records.reduce((acc, r: any) => acc + (r.energy?.inKilocalories ?? 0), 0);

    return {
      frequenciaCardiaca: fc.records.at(-1)?.samples?.at(-1)?.beatsPerMinute ?? null,
      fcRepouso:          fcRepouso.records.at(-1)?.beatsPerMinute ?? null,
      hrv:                (hrv.records.at(-1) as any)?.heartRateVariabilityMillis ?? null,

      pressaoSistolica:   (pressao.records.at(-1) as any)?.systolic?.inMillimetersOfMercury ?? null,
      pressaoDiastolica:  (pressao.records.at(-1) as any)?.diastolic?.inMillimetersOfMercury ?? null,

      oxigenio:           (oxigenio.records.at(-1) as any)?.percentage ?? null,
      temperatura:        (temperatura.records.at(-1) as any)?.temperature?.inCelsius ?? null,

      passos:             totalPassos > 0 ? totalPassos : null,
      distancia:          totalDistancia > 0 ? parseFloat((totalDistancia / 1000).toFixed(2)) : null,
      caloriasAtivas:     totalCalorias > 0 ? Math.round(totalCalorias) : null,

      sono:               horasSono ? parseFloat(horasSono.toFixed(1)) : null,
      faseSono,

      peso:               (peso.records.at(-1) as any)?.weight?.inKilograms ?? null,
      altura:             (altura.records.at(-1) as any)?.height?.inMeters ?? null,
    };

  } catch (err: any) {
    console.error('Erro Health Connect:', err);
    throw new Error(err?.message || "Erro ao acessar dados de saúde");
  }
}