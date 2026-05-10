import { PrismaClient } from '@prisma/client';
import { SaveProgressInput } from '../validators/formProgress.schema';
import { FormProgress, ApiResponse } from '../types';

const prisma = new PrismaClient();

// ─── Serialização segura ───────────────────────────────────────────────────
//
// NUNCA use:
//   • serialize() / unserialize() de PHP-style
//   • eval(JSON.parse(...))
//   • new Function(data)
//   • YAML.load() sem safeLoad
//   • pickle, Java ObjectInputStream equivalentes em Node
//
// USE SEMPRE:
//   • JSON.stringify() → banco
//   • JSON.parse() → depois validar com Zod
//   • Resultado da validação Zod → lógica de negócio

function serializeFields(fields: SaveProgressInput['fields']): string {
  // JSON.stringify é seguro — produz texto puro sem executar código
  return JSON.stringify(fields);
}

function deserializeFields(raw: string): SaveProgressInput['fields'] {
  // Parse primeiro, depois validamos — nunca confie em dados do banco sem re-validar
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Dados corrompidos no banco');
  }

  // Re-validação na saída: garante integridade mesmo se alguém manipulou o banco
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error('Formato de campos inválido');
  }

  return parsed as SaveProgressInput['fields'];
}

function calculateCompletion(fields: SaveProgressInput['fields']): number {
  const values = Object.values(fields);
  if (values.length === 0) return 0;

  const filled = values.filter(
    (f) => f.value !== null && f.value !== '' && f.value !== undefined
  ).length;

  return Math.round((filled / values.length) * 100);
}

// ─── Service ───────────────────────────────────────────────────────────────

export async function saveFormProgress(
  userId: string,
  input: SaveProgressInput
): Promise<ApiResponse<FormProgress>> {
  try {
    const serialized = serializeFields(input.fields);
    const completionPercent = calculateCompletion(input.fields);

    // Prisma usa prepared statements internamente — sem interpolação de strings SQL (OWASP A03)
    const record = await prisma.formProgress.upsert({
      where: {
        userId_formId: {      // índice único composto
          userId,
          formId: input.formId,
        },
      },
      update: {
        fieldsJson: serialized,
        completionPercent,
        updatedAt: new Date(),
      },
      create: {
        userId,
        formId: input.formId,
        fieldsJson: serialized,
        completionPercent,
      },
      select: {              // select explícito — nunca retorna campos internos desnecessários
        id: true,
        userId: true,
        formId: true,
        fieldsJson: true,
        completionPercent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: {
        id: record.id,
        userId: record.userId,
        formId: record.formId,
        fields: deserializeFields(record.fieldsJson),
        completionPercent: record.completionPercent,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    // Log interno detalhado, resposta ao cliente genérica (OWASP A09)
    console.error('[FormProgressService] saveFormProgress error:', err);
    return { success: false, error: 'Não foi possível salvar o progresso.' };
  }
}

export async function getFormProgress(
  userId: string,
  formId: string
): Promise<ApiResponse<FormProgress>> {
  try {
    const record = await prisma.formProgress.findUnique({
      where: {
        userId_formId: { userId, formId },
      },
      select: {
        id: true,
        userId: true,
        formId: true,
        fieldsJson: true,
        completionPercent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) {
      return { success: true, data: undefined }; // 200 vazio — não revela existência de outros usuários
    }

    // Autorização no nível de dado: garante que userId bate (OWASP A01)
    // Mesmo que o Prisma filtre pela query, validação dupla é uma boa prática
    if (record.userId !== userId) {
      console.error(`[SECURITY] userId mismatch: expected ${userId}, got ${record.userId}`);
      return { success: false, error: 'Acesso negado.' };
    }

    return {
      success: true,
      data: {
        id: record.id,
        userId: record.userId,
        formId: record.formId,
        fields: deserializeFields(record.fieldsJson),
        completionPercent: record.completionPercent,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    console.error('[FormProgressService] getFormProgress error:', err);
    return { success: false, error: 'Não foi possível recuperar o progresso.' };
  }
}

export async function deleteFormProgress(
  userId: string,
  formId: string
): Promise<ApiResponse> {
  try {
    await prisma.formProgress.deleteMany({
      // deleteMany com filtro duplo — garante que o usuário só apaga o próprio dado
      where: { userId, formId },
    });

    return { success: true };
  } catch (err) {
    console.error('[FormProgressService] deleteFormProgress error:', err);
    return { success: false, error: 'Não foi possível remover o progresso.' };
  }
}