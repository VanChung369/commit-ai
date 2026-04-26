import { Command } from "commander";
import ora from "ora";
import type { AiProvider, AiProviderName } from "../ai/ai-provider.js";
import { GeminiProvider } from "../ai/gemini.provider.js";
import { OllamaProvider } from "../ai/ollama.provider.js";
import { runInteractiveConfigSetup } from "./config.command.js";
import { getConfig, isConfigInitialized } from "../config/config-store.js";
import type { CommitAiConfig, CommitLanguage } from "../config/config-store.js";
import { runCommitFlow } from "../core/commit-flow.js";
import { CliError, getErrorMessage, getExitCode } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

interface CommitCommandOptions {
  push?: boolean;
  edit?: boolean;
  stage?: boolean;
  yes?: boolean;
  provider?: AiProviderName;
  model?: string;
  ollamaUrl?: string;
  geminiApiKey?: string;
  geminiBaseUrl?: string;
  temperature?: number;
  language?: CommitLanguage;
  maxLength?: number;
  maxDiffChars?: number;
  numPredict?: number;
  maxOutputTokens?: number;
}

type ConfigBackedOptionKey = Extract<
  keyof CommitCommandOptions,
  keyof CommitAiConfig
>;

const parseNumberOption = (value: string): number => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new CliError(`Invalid number: ${value}`);
  }

  return parsed;
};

const parseProviderOption = (value: string): AiProviderName => {
  if (value === "ollama" || value === "gemini") {
    return value;
  }

  throw new CliError(`Invalid provider: ${value}. Use "ollama" or "gemini".`);
};

const createProvider = (options: CommitCommandOptions): AiProvider => {
  const provider = options.provider ?? "ollama";

  if (provider === "gemini") {
    return new GeminiProvider({
      apiKey: options.geminiApiKey,
      baseUrl: options.geminiBaseUrl,
      model: options.model,
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
    });
  }

  return new OllamaProvider({
    baseUrl: options.ollamaUrl,
    model: options.model,
    temperature: options.temperature,
    numPredict: options.numPredict,
  });
};

const hasCliOption = (command: Command, key: string): boolean =>
  command.getOptionValueSource(key) === "cli";

const resolveCommitOptions = (
  options: CommitCommandOptions,
  command: Command,
): CommitCommandOptions & {
  autoStage: boolean;
  editMessage: boolean;
  confirmCommit: boolean;
} => {
  const config = getConfig();

  const resolved: CommitCommandOptions & {
    autoStage: boolean;
    editMessage: boolean;
    confirmCommit: boolean;
  } = {
    provider: config.provider,
    model: config.model,
    ollamaUrl: config.ollamaUrl,
    geminiApiKey: config.geminiApiKey,
    geminiBaseUrl: config.geminiBaseUrl,
    temperature: config.temperature,
    language: config.language,
    maxLength: config.maxLength,
    maxDiffChars: config.maxDiffChars,
    numPredict: config.numPredict,
    maxOutputTokens: config.maxOutputTokens,
    push: options.push ?? false,
    autoStage: config.autoStage,
    editMessage: config.editMessage,
    confirmCommit: config.confirmCommit,
  };

  const optionKeys: ConfigBackedOptionKey[] = [
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
  ];

  const resolvedValues = resolved as unknown as Record<string, unknown>;
  const cliValues = options as unknown as Record<string, unknown>;

  for (const key of optionKeys) {
    if (hasCliOption(command, key)) {
      resolvedValues[key] = cliValues[key];
    }
  }

  if (hasCliOption(command, "stage")) {
    resolved.autoStage = options.stage ?? true;
  }

  if (hasCliOption(command, "edit")) {
    resolved.editMessage = options.edit ?? true;
  }

  if (hasCliOption(command, "yes")) {
    resolved.confirmCommit = !(options.yes ?? false);
  }

  return resolved;
};

export const createCommitCommand = (): Command => {
  const command = new Command("commit");

  command
    .description("Generate a commit message with AI and commit changes")
    .option("-p, --push", "push after committing")
    .option("--no-edit", "skip editing the generated commit message")
    .option("--no-stage", "do not auto-stage files when no staged diff exists")
    .option("-y, --yes", "skip commit confirmation")
    .option(
      "--provider <provider>",
      "AI provider: ollama or gemini",
      parseProviderOption,
      "ollama",
    )
    .option("-m, --model <model>", "model name")
    .option("--ollama-url <url>", "Ollama base URL", "http://localhost:11434")
    .option("--gemini-api-key <key>", "Gemini API key")
    .option(
      "--gemini-base-url <url>",
      "Gemini API base URL",
      "https://generativelanguage.googleapis.com/v1beta",
    )
    .option(
      "-t, --temperature <number>",
      "generation temperature",
      parseNumberOption,
      0,
    )
    .option("--language <language>", "commit message language: en or vi", "en")
    .option(
      "--max-length <number>",
      "maximum commit message length",
      parseNumberOption,
      72,
    )
    .option(
      "--max-diff-chars <number>",
      "maximum diff characters sent to the model",
      parseNumberOption,
      10000,
    )
    .option(
      "--num-predict <number>",
      "maximum tokens Ollama should generate",
      parseNumberOption,
      40,
    )
    .option(
      "--max-output-tokens <number>",
      "maximum tokens Gemini should generate",
      parseNumberOption,
      1280,
    )
    .action(async (options: CommitCommandOptions, command: Command) => {
      const spinner = ora("Generating commit message");

      try {
        if (!isConfigInitialized()) {
          logger.info("First-time setup");
          await runInteractiveConfigSetup();
          logger.success("Config saved");
        }

        const resolvedOptions = resolveCommitOptions(options, command);
        const provider = createProvider(resolvedOptions);

        const result = await runCommitFlow({
          provider,
          push: resolvedOptions.push ?? false,
          autoStage: resolvedOptions.autoStage,
          editMessage: resolvedOptions.editMessage,
          confirmCommit: resolvedOptions.confirmCommit,
          prompt: {
            language: resolvedOptions.language,
            maxLength: resolvedOptions.maxLength,
            maxDiffChars: resolvedOptions.maxDiffChars,
          },
          onGenerateStart: () => {
            spinner.start();
          },
          onGenerateEnd: () => {
            spinner.stop();
          },
        });

        if (result.reason === "not-a-repository") {
          logger.error("Current directory is not a Git repository.");
          process.exitCode = 1;
          return;
        }

        if (result.reason === "no-changes") {
          logger.warn("No changes to commit.");
          return;
        }

        if (result.reason === "cancelled") {
          logger.warn("Commit cancelled.");
          return;
        }

        logger.success("Commit successful");
        logger.muted(`Message: ${result.message}`);

        if (result.pushed) {
          logger.success("Push successful");
        }
      } catch (error) {
        spinner.stop();

        logger.error(`Commit failed: ${getErrorMessage(error)}`);
        process.exitCode = getExitCode(error);
      }
    });

  return command;
};
