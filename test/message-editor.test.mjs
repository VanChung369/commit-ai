import test from "node:test";
import assert from "node:assert/strict";
import { editCommitMessage } from "../dist/core/message-editor.js";

test("editCommitMessage keeps a valid conventional commit from a code block", async () => {
  const message = await editCommitMessage("```text\nfeat(cli): add push option\n```", {
    enabled: false,
  });

  assert.equal(message, "feat(cli): add push option");
});

test("editCommitMessage extracts a commit message from explanatory text", async () => {
  const message = await editCommitMessage(
    "Commit message: fix(api): handle timeout response.",
    { enabled: false },
  );

  assert.equal(message, "fix(api): handle timeout response");
});

test("editCommitMessage adds repo scope when the model omits scope", async () => {
  const message = await editCommitMessage("feat: add commit flow", {
    enabled: false,
  });

  assert.equal(message, "feat(repo): add commit flow");
});

test("editCommitMessage supports additional conventional commit types", async () => {
  const examples = [
    "build(deps): update package metadata",
    "ci(actions): cache dependencies",
    "revert(repo): restore previous behavior",
  ];

  for (const example of examples) {
    const message = await editCommitMessage(`Suggested commit: ${example}`, {
      enabled: false,
    });

    assert.equal(message, example);
  }
});

test("editCommitMessage preserves breaking change marker", async () => {
  const message = await editCommitMessage("feat(api)!: change auth contract", {
    enabled: false,
  });

  assert.equal(message, "feat(api)!: change auth contract");
});

test("editCommitMessage falls back when no usable message exists", async () => {
  const message = await editCommitMessage("diff --git a/a b/a", {
    enabled: false,
  });

  assert.equal(message, "chore(repo): update code");
});
