import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedShell } from './resolveShell';

const DARWIN_FALLBACKS = ['/bin/zsh', '/bin/bash', '/bin/sh'];

export const resolveDarwinShell = (env: NodeJS.ProcessEnv): ResolvedShell => {
  const requestedShell = typeof env.SHELL === 'string' ? env.SHELL.trim() : '';
  if (requestedShell.length > 0 && fs.existsSync(requestedShell)) {
    return {
      command: requestedShell,
      args: ['-l'],
      label: path.basename(requestedShell),
    };
  }

  for (const fallback of DARWIN_FALLBACKS) {
    if (fs.existsSync(fallback)) {
      return {
        command: fallback,
        args: ['-l'],
        label: path.basename(fallback),
      };
    }
  }

  return {
    command: '/bin/sh',
    args: ['-l'],
    label: 'sh',
  };
};
