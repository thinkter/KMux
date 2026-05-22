export interface GitWorkingTreeDiffRequest {
  cwd: string;
}

export type GitWorkingTreeDiffResponse =
  | {
      ok: true;
      cwd: string;
      patch: string;
    }
  | {
      ok: false;
      cwd?: string;
      message: string;
    };

export interface DiffApi {
  getGitWorkingTreeDiff: (
    request: GitWorkingTreeDiffRequest,
  ) => Promise<GitWorkingTreeDiffResponse>;
}
