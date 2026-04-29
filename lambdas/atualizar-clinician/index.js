import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;

    if (!clinicianId) {
      return response(400, { error: "clinicianId ausente" });
    }

    const key = {
      PK: `CLINICIAN#${clinicianId}`,
      SK: "PROFILE"
    };

    console.log("PATH PARAMS:", event.pathParameters);
    console.log("CLINICIAN ID:", clinicianId);
    console.log("PK MONTADA:", `CLINICIAN#${clinicianId}`);

    console.log("KEY USADA:", key);

    const existing = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: key
    }));

    console.log("EXISTE?", existing.Item);

    if (!existing.Item) {
      return response(404, { error: "Não encontrado" });
    }

    const body = JSON.parse(event.body);

    const updatedData = {
      ...existing.Item.data,
      ...body,
      updatedAt: new Date().toISOString()
    };

    const gsi1pk = body.email ? `EMAIL#${body.email.trim().toLowerCase()}` : existing.Item.GSI1PK;

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: "SET #data = :data, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk",
      ExpressionAttributeNames: {
        "#data": "data"
      },
      ExpressionAttributeValues: {
        ":data": updatedData,
        ":gsi1pk": gsi1pk, // Agora o índice de busca será o email novo
        ":gsi1sk": "PROFILE"
      }
    }));

    return response(200, {
      message: "Atualizado com sucesso",
      id: clinicianId
    });

  } catch (err) {
    console.error("ERRO PUT:", err);
    return response(500, { error: "Erro interno" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  body: JSON.stringify(body)
});