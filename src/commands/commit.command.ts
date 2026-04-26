import { Command } from "commander";
import ora from "ora";
import type { AiProvider, AiProviderName } from "../ai/ai-provider.js";
import { GeminiProvider } from "../ai/gemini.provider.js";
import { OllamaProvider } from "../ai/ollama.provider.js";
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
  language?: "en" | "vi";
  maxLength?: number;
  maxDiffChars?: number;
  numPredict?: number;
  maxOutputTokens?: number;
}

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
      0.2,
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
      4000,
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
      80,
    )
    .action(async (options: CommitCommandOptions) => {
      const spinner = ora("Generating commit message");

      try {
        const language = options.language === "vi" ? "vi" : "en";
        const provider = createProvider(options);

        const result = await runCommitFlow({
          provider,
          push: options.push ?? false,
          autoStage: options.stage ?? true,
          editMessage: options.edit ?? true,
          confirmCommit: !(options.yes ?? false),
          prompt: {
            language,
            maxLength: options.maxLength,
            maxDiffChars: options.maxDiffChars,
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
