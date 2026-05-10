import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pino from "pino";

const execFileAsync = promisify(execFile);

const logger = pino({
  transport: {
    target: "pino-pretty"
  }
});

async function audit() {
  logger.info("Executando auditoria");

  try {
    const { stdout } = await execFileAsync(
      "pnpm",
      [
        "audit",
        "--json"
      ],
      {
        shell: false,
        timeout: 1000 * 60
      }
    );

    const result = JSON.parse(stdout);

    const vulnerabilities = result.metadata?.vulnerabilities;

    if (!vulnerabilities) {
      logger.info("Nenhuma vulnerabilidade encontrada");
      return;
    }

    const critical = vulnerabilities.critical || 0;
    const high = vulnerabilities.high || 0;

    logger.info({
      vulnerabilities
    });

    if (critical > 0 || high > 0) {
      throw new Error(
        "Dependências vulneráveis detectadas"
      );
    }

    logger.info("Auditoria aprovada");
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

audit();