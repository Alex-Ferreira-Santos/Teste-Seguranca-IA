// client-example.js
class SearchClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async search(table, filters = {}, options = {}) {
    const params = new URLSearchParams({
      ...filters,
      page: options.page || 1,
      limit: options.limit || 10,
      sort: options.sort || '',
      order: options.order || 'ASC'
    });
    
    const response = await fetch(`${this.baseURL}/api/search/${table}?${params}`);
    return response.json();
  }
  
  async advancedSearch(table, filters, options = {}) {
    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      page: options.page || 1,
      limit: options.limit || 10,
      sort: options.sort || '',
      order: options.order || 'ASC'
    });
    
    const response = await fetch(`${this.baseURL}/api/advanced-search/${table}?${params}`);
    return response.json();
  }
}

// Uso do cliente
const client = new SearchClient('http://localhost:3000');

// Buscar usuários ativos
const usuarios = await client.search('usuarios', { status: 'ativo' });

// Busca avançada
const produtos = await client.advancedSearch('produtos', {
  preco: { gte: 100, lte: 500 },
  nome: { like: 'smart' }
}, { sort: 'preco', order: 'DESC' });