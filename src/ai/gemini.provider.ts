import type { AiProvider, GenerateCommitMessageInput } from "./ai-provider.js";
import { CliError } from "../utils/errors.js";

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

interface GeminiErrorResponse {
  error?: {
    message?: string;
  };
}

interface GeminiGenerateResponse extends GeminiErrorResponse {
  candidates?: GeminiCandidate[];
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;

  constructor(options: GeminiProviderOptions = {}) {
    const apiKey =
      options.apiKey ??
      process.env.GEMINI_API_KEY ??
      process.env.GEMINI_COMMIT_MESSAGE_API_KEY;

    if (!apiKey) {
      throw new CliError(
        "Missing Gemini API key. Set GEMINI_API_KEY or GEMINI_COMMIT_MESSAGE_API_KEY.",
      );
    }

    this.apiKey = apiKey;
    this.model = options.model ?? "gemini-3-flash-preview";
    this.baseUrl = (
      options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta"
    ).replace(/\/+$/, "");
    this.temperature = options.temperature ?? 0;
    this.maxOutputTokens = options.maxOutputTokens ?? 512;
  }

  async generateCommitMessage(
    input: GenerateCommitMessageInput,
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxOutputTokens,
          },
        }),
      },
    );

    const data = (await response.json()) as GeminiGenerateResponse;

    if (!response.ok) {
      throw new Error(
        `Gemini request failed: ${response.status} ${
          data.error?.message ?? response.statusText
        }`,
      );
    }

    if (data.error?.message) {
      throw new Error(`Gemini error: ${data.error.message}`);
    }

    const candidate = data.candidates?.[0];
    const message = candidate?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!message) {
      throw new Error("Gemini returned an empty commit message");
    }

    if (candidate?.finishReason === "MAX_TOKENS" && !message.includes(":")) {
      throw new Error(
        `Gemini response was truncated. Increase maxOutputTokens above ${this.maxOutputTokens}.`,
      );
    }

    return message;
  }
}
