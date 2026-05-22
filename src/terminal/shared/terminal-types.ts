import type { TerminalProfile, TerminalProfileId } from './terminal-profiles';
export type { TerminalProfile, TerminalProfileId } from './terminal-profiles';

export type TerminalStatus = 'starting' | 'running' | 'exited' | 'error';
export type TerminalCwdSource = 'initial' | 'osc7' | 'procfs' | 'lsof' | 'shell-hook';

export interface TerminalCurrentCwd {
  path: string;
  host?: string;
  isLocal: boolean;
  source: TerminalCwdSource;
  updatedAt: number;
}

export interface TerminalSessionSnapshot {
  terminalId: string;
  pid: number | null;
  profileId?: TerminalProfileId;
  shell: string;
  foregroundProcess?: string;
  cwd: string;
  currentCwd?: TerminalCurrentCwd;
  cols: number;
  rows: number;
  status: TerminalStatus;
  exitCode?: number;
  signal?: number;
  errorMessage?: string;
}

export interface CreateTerminalRequest {
  terminalId: string;
  cols: number;
  rows: number;
  cwd?: string;
  profileId?: TerminalProfileId;
}

export interface WriteTerminalRequest {
  terminalId: string;
  data: string;
}

export interface ResizeTerminalRequest {
  terminalId: string;
  cols: number;
  rows: number;
}

export interface KillTerminalRequest {
  terminalId: string;
}

export interface TerminalOutputEvent {
  terminalId: string;
  data: string;
}

export interface TerminalExitEvent {
  terminalId: string;
  exitCode: number;
  signal?: number;
}

export interface TerminalStateEvent {
  terminalId: string;
  snapshot: TerminalSessionSnapshot;
}

export interface TerminalErrorEvent {
  terminalId: string;
  message: string;
}

export interface TerminalApi {
  createTerminal: (request: CreateTerminalRequest) => Promise<TerminalSessionSnapshot>;
  writeTerminal: (request: WriteTerminalRequest) => Promise<void>;
  resizeTerminal: (request: ResizeTerminalRequest) => Promise<void>;
  killTerminal: (request: KillTerminalRequest) => Promise<void>;
  listTerminals: () => Promise<TerminalSessionSnapshot[]>;
  listTerminalProfiles: () => Promise<TerminalProfile[]>;
  onTerminalOutput: (listener: (event: TerminalOutputEvent) => void) => () => void;
  onTerminalExit: (listener: (event: TerminalExitEvent) => void) => () => void;
  onTerminalState: (listener: (event: TerminalStateEvent) => void) => () => void;
  onTerminalError: (listener: (event: TerminalErrorEvent) => void) => () => void;
}
