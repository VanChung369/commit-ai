import { simpleGit } from "simple-git";
import type { SimpleGit, StatusResult } from "simple-git";

export interface GitClientOptions {
  baseDir?: string;
}

export class GitClient {
  private readonly git: SimpleGit;

  constructor(options: GitClientOptions = {}) {
    this.git = simpleGit({
      baseDir: options.baseDir ?? process.cwd(),
    });
  }

  async isRepository(): Promise<boolean> {
    return this.git.checkIsRepo();
  }

  async getStatus(): Promise<StatusResult> {
    return this.git.status();
  }

  async getStagedFiles(): Promise<string[]> {
    const status = await this.getStatus();
    return status.staged;
  }

  async getStagedDiff(): Promise<string> {
    return this.git.diff(["--cached", "--ignore-space-at-eol"]);
  }

  async stageAll(): Promise<void> {
    await this.git.add(".");
  }

  async getDiffAfterOptionalStage(autoStage: boolean): Promise<string> {
    const stagedDiff = await this.getStagedDiff();

    if (stagedDiff || !autoStage) {
      return stagedDiff;
    }

    await this.stageAll();
    return this.getStagedDiff();
  }

  async commit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  async push(): Promise<void> {
    await this.git.push();
  }
}
