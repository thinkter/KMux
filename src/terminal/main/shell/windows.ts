import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedShell } from './resolveShell';

export const resolveWindowsShell = (env: NodeJS.ProcessEnv): ResolvedShell => {
  const programFiles = env.ProgramW6432 ?? env.ProgramFiles ?? 'C:\\Program Files';
  const programFilesX86 = env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
  const systemRoot = env.SystemRoot ?? 'C:\\Windows';

  const pwshCandidates = [
    path.join(programFiles, 'PowerShell', '7', 'pwsh.exe'),
    path.join(programFilesX86, 'PowerShell', '7', 'pwsh.exe'),
  ];

  for (const candidate of pwshCandidates) {
    if (fs.existsSync(candidate)) {
      return {
        command: candidate,
        args: ['-NoLogo'],
        label: 'PowerShell 7',
      };
    }
  }

  const powershellPath = path.join(
    systemRoot,
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );
  if (fs.existsSync(powershellPath)) {
    return {
      command: powershellPath,
      args: ['-NoLogo'],
      label: 'Windows PowerShell',
    };
  }

  if (typeof env.ComSpec === 'string' && env.ComSpec.trim().length > 0) {
    return {
      command: env.ComSpec,
      args: [],
      label: 'Command Prompt',
    };
  }

  return {
    command: 'cmd.exe',
    args: [],
    label: 'Command Prompt',
  };
};
