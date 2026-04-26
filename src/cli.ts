#!/usr/bin/env node

import { Command } from "commander";
import { createCommitCommand } from "./commands/commit.command.js";

const program = new Command();
const commitCommand = createCommitCommand();

program
  .name("commit-ai")
  .description("Generate Git commit messages with self-hosted AI")
  .version("1.0.0")
  .addCommand(commitCommand);

program
  .option("-p, --push", "push after committing")
  .option("--no-edit", "skip editing the generated commit message")
  .option("--no-stage", "do not auto-stage files when no staged diff exists")
  .option("-y, --yes", "skip commit confirmation")
  .option("-m, --model <model>", "Ollama model name", "qwen2.5:1.5b")
  .option("--ollama-url <url>", "Ollama base URL", "http://localhost:11434")
  .option("-t, --temperature <number>", "Ollama generation temperature", "0.2")
  .option("--language <language>", "commit message language: en or vi", "en")
  .option("--max-length <number>", "maximum commit message length", "100")
  .action(async () => {
    const args = ["node", "commit-ai", ...process.argv.slice(2)];
    await commitCommand.parseAsync(args);
  });

await program.parseAsync(process.argv);
