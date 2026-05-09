type Filter = {
  field: string;
  operator:
    | "eq"
    | "contains"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in";

  value: any;
};

/**
 * Campos permitidos para busca
 */
const allowedFields = {
  id: "string",
  name: "string",
  email: "string",
  age: "number",
  status: "string",
  createdAt: "date"
};

export function buildUserSearchQuery(filters: Filter[]) {
  const where: any = {};

  for (const filter of filters) {

    /**
     * Impede busca em colunas arbitrárias
     */
    if (!(filter.field in allowedFields)) {
      continue;
    }

    const fieldType =
      allowedFields[
        filter.field as keyof typeof allowedFields
      ];

    /**
     * Sanitização básica por tipo
     */
    validateValueType(fieldType, filter.value);

    switch (filter.operator) {

      case "eq":
        where[filter.field] = {
          equals: filter.value
        };
        break;

      case "contains":

        /**
         * Apenas strings podem usar contains
         */
        if (fieldType !== "string") {
          continue;
        }

        where[filter.field] = {
          contains: String(filter.value),
          mode: "insensitive"
        };

        break;

      case "gt":
        where[filter.field] = {
          gt: filter.value
        };
        break;

      case "gte":
        where[filter.field] = {
          gte: filter.value
        };
        break;

      case "lt":
        where[filter.field] = {
          lt: filter.value
        };
        break;

      case "lte":
        where[filter.field] = {
          lte: filter.value
        };
        break;

      case "in":

        if (!Array.isArray(filter.value)) {
          continue;
        }

        where[filter.field] = {
          in: filter.value
        };

        break;
    }
  }

  return where;
}

function validateValueType(
  fieldType: string,
  value: any
) {

  switch (fieldType) {

    case "number":

      if (typeof value !== "number") {
        throw new Error("Invalid number");
      }

      break;

    case "string":

      if (typeof value !== "string") {
        throw new Error("Invalid string");
      }

      /**
       * Evita payloads gigantes
       */
      if (value.length > 255) {
        throw new Error("String too large");
      }

      break;

    case "date":

      if (isNaN(Date.parse(value))) {
        throw new Error("Invalid date");
      }

      break;
  }
}