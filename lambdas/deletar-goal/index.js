import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const goalId = event.pathParameters?.goalId;

    if (!patientId || !goalId) {
      return response(400, { error: "patientId e goalId são obrigatórios" });
    }

    await dynamo.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `GOAL#${goalId}`
      }
    }));

    return response(200, { message: "Meta removida com sucesso" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});