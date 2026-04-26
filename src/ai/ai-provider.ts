export type AiProviderName = "ollama" | "gemini";

export interface GenerateCommitMessageInput {
  diff: string;
  prompt: string;
}

export interface AiProvider {
  readonly name: AiProviderName;

  generateCommitMessage(
    input: GenerateCommitMessageInput,
  ): Promise<string>;
}
