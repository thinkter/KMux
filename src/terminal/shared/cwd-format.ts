import type { TerminalCurrentCwd, TerminalSessionSnapshot } from './terminal-types.ts';

export interface CwdHint {
  folder: string;
  shortPath: string;
  fullPath: string;
  host?: string;
}

const trimTrailingSeparators = (value: string): string => {
  if (value === '/' || /^[A-Za-z]:[\\/]?$/.test(value)) {
    return value;
  }
  return value.replace(/[\\/]+$/, '');
};

export const getPathBasename = (value: string): string => {
  const trimmed = trimTrailingSeparators(value);
  if (trimmed === '/') {
    return '/';
  }
  const match = trimmed.match(/[^\\/]+$/);
  return match?.[0] ?? trimmed;
};

const normalizeForCompare = (value: string): string => {
  return trimTrailingSeparators(value).replace(/\\/g, '/').toLowerCase();
};

export const shortenPath = (fullPath: string, initialCwd?: string): string => {
  const trimmedPath = trimTrailingSeparators(fullPath);
  if (!initialCwd || initialCwd.length === 0) {
    return trimmedPath;
  }

  const trimmedHome = trimTrailingSeparators(initialCwd);
  const normalizedPath = normalizeForCompare(trimmedPath);
  const normalizedHome = normalizeForCompare(trimmedHome);
  if (normalizedPath === normalizedHome) {
    return '~';
  }

  const separator = trimmedHome.includes('\\') ? '\\' : '/';
  if (normalizedPath.startsWith(`${normalizedHome}/`)) {
    return `~${separator}${trimmedPath.slice(trimmedHome.length).replace(/^[\\/]+/, '')}`;
  }

  return trimmedPath;
};

export const formatCwdHint = (
  cwd: TerminalCurrentCwd | undefined,
  initialCwd?: string,
): CwdHint | null => {
  if (!cwd || cwd.path.length === 0) {
    return null;
  }

  const folder = getPathBasename(cwd.path);
  const shortPath = shortenPath(cwd.path, cwd.isLocal ? initialCwd : undefined);
  return {
    folder,
    shortPath,
    fullPath: cwd.path,
    host: cwd.host,
  };
};

export const getTerminalSearchText = (
  session: TerminalSessionSnapshot | undefined,
  terminalTitle: string,
  workspaceName: string,
  primaryLabel: string,
): string => {
  const cwdHint = formatCwdHint(session?.currentCwd, session?.cwd);
  return [
    primaryLabel,
    session?.foregroundProcess,
    session?.shell,
    terminalTitle,
    workspaceName,
    cwdHint?.folder,
    cwdHint?.shortPath,
    cwdHint?.fullPath,
    cwdHint?.host,
  ]
    .filter((value): value is string => Boolean(value && value.length > 0))
    .join(' ')
    .toLowerCase();
};
