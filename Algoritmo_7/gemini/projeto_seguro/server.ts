import axios from 'axios';
import crypto from 'crypto';
import { URL } from 'url';
import dns from 'dns/promises';
import isIpPrivate from 'private-ip';

/**
 * Interface para os dados do Webhook
 */
interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

class WebhookService {
  private readonly timeout = 5000; // 5 segundos (Segurança: evita travar workers)
  private readonly userAgent = 'MeuSistema-Webhook-Worker/1.0';

  /**
   * Valida se a URL é segura para evitar SSRF (Server-Side Request Forgery)
   * Seguindo recomendações OWASP.
   */
  private async validateUrl(userUrl: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(userUrl);

      // 1. Apenas protocolos seguros
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        return false;
      }

      // 2. Resolve o hostname para IP para evitar DNS Rebinding
      const lookup = await dns.lookup(parsedUrl.hostname);
      const ip = lookup.address;

      // 3. Bloqueia IPs privados, reservados ou localhost
      if (isIpPrivate(ip) || ip === '0.0.0.0' || ip === '::1') {
        console.error(`[SECURITY ALERT] Bloqueada tentativa de acesso a IP privado: ${ip}`);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gera uma assinatura HMAC SHA-256 para o payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Dispara o Webhook com todas as camadas de segurança
   */
  public async sendWebhook(targetUrl: string, secret: string, eventData: any) {
    // Validação de Segurança Crítica
    const isSafe = await this.validateUrl(targetUrl);
    if (!isSafe) {
      throw new Error('URL inválida ou insegura para disparo de Webhook.');
    }

    const payload: WebhookPayload = {
      event: 'action.completed',
      timestamp: new Date().toISOString(),
      data: eventData
    };

    const jsonPayload = JSON.stringify(payload);
    const signature = this.generateSignature(jsonPayload, secret);

    try {
      const response = await axios.post(targetUrl, jsonPayload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          'X-Hub-Signature-256': signature, // O cliente usa isso para validar a origem
        }
      });

      console.log(`[Webhook] Enviado com sucesso! Status: ${response.status}`);
      return response.status;
    } catch (error: any) {
      console.error(`[Webhook] Erro no disparo: ${error.message}`);
      // Aqui você implementaria sua lógica de retry (ex: BullMQ ou RabbitMQ)
      throw error;
    }
  }
}

// --- EXEMPLO DE USO ---

async function executarExemplo() {
  const service = new WebhookService();
  
  // Dados simulados
  const userWebhookUrl = 'https://webhook.site/seu-uuid-aqui'; // Use webhook.site para testar
  const userSecret = 'chave_secreta_do_cliente_123';
  const dadosDaAcao = { id: 1001, status: 'pago', cliente: 'Fulano' };

  console.log('Iniciando disparo de Webhook...');
  
  try {
    await service.sendWebhook(userWebhookUrl, userSecret, dadosDaAcao);
  } catch (err) {
    console.error('Falha na execução.');
  }
}

executarExemplo();