import process from "node:process";
import semver from "semver";
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty"
  }
});

const REQUIRED_NODE = ">=22 <23";

function validateNodeVersion() {
  if (!semver.satisfies(process.version, REQUIRED_NODE)) {
    throw new Error(
      `Node.js incompatível: ${process.version}. Necessário ${REQUIRED_NODE}`
    );
  }
}

function validateRoot() {
  if (process.platform !== "win32") {
    if (typeof process.getuid === "function" && process.getuid() === 0) {
      throw new Error("Não execute este script como root");
    }
  }
}

function validateCI() {
  const blocked = ["production"];

  if (
    process.env.NODE_ENV &&
    blocked.includes(process.env.NODE_ENV.toLowerCase())
  ) {
    throw new Error(
      "Execução bloqueada em ambiente de produção"
    );
  }
}

async function main() {
  logger.info("Validando ambiente");

  validateNodeVersion();
  validateRoot();
  validateCI();

  logger.info("Ambiente validado com sucesso");
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});