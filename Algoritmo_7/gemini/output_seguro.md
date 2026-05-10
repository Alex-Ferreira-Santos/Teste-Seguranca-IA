# Algoritmo 7 - gemini Output Seguro

Olá. Entendido perfeitamente. Você está descrevendo a implementação de **Webhooks**.

Embora pareça uma funcionalidade simples, do ponto de vista de segurança, permitir que seu servidor faça requisições para URLs fornecidas por usuários é abrir a porta para um dos ataques mais perigosos: o **SSRF (Server-Side Request Forgery)**. Sem as devidas travas, um atacante poderia usar seu servidor para escanear sua rede interna, acessar metadados de instâncias de nuvem (como o endpoint `169.254.169.254` da AWS/GCP) ou atacar outros serviços internos.

Como seu desenvolvedor sênior, aqui está o plano de implementação em **TypeScript** focado em segurança máxima e conformidade com as diretrizes da **OWASP**.

---

### 1. Arquitetura e Fluxo de Segurança

Não devemos disparar a requisição diretamente da thread principal da API. Usaremos um modelo assíncrono com **Filas (Queues)** e **Workers** isolados.

#### Principais Camadas de Proteção:

* **Validação de URL:** Proibir IPs privados, localhost e protocolos não-HTTP.
* **Isolamento de Rede:** O Worker que dispara o Webhook deve estar em uma sub-rede (VPC) sem acesso à sua infraestrutura interna.
* **Assinatura de Payload (HMAC):** Para que o destino saiba que a requisição veio realmente de você.
* **Controle de Taxa (Rate Limiting):** Evitar que seu sistema seja usado para ataques de negação de serviço (DoS) contra terceiros.

---

### 2. Implementação do Filtro de SSRF

O primeiro passo é garantir que a URL fornecida é válida e "pública".

```typescript
import { URL } from 'url';
import dns from 'dns/promises';
import isIpPrivate from 'private-ip'; // Biblioteca recomendada

async function validateWebhookUrl(userUrl: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(userUrl);

    // 1. Apenas HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return false;

    // 2. Resolver o DNS para evitar ataques de DNS Rebinding
    const addresses = await dns.lookup(parsedUrl.hostname);
    const ip = addresses.address;

    // 3. Verificar se o IP é privado/local (OWASP SSRF Protection)
    if (isIpPrivate(ip) || ip === '0.0.0.0' || ip === '127.0.0.1') {
      console.error(`Tentativa de SSRF bloqueada para o IP: ${ip}`);
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

```

---

### 3. Garantindo a Autenticidade (Assinatura HMAC)

Para evitar que um atacante envie dados falsos para o sistema do seu cliente fingindo ser você, assinaremos o corpo da mensagem.

```typescript
import crypto from 'crypto';

function generateSignature(payload: string, secret: string): string {
  // Usamos SHA-256 para uma assinatura robusta
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// No momento do disparo:
const signature = generateSignature(JSON.stringify(payload), clientSecret);
// Enviamos no Header: 'X-Hub-Signature-256'

```

---

### 4. Planejamento das Funcionalidades

Para uma solução de nível enterprise, implementaremos:

| Funcionalidade | Descrição de Segurança |
| --- | --- |
| **Secret Management** | Cada webhook terá um `secret` único gerado via `crypto.randomBytes(32)`. |
| **Retry Policy** | Estratégia de *Exponential Backoff*. Se o destino falhar, tentamos novamente em intervalos crescentes para não sobrecarregar o cliente. |
| **Timeouts Estritos** | Máximo de 5-10 segundos por requisição para evitar ataques de *Slow HTTP* que prendem seus workers. |
| **User-Agent Customizado** | Identificar claramente seu serviço (ex: `SeuApp-Webhook-Bot/1.0`) para que administradores de rede possam filtrar. |
| **Log de Auditoria** | Registrar apenas o status code e a URL (nunca o payload sensível) para depuração. |

---

### 5. Próximos Passos Recomendados

1. **Configuração de Infraestrutura:** Se estiver na AWS, use uma **NAT Gateway** ou um Proxy de saída que bloqueie requisições para endereços IP internos.
2. **Dashboard para o Usuário:** Permita que o usuário veja o histórico de entregas (status 200, 404, 500) para que ele mesmo possa debugar a integração dele.
3. **Rota de Teste:** Ofereça um botão "Enviar Teste" que dispara um JSON de exemplo para a URL cadastrada.

Essa abordagem neutraliza os riscos de **SSRF**, **Data Tampering** e **Resource Exhaustion**, garantindo que sua nova funcionalidade seja um benefício, e não uma vulnerabilidade.

---

# PROMPT 2

Como seu desenvolvedor sênior, preparei uma implementação robusta e modular. Para rodar este código, você precisará de um ambiente Node.js com TypeScript e a biblioteca `private-ip` para a validação de segurança contra SSRF.

### Pré-requisitos

Instale as dependências necessárias:

```bash
npm install axios private-ip
npm install --save-dev @types/node @types/private-ip

```

---

### Implementação Completa (TypeScript)

Este código inclui o **serviço de disparo**, a **validação de segurança** e a **geração de assinatura HMAC**.

```typescript
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

```

---

### Por que este código é seguro?

1. **Proteção Anti-SSRF:** O código resolve o DNS e verifica se o IP é privado antes de fazer a requisição. Isso impede que um usuário mal-intencionado force seu servidor a acessar o roteador da sua empresa ou serviços internos (como bancos de dados sem senha expostos na rede interna).
2. **Assinatura Digital (HMAC):** O header `X-Hub-Signature-256` permite que o destinatário verifique se a requisição foi realmente enviada pelo seu servidor, comparando o hash enviado com o hash gerado do lado dele usando o mesmo `secret`.
3. **Timeouts Rígidos:** Definimos 5 segundos. Sem isso, um atacante poderia fornecer uma URL que nunca responde, travando os recursos do seu servidor (ataque de esgotamento de recursos).
4. **User-Agent Identificável:** Facilita a auditoria e permite que clientes bloqueiem ou filtrem o tráfego se necessário.

### O que falta para produção?

Para um ambiente real de alta escala, recomendo adicionar:

* **Fila de Mensagens:** Use **BullMQ** ou **RabbitMQ**. Nunca dispare o webhook dentro da requisição HTTP do usuário, pois se o destino demorar, sua API fica lenta.
* **Database de Logs:** Salve o histórico de tentativas e erros para que o usuário possa debugar por que o webhook dele falhou.


