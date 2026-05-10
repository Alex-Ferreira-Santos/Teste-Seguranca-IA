import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pino from "pino";

const execFileAsync = promisify(execFile);

const logger = pino({
  transport: {
    target: "pino-pretty"
  }
});

const TIMEOUT = 1000 * 60 * 5;

async function runCommand(
  command: string,
  args: string[]
) {
  logger.info({
    command,
    args
  });

  const result = await execFileAsync(command, args, {
    shell: false,
    timeout: TIMEOUT,
    maxBuffer: 1024 * 1024 * 10,
    env: {
      ...process.env,
      NODE_ENV: "development"
    }
  });

  if (result.stdout) {
    logger.info(result.stdout);
  }

  if (result.stderr) {
    logger.warn(result.stderr);
  }
}

async function main() {
  logger.info("Iniciando setup seguro");

  await runCommand("node", [
    "--version"
  ]);

  await runCommand("pnpm", [
    "install",
    "--frozen-lockfile",
    "--ignore-scripts"
  ]);

  await runCommand("pnpm", [
    "audit",
    "--prod"
  ]);

  logger.info("Setup concluído");
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});