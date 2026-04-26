export interface BuildPromptOptions {
  language?: "en" | "vi";
  maxLength?: number;
}

export const buildCommitPrompt = (
  diff: string,
  options: BuildPromptOptions = {},
): string => {
  const language = options.language ?? "en";
  const maxLength = options.maxLength ?? 100;
  const outputLanguage = language === "vi" ? "Vietnamese" : "English";

  return `
You are an expert Git commit message writer.

Generate exactly one Git commit message from the diff below.

Rules:
- Output exactly one line.
- Use Conventional Commits format: type(scope): description.
- Allowed types: feat, fix, refactor, chore, docs, style, test, perf.
- Use a short, specific scope based on the changed module or file.
- Write the description in ${outputLanguage}.
- Use imperative present tense.
- Keep the entire message under ${maxLength} characters.
- Do not use markdown.
- Do not use quotes.
- Do not include explanations.
- Do not include code blocks.
- Do not include emojis.
- Do not end with punctuation.

Examples:
feat(auth): add password reset flow
fix(api): handle empty user response
refactor(cli): simplify option parsing
docs(readme): update setup instructions

If the diff is unclear, return exactly:
chore(repo): update code

Git diff:
${diff}

Commit message:
`.trim();
};
