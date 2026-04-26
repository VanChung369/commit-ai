import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { OllamaProvider } from "../ai/ollama.provider.js";
import { runCommitFlow } from "../core/commit-flow.js";

interface CommitCommandOptions {
  push?: boolean;
  edit?: boolean;
  stage?: boolean;
  yes?: boolean;
  model?: string;
  ollamaUrl?: string;
  temperature?: number;
  language?: "en" | "vi";
  maxLength?: number;
  maxDiffChars?: number;
  numPredict?: number;
}

const parseNumberOption = (value: string): number => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }

  return parsed;
};

export const createCommitCommand = (): Command => {
  const command = new Command("commit");

  command
    .description("Generate a commit message with Ollama and commit changes")
    .option("-p, --push", "push after committing")
    .option("--no-edit", "skip editing the generated commit message")
    .option("--no-stage", "do not auto-stage files when no staged diff exists")
    .option("-y, --yes", "skip commit confirmation")
    .option("-m, --model <model>", "Ollama model name", "qwen2.5:1.5b")
    .option("--ollama-url <url>", "Ollama base URL", "http://localhost:11434")
    .option(
      "-t, --temperature <number>",
      "Ollama generation temperature",
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
    .action(async (options: CommitCommandOptions) => {
      const spinner = ora("Generating commit message");

      try {
        const language = options.language === "vi" ? "vi" : "en";
        const provider = new OllamaProvider({
          baseUrl: options.ollamaUrl,
          model: options.model,
          temperature: options.temperature,
          numPredict: options.numPredict,
        });

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
          console.log(chalk.red("Current directory is not a Git repository."));
          process.exitCode = 1;
          return;
        }

        if (result.reason === "no-changes") {
          console.log(chalk.yellow("No changes to commit."));
          return;
        }

        if (result.reason === "cancelled") {
          console.log(chalk.yellow("Commit cancelled."));
          return;
        }

        console.log(chalk.green("Commit successful"));
        console.log(chalk.gray(`Message: ${result.message}`));

        if (result.pushed) {
          console.log(chalk.green("Push successful"));
        }
      } catch (error) {
        spinner.stop();
        const message =
          error instanceof Error ? error.message : "Unknown commit error";

        console.error(chalk.red("Commit failed:"), message);
        process.exitCode = 1;
      }
    });

  return command;
};
