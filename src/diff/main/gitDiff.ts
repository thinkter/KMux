import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {
  GitWorkingTreeDiffRequest,
  GitWorkingTreeDiffResponse,
} from '../shared/diff-types';

const MAX_DIFF_BYTES = 20 * 1024 * 1024;

export interface GitDiffRuntime {
  statSync: typeof fs.statSync;
  spawn: typeof spawn;
}

const defaultRuntime: GitDiffRuntime = {
  statSync: fs.statSync,
  spawn,
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const hasExactGitDirectory = (cwd: string, runtime: GitDiffRuntime): boolean => {
  try {
    return runtime.statSync(path.join(cwd, '.git')).isDirectory();
  } catch {
    return false;
  }
};

const isLocalAbsolutePath = (cwd: string): boolean => {
  return path.isAbsolute(cwd);
};

export const getGitWorkingTreeDiff = async (
  request: GitWorkingTreeDiffRequest,
  runtime: GitDiffRuntime = defaultRuntime,
): Promise<GitWorkingTreeDiffResponse> => {
  const cwd = request.cwd.trim();

  if (!isLocalAbsolutePath(cwd)) {
    return {
      ok: false,
      cwd,
      message: 'Diffs can only be opened for local absolute folders.',
    };
  }

  if (!hasExactGitDirectory(cwd, runtime)) {
    return {
      ok: false,
      cwd,
      message: 'This folder does not contain a .git directory.',
    };
  }

  return new Promise<GitWorkingTreeDiffResponse>((resolve) => {
    const child = runtime.spawn(
      'git',
      ['-C', cwd, 'diff', '--no-ext-diff', '--no-color', 'HEAD', '--'],
      {
        shell: false,
        windowsHide: true,
      },
    );

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let settled = false;

    const finish = (response: GitWorkingTreeDiffResponse): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(response);
    };

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength;
      if (stdoutBytes > MAX_DIFF_BYTES) {
        child.kill();
        finish({
          ok: false,
          cwd,
          message: 'Diff is too large to display.',
        });
        return;
      }
      stdoutChunks.push(chunk);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('error', (error) => {
      finish({
        ok: false,
        cwd,
        message: `Unable to run git: ${toErrorMessage(error)}`,
      });
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
      if (code !== 0) {
        finish({
          ok: false,
          cwd,
          message: stderr || `git diff exited with code ${code ?? 'unknown'}.`,
        });
        return;
      }

      finish({
        ok: true,
        cwd,
        patch: Buffer.concat(stdoutChunks).toString('utf8'),
      });
    });
  });
};
