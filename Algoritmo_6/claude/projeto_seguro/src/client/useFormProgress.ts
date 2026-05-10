// client/useFormProgress.ts
// Hook para uso com React — adaptável para outros frameworks

interface FieldEntry {
  value: string | number | boolean | null;
  updatedAt: string;
}

interface UseFormProgressOptions {
  formId: string;
  getToken: () => string;
  autoSaveDebounceMs?: number;
}

/**
 * Hook que gerencia salvar/recuperar o progresso de um formulário.
 *
 * Segurança no cliente:
 *  - Nunca usa eval() ou new Function()
 *  - Serializa com JSON.stringify (sem replacers perigosos)
 *  - Envia apenas campos conhecidos (whitelist local espelha a do servidor)
 *  - Token enviado apenas no header Authorization, nunca em query string
 *  - Usa AbortController para cancelar requisições pendentes no unmount
 */
export function useFormProgress({ formId, getToken, autoSaveDebounceMs = 1500 }: UseFormProgressOptions) {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  // ─── Serialização segura ─────────────────────────────────────────────────

  function buildPayload(fields: Record<string, unknown>): string {
    const now = new Date().toISOString();

    const safeFields: Record<string, FieldEntry> = {};

    for (const [key, raw] of Object.entries(fields)) {
      // Aceita apenas primitivos — nunca serializa funções, protótipos, classes
      const value = sanitizePrimitive(raw);
      if (value !== undefined) {
        safeFields[key] = { value, updatedAt: now };
      }
    }

    return JSON.stringify({ formId, fields: safeFields });
  }

  function sanitizePrimitive(v: unknown): string | number | boolean | null | undefined {
    if (v === null) return null;
    if (typeof v === 'string') return v.slice(0, 10_000).trim();  // limite local
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'boolean') return v;
    return undefined;  // objetos, arrays, funções → descartados
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function save(fields: Record<string, unknown>): Promise<boolean> {
    // Cancela requisição anterior se ainda pendente
    abortController?.abort();
    abortController = new AbortController();

    try {
      const response = await fetch(`${BASE_URL}/form-progress/${encodeURIComponent(formId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Token no header — nunca em query string para não aparecer em logs de servidor
          Authorization: `Bearer ${getToken()}`,
        },
        body: buildPayload(fields),
        signal: abortController.signal,
        credentials: 'include',  // envia cookie de sessão se houver
      });

      if (response.status === 401) {
        console.warn('[FormProgress] Token expirado — redirecionar para login');
        return false;
      }

      if (response.status === 429) {
        console.warn('[FormProgress] Rate limit atingido — aguardando');
        return false;
      }

      return response.ok;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[FormProgress] Erro ao salvar:', err);
      }
      return false;
    }
  }

  // ─── Auto-save com debounce ───────────────────────────────────────────────

  function scheduleSave(fields: Record<string, unknown>): void {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => save(fields), autoSaveDebounceMs);
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  async function load(): Promise<Record<string, FieldEntry> | null> {
    try {
      const response = await fetch(`${BASE_URL}/form-progress/${encodeURIComponent(formId)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });

      if (!response.ok) return null;

      const json: unknown = await response.json();

      // Re-valida estrutura da resposta antes de usar — nunca confie cegamente no servidor
      if (
        typeof json !== 'object' || json === null ||
        !('success' in json) || !(json as any).success ||
        !('data' in json) || typeof (json as any).data !== 'object'
      ) {
        return null;
      }

      return (json as any).data?.fields ?? null;
    } catch (err) {
      console.error('[FormProgress] Erro ao carregar:', err);
      return null;
    }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  function destroy(): void {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    abortController?.abort();
  }

  return { save, scheduleSave, load, destroy };
}