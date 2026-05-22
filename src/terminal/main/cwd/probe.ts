import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import type { TerminalCurrentCwd } from '../../shared/terminal-types.ts';

export interface CwdProbeRuntime {
  readlink: (targetPath: string) => string;
  runCommand: (command: string, args: string[]) => { status: number | null; stdout: string };
}

const createRuntime = (): CwdProbeRuntime => ({
  readlink: (targetPath) => fs.readlinkSync(targetPath),
  runCommand: (command, args) => {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      windowsHide: true,
    });
    return {
      status: result.status,
      stdout: result.stdout ?? '',
    };
  },
});

export const probeProcessCwd = (
  platform: NodeJS.Platform,
  pid: number,
  runtime: CwdProbeRuntime = createRuntime(),
): TerminalCurrentCwd | null => {
  try {
    if (platform === 'linux') {
      const path = runtime.readlink(`/proc/${pid}/cwd`);
      return {
        path,
        isLocal: true,
        source: 'procfs',
        updatedAt: Date.now(),
      };
    }

    if (platform === 'darwin') {
      const result = runtime.runCommand('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
      if (result.status !== 0) {
        return null;
      }

      const pathLine = result.stdout
        .split(/\r?\n/)
        .find((line) => line.startsWith('n') && line.length > 1);
      if (!pathLine) {
        return null;
      }

      return {
        path: pathLine.slice(1),
        isLocal: true,
        source: 'lsof',
        updatedAt: Date.now(),
      };
    }
  } catch {
    return null;
  }

  return null;
};
