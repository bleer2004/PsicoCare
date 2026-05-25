const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const s3     = new S3Client({ region: "sa-east-1" });

const BUCKET = "apsicare-documentos-23012668";

exports.handler = async (event) => {
  const patientId = event.pathParameters?.patientId;
  if (!patientId) return resp(400, { error: "patientId obrigatório" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resp(400, { error: "Body inválido" });
  }

  const { nome, tipo, tamanho, uploadedBy } = body;

  if (!nome || !tipo) {
    return resp(400, { error: "nome e tipo são obrigatórios" });
  }

  try {
    const ts       = new Date().toISOString();
    const docId    = `${Date.now()}`;
    const s3Key    = `patients/${patientId}/documents/${docId}-${nome}`;

    // gera URL assinada para upload direto do app para o S3
    const putCommand = new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         s3Key,
      ContentType: tipo,
    });
    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 300 }); // 5 min

    // salva metadados no DynamoDB
    await dynamo.send(new PutCommand({
      TableName: "ApsiCare",
      Item: {
        PK:         `PATIENT#${patientId}`,
        SK:         `DOCUMENT#${ts}`,
        type:       "DOCUMENT",
        nome,
        tipo,
        tamanho:    tamanho || "Desconhecido",
        s3Key,
        uploadedBy: uploadedBy || "clinician",
        createdAt:  ts,
      }
    }));

    return resp(200, {
      message:   "URL de upload gerada com sucesso",
      uploadUrl,           // app faz PUT direto nessa URL com o arquivo
      documentId: docId,
      s3Key,
    });
  } catch (err) {
    console.error(err);
    return resp(500, { error: "Erro ao gerar URL de upload" });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});