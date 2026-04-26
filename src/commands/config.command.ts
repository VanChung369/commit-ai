import { Command } from "commander";
import {
  configKeys,
  getConfig,
  getConfigPath,
  getConfigValue,
  resetConfig,
  setConfigValue,
} from "../config/config-store.js";
import { getErrorMessage, getExitCode } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const printConfig = (): void => {
  console.log(JSON.stringify(getConfig(), null, 2));
};

export const createConfigCommand = (): Command => {
  const command = new Command("config");

  command.description("Manage commit-ai configuration");

  command
    .command("list")
    .alias("ls")
    .description("print all config values")
    .action(() => {
      printConfig();
    });

  command
    .command("get")
    .description("print one config value")
    .argument("<key>", `config key: ${configKeys.join(", ")}`)
    .action((key: string) => {
      try {
        const value = getConfigValue(key);
        console.log(
          typeof value === "string" ? value : JSON.stringify(value, null, 2),
        );
      } catch (error) {
        logger.error(`Config failed: ${getErrorMessage(error)}`);
        process.exitCode = getExitCode(error);
      }
    });

  command
    .command("set")
    .description("set one config value")
    .argument("<key>", `config key: ${configKeys.join(", ")}`)
    .argument("<value>", "config value")
    .action((key: string, value: string) => {
      try {
        setConfigValue(key, value);
        logger.success(`Set ${key}`);
      } catch (error) {
        logger.error(`Config failed: ${getErrorMessage(error)}`);
        process.exitCode = getExitCode(error);
      }
    });

  command
    .command("reset")
    .description("reset config to defaults")
    .action(() => {
      resetConfig();
      logger.success("Config reset");
    });

  command
    .command("path")
    .description("print config file path")
    .action(() => {
      logger.muted(getConfigPath());
    });

  command.action(() => {
    printConfig();
  });

  return command;
};
