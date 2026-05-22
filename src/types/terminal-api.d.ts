import type { DiffApi } from '../diff/shared/diff-types';
import type { TerminalApi } from '../terminal/shared/terminal-types';

declare global {
  interface Window {
    diffApi: DiffApi;
    terminalApi: TerminalApi;
  }
}

export {};
