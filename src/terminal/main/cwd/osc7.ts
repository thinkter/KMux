import os from 'node:os';
import type { TerminalCurrentCwd, TerminalCwdSource } from '../../shared/terminal-types.ts';

const ESC = '\u001b';
const BEL = '\u0007';
const OSC7_PREFIX = `${ESC}]7;`;
const MAX_BUFFER_LENGTH = 4096;

export interface ParsedOsc7Cwd {
  path: string;
  host?: string;
  isLocal: boolean;
}

const normalizeHost = (host: string): string | undefined => {
  const trimmed = host.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizePath = (pathname: string): string => {
  const decodedPath = decodeURIComponent(pathname);
  const withoutDrivePrefix = decodedPath.replace(/^\/([A-Za-z]:)([\\/]|$)/, '$1$2');
  if (/^[A-Za-z]:\//.test(withoutDrivePrefix)) {
    return withoutDrivePrefix.replace(/\//g, '\\');
  }
  return withoutDrivePrefix;
};

const parseManualFileUri = (value: string): ParsedOsc7Cwd | null => {
  if (!value.startsWith('file://')) {
    return null;
  }

  const withoutScheme = value.slice('file://'.length);
  const slashIndex = withoutScheme.search(/[\\/]/);
  if (slashIndex === -1) {
    return null;
  }

  const host = normalizeHost(withoutScheme.slice(0, slashIndex));
  const rawPath = withoutScheme.slice(slashIndex);
  const path = normalizePath(rawPath);
  if (path.length === 0) {
    return null;
  }

  return {
    path,
    host,
    isLocal: isLocalOscHost(host),
  };
};

export const isLocalOscHost = (host: string | undefined): boolean => {
  if (!host) {
    return true;
  }

  const normalized = host.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === os.hostname().toLowerCase()
  );
};

export const parseOsc7Payload = (payload: string): ParsedOsc7Cwd | null => {
  try {
    const url = new URL(payload);
    if (url.protocol !== 'file:') {
      return null;
    }

    const host = normalizeHost(url.hostname);
    const path = normalizePath(url.pathname);
    if (path.length === 0) {
      return null;
    }

    return {
      path,
      host,
      isLocal: isLocalOscHost(host),
    };
  } catch {
    return parseManualFileUri(payload);
  }
};

export class Osc7CwdParser {
  private buffer = '';

  public push(chunk: string): ParsedOsc7Cwd[] {
    this.buffer += chunk;
    if (this.buffer.length > MAX_BUFFER_LENGTH) {
      const prefixIndex = this.buffer.lastIndexOf(OSC7_PREFIX);
      this.buffer =
        prefixIndex === -1
          ? ''
          : this.buffer.slice(Math.max(prefixIndex, this.buffer.length - MAX_BUFFER_LENGTH));
    }

    const updates: ParsedOsc7Cwd[] = [];

    while (this.buffer.length > 0) {
      const startIndex = this.buffer.indexOf(OSC7_PREFIX);
      if (startIndex === -1) {
        this.buffer = '';
        break;
      }

      if (startIndex > 0) {
        this.buffer = this.buffer.slice(startIndex);
      }

      const belIndex = this.buffer.indexOf(BEL, OSC7_PREFIX.length);
      const stIndex = this.buffer.indexOf(`${ESC}\\`, OSC7_PREFIX.length);

      let endIndex = -1;
      let terminatorLength = 0;
      if (belIndex !== -1 && (stIndex === -1 || belIndex < stIndex)) {
        endIndex = belIndex;
        terminatorLength = 1;
      } else if (stIndex !== -1) {
        endIndex = stIndex;
        terminatorLength = 2;
      }

      if (endIndex === -1) {
        if (this.buffer.length > MAX_BUFFER_LENGTH) {
          this.buffer = '';
        }
        break;
      }

      const payload = this.buffer.slice(OSC7_PREFIX.length, endIndex);
      const parsed = parseOsc7Payload(payload);
      if (parsed) {
        updates.push(parsed);
      }

      this.buffer = this.buffer.slice(endIndex + terminatorLength);
    }

    return updates;
  }
}

export const toTerminalCurrentCwd = (
  parsed: ParsedOsc7Cwd,
  source: TerminalCwdSource,
): TerminalCurrentCwd => ({
  path: parsed.path,
  host: parsed.host,
  isLocal: parsed.isLocal,
  source,
  updatedAt: Date.now(),
});
