export interface BuildPromptOptions {
  language?: "en" | "vi";
  maxLength?: number;
  maxDiffChars?: number;
}

const truncateDiff = (diff: string, maxDiffChars: number): string => {
  if (diff.length <= maxDiffChars) {
    return diff;
  }

  return `${diff.slice(0, maxDiffChars)}

[diff truncated]`;
};

export const buildCommitPrompt = (
  diff: string,
  options: BuildPromptOptions = {},
): string => {
  const language = options.language ?? "en";
  const maxLength = options.maxLength ?? 72;
  const maxDiffChars = options.maxDiffChars ?? 10000;
  const preparedDiff = truncateDiff(diff, maxDiffChars);
  const languageRule =
    language === "vi"
      ? "Write the description in Vietnamese."
      : "Write the description in English.";

  return `
Task: write ONE git commit message for the diff.

Return only one line in this exact format:
type(scope): description

Types: feat, fix, refactor, chore, docs, style, test, perf
Rules:
- one line only
- no markdown
- no code block
- no quotes
- no explanation
- do not copy the diff
- max ${maxLength} characters
- ${languageRule}
- if unsure, output: chore(repo): update code

Good examples:
feat(auth): add password reset flow
fix(api): handle empty user response
refactor(cli): simplify option parsing

Diff:
<<<DIFF
${preparedDiff}
DIFF

Answer:
`.trim();
};
