import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;
    const body = JSON.parse(event.body);
    const { name, email, phone, birthDate, diagnostico, observacoes } = body;

    if (!clinicianId || !name || !email) {
      return response(400, { error: "Campos obrigatórios: name, email" });
    }

    // Verifica se o psicólogo existe
    const clinician = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLINICIAN#${clinicianId}`,
        SK: "PROFILE"
      }
    }));

    if (!clinician.Item) {
      return response(404, { error: "Psicólogo não encontrado" });
    }

    // Verifica se email já existe como PACIENTE
    const existing = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email}`
      }
    }));

    if (existing.Items.length > 0) {
      const jaExisteComoPatient = existing.Items.some(
        item => item.PK.startsWith("PATIENT#") || item.type === "PATIENT"
      );

      if (jaExisteComoPatient) {
        return response(409, { error: "Email já cadastrado como paciente" });
      }
    }

    // Gera senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const id = uuidv4();
    const now = new Date().toISOString();

    // Registro principal do paciente
    const patientItem = {
      PK: `PATIENT#${id}`,
      SK: `PATIENT#${id}`,
      GSI1PK: `EMAIL#${email}`,
      GSI1SK: `PATIENT#${id}`,
      type: "PATIENT",
      clinicianId,
      name,
      email,
      phone: phone || null,
      birthDate: birthDate || null,
      passwordHash,
      tempPassword,
      mustChangePassword: true,
      isActive: true,
      xpPoints: 0,
      level: 1,
      streakDays: 0,
      diagnostico: diagnostico || null,
      observacoes: observacoes || null,
      createdAt: now,
    };

    // Vínculo com o psicólogo
    const linkItem = {
      PK: `CLINICIAN#${clinicianId}`,
      SK: `PATIENT#${id}`,
      type: "PATIENT_LINK",
      patientId: id,
      name,
      email,
      phone: phone || null,
      birthDate: birthDate || null,
      diagnostico: diagnostico || null,
      observacoes: observacoes || null,
      isActive: true,
      createdAt: now,
    };

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: patientItem }));
    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: linkItem }));

    return response(201, {
      patient: {
        id,
        name,
        email,
        diagnostico: diagnostico || null,
        createdAt: now,
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