import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CanvasState, Workspace, Terminal } from '../types';

export const useCanvasStore = create<CanvasState>((set, get) => ({
  workspaces: [
    {
      id: uuidv4(),
      terminals: [
        {
          id: uuidv4(),
          title: 'Terminal 1',
        },
      ],
      activeTerminalIndex: 0,
    },
  ],
  activeWorkspaceIndex: 0,

  moveWorkspace: (direction) => {
    set((state) => {
      let newIndex = state.activeWorkspaceIndex;
      if (direction === 'up') {
        newIndex = Math.max(0, state.activeWorkspaceIndex - 1);
      } else if (direction === 'down') {
        newIndex = Math.min(state.workspaces.length - 1, state.activeWorkspaceIndex + 1);
      }
      return { activeWorkspaceIndex: newIndex };
    });
  },

  moveTerminal: (direction) => {
    set((state) => {
      const activeWorkspace = state.workspaces[state.activeWorkspaceIndex];
      let newTerminalIndex = activeWorkspace.activeTerminalIndex;

      if (direction === 'left') {
        newTerminalIndex = Math.max(0, activeWorkspace.activeTerminalIndex - 1);
      } else if (direction === 'right') {
        newTerminalIndex = Math.min(activeWorkspace.terminals.length - 1, activeWorkspace.activeTerminalIndex + 1);
      }

      const updatedWorkspaces = [...state.workspaces];
      updatedWorkspaces[state.activeWorkspaceIndex] = {
        ...activeWorkspace,
        activeTerminalIndex: newTerminalIndex,
      };

      return { workspaces: updatedWorkspaces };
    });
  },

  addTerminal: () => {
    set((state) => {
      const activeWorkspace = state.workspaces[state.activeWorkspaceIndex];
      const newTerminal: Terminal = {
        id: uuidv4(),
        title: `Terminal ${activeWorkspace.terminals.length + 1}`,
      };

      const updatedWorkspace = {
        ...activeWorkspace,
        terminals: [...activeWorkspace.terminals, newTerminal],
        activeTerminalIndex: activeWorkspace.terminals.length,
      };

      const updatedWorkspaces = [...state.workspaces];
      updatedWorkspaces[state.activeWorkspaceIndex] = updatedWorkspace;

      return { workspaces: updatedWorkspaces };
    });
  },

  addWorkspace: () => {
    set((state) => {
      const newWorkspace: Workspace = {
        id: uuidv4(),
        terminals: [
          {
            id: uuidv4(),
            title: 'Terminal 1',
          },
        ],
        activeTerminalIndex: 0,
      };

      return {
        workspaces: [...state.workspaces, newWorkspace],
        activeWorkspaceIndex: state.workspaces.length,
      };
    });
  },

  // Proxies to meet the exact requested names
  moveUp: () => get().moveWorkspace('up'),
  moveDown: () => get().moveWorkspace('down'),
  moveLeft: () => get().moveTerminal('left'),
  moveRight: () => get().moveTerminal('right'),
  spawnTerminal: () => get().addTerminal(),
}));
