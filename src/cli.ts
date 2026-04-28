#!/usr/bin/env node

import { Command } from "commander";
import {
  addCommitOptions,
  createCommitCommand,
} from "./commands/commit.command.js";
import { createConfigCommand } from "./commands/config.command.js";

const program = new Command();
const commitCommand = createCommitCommand();
const configCommand = createConfigCommand();

program
  .name("gitcai")
  .description("Generate AI-powered Git commit messages from your diff")
  .version("1.0.0")
  .addCommand(commitCommand)
  .addCommand(configCommand);

addCommitOptions(program)
  .action(async () => {
    const args = ["node", "gitcai", ...process.argv.slice(2)];
    await commitCommand.parseAsync(args);
  });

await program.parseAsync(process.argv);
