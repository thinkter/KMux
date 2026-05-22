import type { GitWorkingTreeDiffRequest } from './diff-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${fieldName}: expected a non-empty string.`);
  }
}

export const DIFF_IPC_CHANNELS = {
  getGitWorkingTreeDiff: 'diff:get-git-working-tree-diff',
} as const;

export function assertGitWorkingTreeDiffRequest(
  payload: unknown,
): asserts payload is GitWorkingTreeDiffRequest {
  if (!isRecord(payload)) {
    throw new Error('Invalid git-diff payload.');
  }
  assertNonEmptyString(payload.cwd, 'cwd');
}
