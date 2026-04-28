import test from "node:test";
import assert from "node:assert/strict";
import { OllamaProvider } from "../dist/ai/ollama.provider.js";

test("OllamaProvider sends think flag as top-level request option", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);

    return new Response(
      JSON.stringify({
        response: "feat(cli): add thinking config",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const provider = new OllamaProvider({
      model: "qwen3:4b",
      thinking: false,
    });

    const message = await provider.generateCommitMessage({
      diff: "diff",
      prompt: "prompt",
    });

    assert.equal(message, "feat(cli): add thinking config");
    assert.equal(requestBody.think, false);
    assert.equal(requestBody.options.think, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
