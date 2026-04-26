import test from "node:test";
import assert from "node:assert/strict";
import { buildCommitPrompt } from "../dist/core/prompt-builder.js";

test("buildCommitPrompt truncates long diffs", () => {
  const prompt = buildCommitPrompt("a".repeat(50), {
    maxDiffChars: 10,
    maxLength: 72,
  });

  assert.match(prompt, /a{10}/);
  assert.match(prompt, /\[diff truncated\]/);
  assert.doesNotMatch(prompt, /a{50}/);
});

test("buildCommitPrompt applies Vietnamese language rule", () => {
  const prompt = buildCommitPrompt("diff --git a/a b/a", {
    language: "vi",
  });

  assert.match(prompt, /Write the description in Vietnamese/);
});
