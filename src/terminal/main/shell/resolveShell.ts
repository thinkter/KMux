import { resolveDarwinShell } from './darwin';
import { resolveLinuxShell } from './linux';
import { resolveWindowsShell } from './windows';

export interface ResolvedShell {
  command: string;
  args: string[];
  label: string;
}

export const resolveShell = (
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
): ResolvedShell => {
  switch (platform) {
    case 'win32':
      return resolveWindowsShell(env);
    case 'darwin':
      return resolveDarwinShell(env);
    default:
      return resolveLinuxShell(env);
  }
};
