import { input, password, select } from "@inquirer/prompts";
import { Command } from "commander";
import type { AiProviderName } from "../ai/ai-provider.js";
import {
  configKeys,
  getConfig,
  getConfigPath,
  getConfigValue,
  resetConfig,
  setConfigValues,
  setConfigValue,
} from "../config/config-store.js";
import type { CommitAiConfig, CommitLanguage } from "../config/config-store.js";
import { getErrorMessage, getExitCode } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const printConfig = (): void => {
  const config = getConfig();

  console.log(
    JSON.stringify(
      {
        ...config,
        geminiApiKey: config.geminiApiKey ? "***" : undefined,
      },
      null,
      2,
    ),
  );
};

const formatConfigValue = (key: string, value: unknown): string => {
  if (key === "geminiApiKey" && value) {
    return "***";
  }

  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
};

const askSharedConfig = async (): Promise<
  Pick<CommitAiConfig, "provider" | "language">
> => {
  const currentConfig = getConfig();
  const provider = await select<AiProviderName>({
    message: "Choose AI provider",
    default: currentConfig.provider,
    choices: [
      {
        name: "Ollama",
        value: "ollama",
        description: "Use a local or self-hosted Ollama server",
      },
      {
        name: "Gemini",
        value: "gemini",
        description: "Use Google Gemini API",
      },
    ],
  });

  const language = await select<CommitLanguage>({
    message: "Choose commit message language",
    default: currentConfig.language,
    choices: [
      {
        name: "English",
        value: "en",
      },
      {
        name: "Vietnamese",
        value: "vi",
      },
    ],
  });

  return { provider, language };
};

const askOllamaConfig = async (): Promise<Partial<CommitAiConfig>> => {
  const currentConfig = getConfig();
  const ollamaUrl = await input({
    message: "Ollama base URL",
    default: currentConfig.ollamaUrl,
  });
  const model = await input({
    message: "Ollama model",
    default: currentConfig.model ?? "qwen2.5:1.5b",
  });

  return {
    ollamaUrl,
    model,
  };
};

const askGeminiConfig = async (): Promise<Partial<CommitAiConfig>> => {
  const currentConfig = getConfig();
  const geminiApiKey = await password({
    message: currentConfig.geminiApiKey
      ? "Gemini API key (leave empty to keep current)"
      : "Gemini API key",
    mask: "*",
  });
  const model = await input({
    message: "Gemini model",
    default: currentConfig.model ?? "gemini-3-flash-preview",
  });

  return {
    model,
    ...(geminiApiKey ? { geminiApiKey } : {}),
  };
};

export const runInteractiveConfigSetup = async (): Promise<void> => {
  const sharedConfig = await askSharedConfig();
  const providerConfig =
    sharedConfig.provider === "gemini"
      ? await askGeminiConfig()
      : await askOllamaConfig();

  setConfigValues({
    initialized: true,
    ...sharedConfig,
    ...providerConfig,
  });
};

export const createConfigCommand = (): Command => {
  const command = new Command("config");

  command.description("Manage gitcai configuration");

  command
    .command("setup")
    .description("interactive setup for required config")
    .action(async () => {
      try {
        await runInteractiveConfigSetup();
        logger.success("Config saved");
        logger.muted(getConfigPath());
      } catch (error) {
        logger.error(`Config failed: ${getErrorMessage(error)}`);
        process.exitCode = getExitCode(error);
      }
    });

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
        console.log(formatConfigValue(key, value));
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
