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
    this.temperature = options.temperature ?? 0.2;
    this.maxOutputTokens = options.maxOutputTokens ?? 80;
  }

  async generateCommitMessage(
    input: GenerateCommitMessageInput,
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

    const message = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!message) {
      throw new Error("Gemini returned an empty commit message");
    }

    return message;
  }
}
