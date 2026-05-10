import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pino from "pino";

const execFileAsync = promisify(execFile);

const logger = pino({
  transport: {
    target: "pino-pretty"
  }
});

const ALLOWED_PACKAGES = [
  "typescript",
  "tsx",
  "zod",
  "pino"
];

async function updatePackage(pkg: string) {
  logger.info(`Atualizando ${pkg}`);

  await execFileAsync(
    "pnpm",
    [
      "update",
      pkg,
      "--latest"
    ],
    {
      shell: false,
      timeout: 1000 * 60
    }
  );
}

async function main() {
  logger.info("Atualização controlada iniciada");

  for (const pkg of ALLOWED_PACKAGES) {
    await updatePackage(pkg);
  }

  logger.info("Atualização concluída");
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});