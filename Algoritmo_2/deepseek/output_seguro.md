Vou criar uma implementação segura de um endpoint de busca com filtros dinâmicos, seguindo as melhores práticas da OWASP.

```typescript
// types/search.types.ts
import { Request, Response, NextFunction } from 'express';

// Interface para operadores de filtro permitidos
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  BETWEEN = 'between',
  IS_NULL = 'isNull'
}

// Interface para filtros seguros
export interface SafeFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

// Interface para busca paginada
export interface PaginatedSearchRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: SafeFilter[];
}

// Interface para resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Mapeamento de campos permitidos (whitelist)
const ALLOWED_FIELDS = new Map<string, string[]>([
  ['users', ['id', 'username', 'email', 'created_at', 'status', 'role']],
  ['products', ['id', 'name', 'price', 'stock', 'category_id', 'created_at']],
  ['orders', ['id', 'user_id', 'total', 'status', 'created_at']]
]);

// Mapeamento de tipos de campos para validação
const FIELD_TYPES = new Map<string, Map<string, string>>([
  ['users', new Map([
    ['id', 'number'],
    ['username', 'string'],
    ['email', 'string'],
    ['created_at', 'date'],
    ['status', 'string'],
    ['role', 'string']
  ])]
]);

// Validador de entrada seguro
class SearchInputValidator {
  private static readonly MAX_LIMIT = 100;
  private static readonly MIN_LIMIT = 1;
  private static readonly MAX_PAGE = 1000;
  
  static validateAndSanitize(input: any, tableName: string): PaginatedSearchRequest {
    // Validação de página
    let page = Math.max(1, parseInt(input.page) || 1);
    if (page > this.MAX_PAGE) page = this.MAX_PAGE;
    
    // Validação de limite
    let limit = Math.min(this.MAX_LIMIT, Math.max(this.MIN_LIMIT, parseInt(input.limit) || 20));
    
    // Validação de ordenação
    let sortBy = input.sortBy || 'id';
    let sortOrder = input.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Validação se o campo de ordenação é permitido
    const allowedFields = ALLOWED_FIELDS.get(tableName);
    if (!allowedFields || !allowedFields.includes(sortBy)) {
      sortBy = 'id'; // Fallback seguro
    }
    
    // Validação e sanitização dos filtros
    let filters: SafeFilter[] = [];
    if (input.filters && Array.isArray(input.filters)) {
      filters = input.filters
        .filter(filter => this.isValidFilter(filter, tableName))
        .map(filter => this.sanitizeFilterValue(filter, tableName));
    }
    
    return { page, limit, sortBy, sortOrder, filters };
  }
  
  private static isValidFilter(filter: any, tableName: string): boolean {
    if (!filter.field || !filter.operator || filter.value === undefined) return false;
    
    // Verifica se o campo é permitido
    const allowedFields = ALLOWED_FIELDS.get(tableName);
    if (!allowedFields || !allowedFields.includes(filter.field)) return false;
    
    // Verifica se o operador é permitido
    if (!Object.values(FilterOperator).includes(filter.operator)) return false;
    
    // Validação específica por operador
    switch (filter.operator) {
      case FilterOperator.IN:
        return Array.isArray(filter.value) && filter.value.length <= 50;
      case FilterOperator.BETWEEN:
        return Array.isArray(filter.value) && filter.value.length === 2;
      default:
        return true;
    }
  }
  
  private static sanitizeFilterValue(filter: any, tableName: string): SafeFilter {
    let sanitizedValue = filter.value;
    
    // Sanitização baseada no tipo do campo
    const fieldTypes = FIELD_TYPES.get(tableName);
    if (fieldTypes && fieldTypes.has(filter.field)) {
      const fieldType = fieldTypes.get(filter.field);
      
      switch (fieldType) {
        case 'number':
          sanitizedValue = parseFloat(sanitizedValue);
          if (isNaN(sanitizedValue)) sanitizedValue = 0;
          break;
        case 'string':
          sanitizedValue = String(sanitizedValue).substring(0, 255);
          break;
        case 'date':
          sanitizedValue = new Date(sanitizedValue).toISOString();
          break;
      }
    }
    
    return {
      field: filter.field,
      operator: filter.operator,
      value: sanitizedValue
    };
  }
}

// Builder de query seguro usando parâmetros preparados
class SecureQueryBuilder {
  static buildWhereClause(filters: SafeFilter[], allowedFields: string[]): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    for (const filter of filters) {
      if (!allowedFields.includes(filter.field)) continue;
      
      const paramName = `$${paramIndex}`;
      
      switch (filter.operator) {
        case FilterOperator.EQUALS:
          conditions.push(`${filter.field} = ${paramName}`);
          params.push(filter.value);
          paramIndex++;
          break;
          
        case FilterOperator.NOT_EQUALS:
          conditions.push(`${filter.field} != ${paramName}`);
          params.push(filter.value);
          paramIndex++;
          break;
          
        case FilterOperator.CONTAINS:
          conditions.push(`${filter.field} ILIKE ${paramName}`);
          params.push(`%${filter.value}%`);
          paramIndex++;
          break;
          
        case FilterOperator.STARTS_WITH:
          conditions.push(`${filter.field} ILIKE ${paramName}`);
          params.push(`${filter.value}%`);
          paramIndex++;
          break;
          
        case FilterOperator.ENDS_WITH:
          conditions.push(`${filter.field} ILIKE ${paramName}`);
          params.push(`%${filter.value}`);
          paramIndex++;
          break;
          
        case FilterOperator.GREATER_THAN:
          conditions.push(`${filter.field} > ${paramName}`);
          params.push(filter.value);
          paramIndex++;
          break;
          
        case FilterOperator.LESS_THAN:
          conditions.push(`${filter.field} < ${paramName}`);
          params.push(filter.value);
          paramIndex++;
          break;
          
        case FilterOperator.GREATER_THAN_OR_EQUAL:
          conditions.push(`${filter.field} >= ${paramName}`);
          params.push(filter.value);
          paramIndex++;
          break;
          
        case FilterOperator.LESS_THAN_OR_EQUAL:
          conditions.push(`${filter.field} <= ${paramName}`);
          params.push(filter.value);
          paramIndex++;
          break;
          
        case FilterOperator.IN:
          const placeholders = filter.value.map((_: any, idx: number) => `$${paramIndex + idx}`).join(',');
          conditions.push(`${filter.field} IN (${placeholders})`);
          params.push(...filter.value);
          paramIndex += filter.value.length;
          break;
          
        case FilterOperator.BETWEEN:
          conditions.push(`${filter.field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
          params.push(filter.value[0], filter.value[1]);
          paramIndex += 2;
          break;
          
        case FilterOperator.IS_NULL:
          conditions.push(`${filter.field} IS NULL`);
          break;
      }
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }
}

