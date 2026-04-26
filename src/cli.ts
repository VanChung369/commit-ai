#!/usr/bin/env node

import { Command } from "commander";
import { createCommitCommand } from "./commands/commit.command.js";
import { createConfigCommand } from "./commands/config.command.js";

const program = new Command();
const commitCommand = createCommitCommand();
const configCommand = createConfigCommand();

program
  .name("commit-ai")
  .description("Generate Git commit messages with self-hosted AI")
  .version("1.0.0")
  .addCommand(commitCommand)
  .addCommand(configCommand);

program
  .option("-p, --push", "push after committing")
  .option("--no-edit", "skip editing the generated commit message")
  .option("--no-stage", "do not auto-stage files when no staged diff exists")
  .option("-y, --yes", "skip commit confirmation")
  .option("--provider <provider>", "AI provider: ollama or gemini", "ollama")
  .option("-m, --model <model>", "model name")
  .option("--ollama-url <url>", "Ollama base URL", "http://localhost:11434")
  .option("--gemini-api-key <key>", "Gemini API key")
  .option(
    "--gemini-base-url <url>",
    "Gemini API base URL",
    "https://generativelanguage.googleapis.com/v1beta",
  )
  .option("-t, --temperature <number>", "generation temperature", "0")
  .option("--language <language>", "commit message language: en or vi", "en")
  .option("--max-length <number>", "maximum commit message length", "72")
  .option(
    "--max-diff-chars <number>",
    "maximum diff characters sent to the model",
    "4000",
  )
  .option(
    "--num-predict <number>",
    "maximum tokens Ollama should generate",
    "40",
  )
  .option(
    "--max-output-tokens <number>",
    "maximum tokens Gemini should generate",
    "512",
  )
  .action(async () => {
    const args = ["node", "commit-ai", ...process.argv.slice(2)];
    await commitCommand.parseAsync(args);
  });

await program.parseAsync(process.argv);
