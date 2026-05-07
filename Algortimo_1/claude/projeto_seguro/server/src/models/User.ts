// ============================================================
//  MODELO DE USUÁRIO
//  Em produção real, substitua este armazenamento em memória
//  por um banco de dados (PostgreSQL, MySQL, MongoDB, etc.)
// ============================================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;         // NUNCA armazene senha em texto puro
  createdAt: Date;
  failedLoginAttempts: number;  // Contador para bloqueio de conta
  lockedUntil: Date | null;     // Bloqueio temporário após falhas (OWASP A07)
  lastLoginAt: Date | null;
}

// Simulação de banco de dados em memória
// ⚠️ ATENÇÃO: Em produção, use um banco de dados real!
const users: Map<string, User> = new Map();

export const UserStore = {
  findByEmail(email: string): User | undefined {
    return Array.from(users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
  },

  findById(id: string): User | undefined {
    return users.get(id);
  },

  create(user: User): User {
    users.set(user.id, user);
    return user;
  },

  update(id: string, updates: Partial<User>): User | undefined {
    const user = users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    users.set(id, updated);
    return updated;
  },

  emailExists(email: string): boolean {
    return !!this.findByEmail(email);
  }
};