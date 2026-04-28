import test from "node:test";
import assert from "node:assert/strict";
import { GeminiProvider } from "../dist/ai/gemini.provider.js";

test("GeminiProvider sends API key as X-goog-api-key header", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  let requestInit;

  globalThis.fetch = async (url, init) => {
    requestUrl = String(url);
    requestInit = init;

    return new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [{ text: "feat(cli): add gemini provider" }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      model: "gemini-test",
      baseUrl: "https://example.test/v1beta",
    });
    const message = await provider.generateCommitMessage({
      diff: "diff",
      prompt: "prompt",
    });

    assert.equal(message, "feat(cli): add gemini provider");
    assert.equal(requestUrl, "https://example.test/v1beta/models/gemini-test:generateContent");
    assert.equal(requestInit.headers["X-goog-api-key"], "test-key");
    assert.equal(requestUrl.includes("?key="), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GeminiProvider joins all returned text parts", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [{ text: "fix(api): " }, { text: "handle null response" }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    const provider = new GeminiProvider({ apiKey: "test-key" });
    const message = await provider.generateCommitMessage({
      diff: "diff",
      prompt: "prompt",
    });

    assert.equal(message, "fix(api): handle null response");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GeminiProvider disables thinking with thinkingBudget for 2.5 models", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);

    return new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [{ text: "chore(repo): update code" }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      model: "gemini-2.5-flash",
      thinking: false,
    });

    await provider.generateCommitMessage({
      diff: "diff",
      prompt: "prompt",
    });

    assert.deepEqual(requestBody.generationConfig.thinkingConfig, {
      thinkingBudget: 0,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GeminiProvider uses minimal thinking for Gemini 3 models", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);

    return new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [{ text: "chore(repo): update code" }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      model: "gemini-3-flash-preview",
      thinking: false,
    });

    await provider.generateCommitMessage({
      diff: "diff",
      prompt: "prompt",
    });

    assert.deepEqual(requestBody.generationConfig.thinkingConfig, {
      thinkingLevel: "minimal",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GeminiProvider omits thinking config when thinking is enabled", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);

    return new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [{ text: "chore(repo): update code" }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      thinking: true,
    });

    await provider.generateCommitMessage({
      diff: "diff",
      prompt: "prompt",
    });

    assert.equal(requestBody.generationConfig.thinkingConfig, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GeminiProvider rejects unusable truncated responses", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: "MAX_TOKENS",
            content: {
              parts: [{ text: "feat(cli" }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    const provider = new GeminiProvider({
      apiKey: "test-key",
      maxOutputTokens: 1,
    });

    await assert.rejects(
      () =>
        provider.generateCommitMessage({
          diff: "diff",
          prompt: "prompt",
        }),
      /Gemini response was truncated/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