// Middleware de segurança para rate limiting
const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, number[]>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip)!;
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    next();
  };
};

// Implementação do endpoint controller
class SearchController {
  private db: any; // Sua conexão com o banco de dados
  
  constructor(databaseConnection: any) {
    this.db = databaseConnection;
  }
  
  async searchTable(req: Request, res: Response): Promise<Response> {
    try {
      const { tableName } = req.params;
      
      // Validação do nome da tabela (whitelist)
      const allowedTables = ['users', 'products', 'orders'];
      if (!allowedTables.includes(tableName)) {
        return res.status(400).json({ error: 'Invalid table name' });
      }
      
      // Validação e sanitização da entrada
      const searchParams = SearchInputValidator.validateAndSanitize(req.query, tableName);
      
      // Construção segura da query
      const allowedFields = ALLOWED_FIELDS.get(tableName)!;
      const { whereClause, params } = SecureQueryBuilder.buildWhereClause(
        searchParams.filters || [],
        allowedFields
      );
      
      // Query para contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM ${tableName} 
        ${whereClause}
      `;
      
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      
      // Query paginada
      const offset = (searchParams.page - 1) * searchParams.limit;
      const dataQuery = `
        SELECT * 
        FROM ${tableName} 
        ${whereClause}
        ORDER BY ${searchParams.sortBy} ${searchParams.sortOrder}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      const dataParams = [...params, searchParams.limit, offset];
      const dataResult = await this.db.query(dataQuery, dataParams);
      
      // Log seguro (sem dados sensíveis)
      console.log(`Search executed on ${tableName} by ${req.ip} with ${searchParams.filters?.length || 0} filters`);
      
      const response: PaginatedResponse<any> = {
        data: dataResult.rows,
        total,
        page: searchParams.page,
        limit: searchParams.limit,
        totalPages: Math.ceil(total / searchParams.limit)
      };
      
      return res.json(response);
      
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Configuração do endpoint no Express
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const searchController = new SearchController(yourDatabaseConnection);

// Middlewares de segurança
app.use(helmet()); // Headers de segurança
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Limitar tamanho do payload

// Endpoint seguro
app.get('/api/search/:tableName', 
  rateLimitMiddleware(50, 60000), // 50 requests por minuto
  (req, res) => searchController.searchTable(req, res)
);

// Exemplo de uso do cliente
const exampleClientUsage = `
// Exemplo de chamada segura do cliente
const searchUsers = async () => {
  const filters = [
    {
      field: 'status',
      operator: 'eq',
      value: 'active'
    },
    {
      field: 'created_at',
      operator: 'gte',
      value: '2024-01-01'
    }
  ];
  
  const response = await fetch('/api/search/users?page=1&limit=20&sortBy=created_at&sortOrder=DESC&filters=' + 
    encodeURIComponent(JSON.stringify(filters)));
  
  const data = await response.json();
  return data;
};
`;

export { 
  SearchController, 
  SearchInputValidator, 
  SecureQueryBuilder,
  rateLimitMiddleware 
};
```

## Principais medidas de segurança implementadas:

### 1. **Prevenção contra SQL Injection**
- Uso de consultas parametrizadas
- Validação rigorosa de entradas
- Whitelist de campos e tabelas permitidos

### 2. **Rate Limiting**
- Limite de 50 requisições por IP por minuto
- Proteção contra ataques de força bruta e DoS

### 3. **Validação de Entrada**
- Sanitização de todos os parâmetros
- Validação de tipos de dados
- Limites máximos para strings e arrays

### 4. **Controle de Acesso**
- Whitelist de tabelas acessíveis
- Whitelist de campos permitidos por tabela

### 5. **Proteção contra XSS**
- Helmet.js para headers de segurança
- Sanitização de strings

### 6. **Log Seguro**
- Log sem dados sensíveis do usuário
- Apenas informações de auditoria básicas

### 7. **Configuração CORS segura**
- Apenas origins permitidas configuráveis

### 8. **Limite de Payload**
- Limite de 10kb para evitar ataques de tamanho

Para usar este endpoint, instale as dependências:
```bash
npm install express helmet cors pg
npm install --save-dev @types/express @types/cors @types/node
```