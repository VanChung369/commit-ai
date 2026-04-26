import type { AiProvider, GenerateCommitMessageInput } from "./ai-provider.js";

export interface OllamaProviderOptions {
  baseUrl?: string;
  model?: string;
  temperature?: number;
}

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

export class OllamaProvider implements AiProvider {
  readonly name = "ollama" as const;

  private readonly baseUrl: string;
  private readonly model: string;
  private readonly temperature: number;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "http://localhost:11434").replace(
      /\/+$/,
      "",
    );
    this.model = options.model ?? "qwen2.5:1.5b";
    this.temperature = options.temperature ?? 0.2;
  }

  async generateCommitMessage(
    input: GenerateCommitMessageInput,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: input.prompt,
        stream: false,
        options: {
          temperature: this.temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`);
    }

    const message = data.response?.trim();

    if (!message) {
      throw new Error("Ollama returned an empty commit message");
    }

    return message;
  }
}
