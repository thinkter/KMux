import type { IpcMain } from 'electron';
import { assertGitWorkingTreeDiffRequest, DIFF_IPC_CHANNELS } from '../shared/diff-ipc';
import { getGitWorkingTreeDiff } from './gitDiff';

interface RegisterDiffIpcOptions {
  ipcMain: IpcMain;
}

export const registerDiffIpc = ({ ipcMain }: RegisterDiffIpcOptions): (() => void) => {
  ipcMain.handle(DIFF_IPC_CHANNELS.getGitWorkingTreeDiff, (_event, payload: unknown) => {
    assertGitWorkingTreeDiffRequest(payload);
    return getGitWorkingTreeDiff(payload);
  });

  return () => {
    ipcMain.removeHandler(DIFF_IPC_CHANNELS.getGitWorkingTreeDiff);
  };
};
