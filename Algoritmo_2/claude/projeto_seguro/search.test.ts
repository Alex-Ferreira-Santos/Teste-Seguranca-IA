import { describe, it, expect } from "vitest";

/**
 * Testes isolados — sem banco de dados real.
 * Copia das funções internas para validação unitária.
 */

const ALLOWED_COLUMNS = ["id", "name", "email", "status", "created_at", "updated_at"] as const;
const ALLOWED_OPERATORS = ["eq", "neq", "lt", "lte", "gt", "gte", "like", "ilike"] as const;

const SQL_OPERATOR_MAP: Record<string, string> = {
  eq: "=", neq: "<>", lt: "<", lte: "<=", gt: ">", gte: ">=", like: "LIKE", ilike: "ILIKE",
};

function buildParams(filters: { column: string; operator: string; value: string }[]) {
  const params: unknown[] = [];
  const conditions: string[] = [];

  for (const { column, operator, value } of filters) {
    if (!ALLOWED_COLUMNS.includes(column as any)) throw new Error("Coluna não permitida");
    if (!ALLOWED_OPERATORS.includes(operator as any)) throw new Error("Operador não permitido");

    const sqlOp = SQL_OPERATOR_MAP[operator];
    let paramValue: unknown = value;

    if (operator === "like" || operator === "ilike") {
      paramValue = `%${value.replace(/[%_\\]/g, "\\$&")}%`;
    }

    params.push(paramValue);
    conditions.push(`"${column}" ${sqlOp} $${params.length}`);
  }

  return { params, conditions };
}

describe("buildParams – SQL Injection prevention", () => {
  it("usa placeholder $N, nunca interpola valor do usuário", () => {
    const { params, conditions } = buildParams([
      { column: "name", operator: "eq", value: "'; DROP TABLE users; --" },
    ]);

    expect(conditions[0]).toBe('"name" = $1');
    expect(params[0]).toBe("'; DROP TABLE users; --"); // valor vai como parâmetro, não na SQL
  });

  it("rejeita coluna fora da allowlist", () => {
    expect(() =>
      buildParams([{ column: "password_hash", operator: "eq", value: "x" }])
    ).toThrow("Coluna não permitida");
  });

  it("rejeita operador fora da allowlist", () => {
    expect(() =>
      buildParams([{ column: "name", operator: "IN (SELECT" as any, value: "x" }])
    ).toThrow("Operador não permitido");
  });

  it("escapa metacaracteres LIKE", () => {
    const { params } = buildParams([
      { column: "email", operator: "like", value: "100% valid_email\\" },
    ]);
    expect(params[0]).toBe("%100\\% valid\\_email\\\\%");
  });

  it("suporta múltiplos filtros com placeholders incrementais", () => {
    const { params, conditions } = buildParams([
      { column: "status", operator: "eq",  value: "active" },
      { column: "name",   operator: "ilike", value: "João" },
    ]);

    expect(conditions).toEqual(['"status" = $1', '"name" ILIKE $2']);
    expect(params).toEqual(["active", "%João%"]);
  });
});