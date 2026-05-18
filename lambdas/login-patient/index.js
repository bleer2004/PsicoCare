import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return response(400, { error: "Email e senha são obrigatórios" });
    }

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

    const patient = result.Items.find(item => item.PK.startsWith("PATIENT#"));

    if (!patient) {
      return response(401, { error: "Email ou senha incorretos" });
    }

    // Verifica senha — tempPassword direto, senão bcrypt
    let senhaValida = false;
    if (patient.tempPassword && patient.tempPassword === password) {
      senhaValida = true;
    } else {
      senhaValida = await bcrypt.compare(password, patient.passwordHash);
    }

    if (!senhaValida) {
      return response(401, { error: "Email ou senha incorretos" });
    }

    if (!patient.isActive) {
      return response(403, { error: "Conta desativada. Contate seu psicólogo." });
    }

    const patientId = patient.PK.split("#")[1];

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
        mustChangePassword: patient.mustChangePassword || false,
      }
    });

  } catch (err) {
    console.error('ERRO:', err);
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