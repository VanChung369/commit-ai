import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("CLI help exposes push and provider options", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    "dist/cli.js",
    "--help",
  ]);

  assert.match(stdout, /--push/);
  assert.match(stdout, /--provider <provider>/);
  assert.match(stdout, /default: 125/);
  assert.match(stdout, /--thinking/);
  assert.match(stdout, /config/);
});

test("config help exposes setup command", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    "dist/cli.js",
    "config",
    "--help",
  ]);

  assert.match(stdout, /setup/);
  assert.match(stdout, /set <key> <value>/);
});
