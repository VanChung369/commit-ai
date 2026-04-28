import Conf from "conf";
import type { AiProviderName } from "../ai/ai-provider.js";
import { CliError } from "../utils/errors.js";

export type CommitLanguage = "en" | "vi";

export interface CommitAiConfig {
  initialized: boolean;
  provider: AiProviderName;
  model?: string;
  ollamaUrl: string;
  geminiApiKey?: string;
  geminiBaseUrl: string;
  temperature: number;
  language: CommitLanguage;
  maxLength: number;
  maxDiffChars: number;
  numPredict: number;
  maxOutputTokens: number;
  thinking: boolean;
  autoStage: boolean;
  editMessage: boolean;
  confirmCommit: boolean;
}

export const defaultConfig: CommitAiConfig = {
  initialized: false,
  provider: "ollama",
  ollamaUrl: "http://localhost:11434",
  geminiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
  temperature: 0,
  language: "en",
  maxLength: 72,
  maxDiffChars: 10000,
  numPredict: 40,
  maxOutputTokens: 1280,
  thinking: false,
  autoStage: true,
  editMessage: true,
  confirmCommit: true,
};

type ConfigKey = keyof CommitAiConfig;

export const configKeys: ConfigKey[] = [
  "initialized",
  "provider",
  "model",
  "ollamaUrl",
  "geminiApiKey",
  "geminiBaseUrl",
  "temperature",
  "language",
  "maxLength",
  "maxDiffChars",
  "numPredict",
  "maxOutputTokens",
  "thinking",
  "autoStage",
  "editMessage",
  "confirmCommit",
];

const config = new Conf<CommitAiConfig>({
  projectName: "gitcai",
  defaults: defaultConfig,
});

const numberKeys = new Set<ConfigKey>([
  "temperature",
  "maxLength",
  "maxDiffChars",
  "numPredict",
  "maxOutputTokens",
]);

const booleanKeys = new Set<ConfigKey>([
  "initialized",
  "thinking",
  "autoStage",
  "editMessage",
  "confirmCommit",
]);

const parseBoolean = (value: string): boolean => {
  if (["true", "1", "yes", "on"].includes(value.toLowerCase())) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(value.toLowerCase())) {
    return false;
  }

  throw new CliError(`Invalid boolean value: ${value}`);
};

export const getConfig = (): CommitAiConfig => ({
  ...defaultConfig,
  ...config.store,
});

export const getConfigPath = (): string => config.path;

export const isConfigInitialized = (): boolean =>
  config.get("initialized", false);

export const getConfigValue = (key: string): unknown => {
  const configKey = parseConfigKey(key);
  return config.get(configKey);
};

export const setConfigValue = (key: string, rawValue: string): void => {
  const configKey = parseConfigKey(key);

  if (
    configKey === "provider" &&
    rawValue !== "ollama" &&
    rawValue !== "gemini"
  ) {
    throw new CliError('Invalid provider. Use "ollama" or "gemini".');
  }

  if (configKey === "language" && rawValue !== "en" && rawValue !== "vi") {
    throw new CliError('Invalid language. Use "en" or "vi".');
  }

  if (numberKeys.has(configKey)) {
    const value = Number(rawValue);

    if (Number.isNaN(value)) {
      throw new CliError(`Invalid number value: ${rawValue}`);
    }

    config.set(configKey, value);
    return;
  }

  if (booleanKeys.has(configKey)) {
    config.set(configKey, parseBoolean(rawValue));
    return;
  }

  config.set(configKey, rawValue);
};

export const setConfigValues = (values: Partial<CommitAiConfig>): void => {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      config.set(key, value);
    }
  }
};

export const resetConfig = (): void => {
  config.clear();
};

const parseConfigKey = (key: string): ConfigKey => {
  if (!configKeys.includes(key as ConfigKey)) {
    throw new CliError(
      `Unknown config key: ${key}. Valid keys: ${configKeys.join(", ")}`,
    );
  }

  return key as ConfigKey;
};
