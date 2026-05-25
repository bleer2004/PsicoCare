const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const s3     = new S3Client({ region: "sa-east-1" });

const BUCKET = "apsicare-documentos-23012668";

exports.handler = async (event) => {
  const patientId = event.pathParameters?.patientId;
  if (!patientId) return resp(400, { error: "patientId obrigatório" });

  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: "ApsiCare",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk":     `PATIENT#${patientId}`,
        ":prefix": "DOCUMENT#"
      },
      ScanIndexForward: false
    }));

    const documents = await Promise.all(
      (result.Items || []).map(async (item) => {
        // gera URL assinada para download (válida por 1 hora)
        let downloadUrl = null;
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: item.s3Key
          });
          downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        } catch (e) {
          console.error("Erro ao gerar URL:", e);
        }

        return {
          id:          item.SK.replace("DOCUMENT#", ""),
          nome:        item.nome,
          tipo:        item.tipo,
          tamanho:     item.tamanho,
          uploadedBy:  item.uploadedBy,
          createdAt:   item.createdAt,
          downloadUrl,
        };
      })
    );

    return resp(200, { documents });
  } catch (err) {
    console.error(err);
    return resp(500, { error: "Erro ao listar documentos" });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});