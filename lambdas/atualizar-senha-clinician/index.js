import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, randomBytes, timingSafeEqual } from "crypto"; // Nativo do Node

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const { clinicianId, currentPassword, newPassword } = JSON.parse(event.body);

    const userResult = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" }
    }));

    if (!userResult.Item) return response(404, { error: "Profissional não encontrado." });

    const hashNoBanco = userResult.Item.data?.passwordHash;

    // --- LÓGICA DE COMPARAÇÃO SHA-256 (O seu hash d78e...) ---
    const hashedInput = createHash("sha256").update(currentPassword).digest("hex");
    
    // Compara o hash do que o usuário digitou com o que está no banco
    if (hashedInput !== hashNoBanco) {
      return response(401, { error: "A senha atual está incorreta." });
    }

    // --- GERA O NOVO HASH (Também em SHA-256 para manter o padrão do seu banco) ---
    const newHash = createHash("sha256").update(newPassword).digest("hex");

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" },
      UpdateExpression: "SET #data.passwordHash = :newHash",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":newHash": newHash }
    }));

    return response(200, { message: "Senha alterada com sucesso!" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno." });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});