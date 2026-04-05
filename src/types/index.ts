export interface Terminal {
  id: string;
  title: string;
}

export interface Workspace {
  id: string;
  terminals: Terminal[];
  activeTerminalIndex: number; // horizontal offset 0, 1, 2...
}

export interface CanvasState {
  workspaces: Workspace[];
  activeWorkspaceIndex: number; // vertical offset 0, 1, 2...

  // From specific interface definition
  moveWorkspace: (direction: 'up' | 'down') => void;
  moveTerminal: (direction: 'left' | 'right') => void;
  addTerminal: () => void;
  addWorkspace: () => void;

  // Exact names mentioned in Sujal's responsibilities
  moveRight: () => void;
  moveLeft: () => void;
  moveUp: () => void;
  moveDown: () => void;
  spawnTerminal: () => void;
}
