import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return response(400, { error: "Email e senha são obrigatórios" });
    }

    // Busca paciente pelo email no GSI
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email.trim().toLowerCase()}`
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(401, { error: "Email ou senha incorretos" });
    }

    const patient = result.Items[0];

    // Verifica se é paciente
    if (!patient.PK.startsWith("PATIENT#")) {
      return response(401, { error: "Email ou senha incorretos" });
    }

    // Verifica senha (SHA-256)
    const passwordHash = createHash("sha256").update(password).digest("hex");
    if (patient.passwordHash !== passwordHash) {
      return response(401, { error: "Email ou senha incorretos" });
    }

    // Verifica se está ativo
    if (!patient.isActive) {
      return response(403, { error: "Conta desativada. Contate seu psicólogo." });
    }

    const patientId = patient.PK.split("#")[1];

    // Gera token JWT
    const token = jwt.sign(
      { id: patientId, email: patient.email, type: "PATIENT" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return response(200, {
      token,
      user: {
        id: patientId,
        name: patient.name,
        email: patient.email,
        type: "PATIENT",
        clinicianId: patient.clinicianId,
      }
    });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
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