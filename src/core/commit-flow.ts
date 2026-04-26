import type { AiProvider } from "../ai/ai-provider.js";
import { GitClient } from "../git/git-client.js";
import { confirmCommitMessage, editCommitMessage } from "./message-editor.js";
import { buildCommitPrompt } from "./prompt-builder.js";
import type { BuildPromptOptions } from "./prompt-builder.js";

export type CommitFlowSkipReason =
  | "not-a-repository"
  | "no-changes"
  | "cancelled";

export interface CommitFlowOptions {
  provider: AiProvider;
  git?: GitClient;
  push?: boolean;
  autoStage?: boolean;
  editMessage?: boolean;
  confirmCommit?: boolean;
  prompt?: BuildPromptOptions;
  onGenerateStart?: () => void;
  onGenerateEnd?: () => void;
}

export interface CommitFlowResult {
  committed: boolean;
  pushed: boolean;
  stagedFiles: string[];
  message?: string;
  reason?: CommitFlowSkipReason;
}

export const runCommitFlow = async (
  options: CommitFlowOptions,
): Promise<CommitFlowResult> => {
  const git = options.git ?? new GitClient();
  const push = options.push ?? false;
  const autoStage = options.autoStage ?? true;
  const editEnabled = options.editMessage ?? true;
  const confirmEnabled = options.confirmCommit ?? true;
  const maxLength = options.prompt?.maxLength ?? 100;

  const isRepository = await git.isRepository();

  if (!isRepository) {
    return {
      committed: false,
      pushed: false,
      stagedFiles: [],
      reason: "not-a-repository",
    };
  }

  const diff = await git.getDiffAfterOptionalStage(autoStage);

  if (!diff) {
    return {
      committed: false,
      pushed: false,
      stagedFiles: [],
      reason: "no-changes",
    };
  }

  const stagedFiles = await git.getStagedFiles();
  const prompt = buildCommitPrompt(diff, options.prompt);
  let generatedMessage: string;

  options.onGenerateStart?.();

  try {
    generatedMessage = await options.provider.generateCommitMessage({
      diff,
      prompt,
    });
  } finally {
    options.onGenerateEnd?.();
  }

  const message = await editCommitMessage(generatedMessage, {
    enabled: editEnabled,
    maxLength,
  });
  const shouldCommit = confirmEnabled
    ? await confirmCommitMessage(message)
    : true;

  if (!shouldCommit) {
    return {
      committed: false,
      pushed: false,
      stagedFiles,
      message,
      reason: "cancelled",
    };
  }

  await git.commit(message);

  if (push) {
    await git.push();
  }

  return {
    committed: true,
    pushed: push,
    stagedFiles,
    message,
  };
};
