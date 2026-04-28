import { confirm, input } from "@inquirer/prompts";

export interface EditCommitMessageOptions {
  enabled?: boolean;
  maxLength?: number;
}

const fallbackCommitMessage = "chore(repo): update code";

const commitTypes = [
  "feat",
  "fix",
  "refactor",
  "chore",
  "docs",
  "style",
  "test",
  "perf",
  "build",
  "ci",
  "revert",
].join("|");

const conventionalCommitPattern =
  new RegExp(`^(${commitTypes})\\([^)]+\\)!?: .+$`);

const commitMessagePattern =
  new RegExp(
    `\\b(${commitTypes})(?:\\(([^)\\r\\n]+)\\))?(!)?:\\s+([^\\r\\n\`"]+)`,
    "i",
  );

const normalizeGeneratedCommitMessage = (
  generatedMessage: string,
  maxLength: number,
): string => {
  const lines = generatedMessage
    .replace(/```[a-z]*\s*/gi, "")
    .replace(/```/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^["'`]|["'`]$/g, ""))
    .filter(Boolean);

  for (const line of lines) {
    const exactMessage = line.replace(/^[-*]\s*/, "");

    if (
      conventionalCommitPattern.test(exactMessage) &&
      exactMessage.length <= maxLength
    ) {
      return exactMessage;
    }

    const match = exactMessage.match(commitMessagePattern);

    if (!match) {
      continue;
    }

    const type = match[1].toLowerCase();
    const scope = (match[2] ?? "repo").trim().toLowerCase();
    const breakingMarker = match[3] ?? "";
    const description = match[4].trim().replace(/[.!?]+$/, "");
    const normalizedMessage = `${type}(${scope})${breakingMarker}: ${description}`;

    if (normalizedMessage.length <= maxLength) {
      return normalizedMessage;
    }
  }

  return fallbackCommitMessage;
};

const validateCommitMessage = (
  message: string,
  maxLength: number,
): true | string => {
  const trimmed = message.trim();

  if (!trimmed) {
    return "Commit message cannot be empty";
  }

  if (trimmed.length > maxLength) {
    return `Commit message must be ${maxLength} characters or fewer`;
  }

  if (trimmed.includes("\n")) {
    return "Commit message must be one line";
  }

  return true;
};

export const editCommitMessage = async (
  generatedMessage: string,
  options: EditCommitMessageOptions = {},
): Promise<string> => {
  const enabled = options.enabled ?? true;
  const maxLength = options.maxLength ?? 125;
  const initialMessage = normalizeGeneratedCommitMessage(
    generatedMessage,
    maxLength,
  );

  if (!enabled) {
    return initialMessage;
  }

  return input({
    message: "Commit message",
    default: initialMessage,
    validate: (value) => validateCommitMessage(value, maxLength),
  });
};

export const confirmCommitMessage = async (
  message: string,
): Promise<boolean> => {
  return confirm({
    message: `Commit with "${message}"?`,
    default: true,
  });
};
