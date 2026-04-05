import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { CanvasState, Workspace, Terminal, Theme } from '../types';

export type { Workspace, Terminal };

const WIDTH_CYCLE: Terminal['widthFraction'][] = ['1', '2/3', '1/2', '1/3'];

const THEMES: Record<string, Theme> = {
  standard: {
    name: 'Standard',
    bg: '#0d0806',
    panelBg: 'rgba(13,8,6,0.85)',
    accent: '#ff6e3c',
    text: '#e8dcc8',
    textDim: 'rgba(232,220,200,0.4)',
    border: 'rgba(232,220,200,0.08)',
  },
  midnight: {
    name: 'Midnight Blue',
    bg: '#020617',
    panelBg: 'rgba(2,6,23,0.9)',
    accent: '#38bdf8',
    text: '#f8fafc',
    textDim: 'rgba(248,250,252,0.4)',
    border: 'rgba(248,250,252,0.1)',
  },
  dracula: {
    name: 'Dracula',
    bg: '#282a36',
    panelBg: 'rgba(40,42,54,0.92)',
    accent: '#bd93f9',
    text: '#f8f8f2',
    textDim: 'rgba(248,248,242,0.4)',
    border: 'rgba(248,248,242,0.1)',
  },
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      workspaces: [
        {
          id: uuidv4(),
          terminals: [
            {
              id: uuidv4(),
              title: 'Terminal 1',
              widthFraction: '1',
            },
          ],
          activeTerminalIndex: 0,
        },
      ],
      activeWorkspaceIndex: 0,
      isOverview: false,
      isSearchOpen: false,
      theme: THEMES.standard,

      setTheme: (themeName: string) => {
        const theme = THEMES[themeName.toLowerCase()];
        if (theme) set({ theme });
      },

      toggleSearch: () => {
        set((state) => ({ isSearchOpen: !state.isSearchOpen }));
      },

      jumpToGlobalTerminal: (terminalId: string) => {
        set((state) => {
          let targetWsIndex = -1;
          let targetTermIndex = -1;

          state.workspaces.forEach((ws, wsIdx) => {
            const termIdx = ws.terminals.findIndex((t) => t.id === terminalId);
            if (termIdx !== -1) {
              targetWsIndex = wsIdx;
              targetTermIndex = termIdx;
            }
          });

          if (targetWsIndex === -1) return state;

          const updatedWorkspaces = [...state.workspaces];
          updatedWorkspaces[targetWsIndex] = {
            ...state.workspaces[targetWsIndex],
            activeTerminalIndex: targetTermIndex,
          };

          return {
            workspaces: updatedWorkspaces,
            activeWorkspaceIndex: targetWsIndex,
            isSearchOpen: false,
          };
        });
      },

      moveWorkspace: (direction) => {
        set((state) => {
          const isAtBottom = state.activeWorkspaceIndex === state.workspaces.length - 1;
          
          if (direction === 'down' && isAtBottom) {
            // Auto-create workspace if moving down at the bottom of the stack
            const newWorkspace: Workspace = {
              id: uuidv4(),
              terminals: [{ id: uuidv4(), title: 'Terminal 1', widthFraction: '1' }],
              activeTerminalIndex: 0,
            };
            return {
              workspaces: [...state.workspaces, newWorkspace],
              activeWorkspaceIndex: state.workspaces.length,
            };
          }

          const newIndex =
            direction === 'up'
              ? Math.max(0, state.activeWorkspaceIndex - 1)
              : Math.min(state.workspaces.length - 1, state.activeWorkspaceIndex + 1);
          return { activeWorkspaceIndex: newIndex };
        });
      },

      jumpToTerminal: (index: number) => {
        set((state) => {
          const ws = state.workspaces[state.activeWorkspaceIndex];
          if (!ws) return state;
          const targetIndex = Math.max(0, Math.min(index, ws.terminals.length - 1));
          
          const updatedWorkspaces = [...state.workspaces];
          updatedWorkspaces[state.activeWorkspaceIndex] = {
            ...ws,
            activeTerminalIndex: targetIndex,
          };
          return { workspaces: updatedWorkspaces };
        });
      },

      moveTerminal: (direction) => {
        set((state) => {
          const ws = state.workspaces[state.activeWorkspaceIndex];
          if (!ws || ws.terminals.length === 0) return state;

          const newTerminalIndex =
            direction === 'left'
              ? Math.max(0, ws.activeTerminalIndex - 1)
              : Math.min(ws.terminals.length - 1, ws.activeTerminalIndex + 1);

          const updatedWorkspaces = [...state.workspaces];
          updatedWorkspaces[state.activeWorkspaceIndex] = {
            ...ws,
            activeTerminalIndex: newTerminalIndex,
          };
          return { workspaces: updatedWorkspaces };
        });
      },

      addTerminal: () => {
        set((state) => {
          const ws = state.workspaces[state.activeWorkspaceIndex];
          if (!ws) return state;

          const newTerminal: Terminal = {
            id: uuidv4(),
            title: `Terminal ${ws.terminals.length + 1}`,
            widthFraction: '1',
          };
          const updatedWorkspace: Workspace = {
            ...ws,
            terminals: [...ws.terminals, newTerminal],
            activeTerminalIndex: ws.terminals.length,
          };
          const updatedWorkspaces = [...state.workspaces];
          updatedWorkspaces[state.activeWorkspaceIndex] = updatedWorkspace;
          return { workspaces: updatedWorkspaces };
        });
      },

      removeTerminal: () => {
        set((state) => {
          const ws = state.workspaces[state.activeWorkspaceIndex];
          if (!ws || ws.terminals.length === 0) return state;

          const newTerminals = ws.terminals.filter(
            (_, i) => i !== ws.activeTerminalIndex,
          );
          const newIndex = Math.max(0, ws.activeTerminalIndex - 1);
          const updatedWorkspaces = [...state.workspaces];
          updatedWorkspaces[state.activeWorkspaceIndex] = {
            ...ws,
            terminals: newTerminals,
            activeTerminalIndex: newIndex,
          };
          return { workspaces: updatedWorkspaces };
        });
      },

      resizeTerminal: (direction) => {
        set((state) => {
          const ws = state.workspaces[state.activeWorkspaceIndex];
          if (!ws) return state;
          const term = ws.terminals[ws.activeTerminalIndex];
          if (!term) return state;

          const currentIdx = WIDTH_CYCLE.indexOf(term.widthFraction ?? '1');
          const nextIdx =
            direction === 'shrink'
              ? Math.min(WIDTH_CYCLE.length - 1, currentIdx + 1)
              : Math.max(0, currentIdx - 1);

          const updatedTerminals = [...ws.terminals];
          updatedTerminals[ws.activeTerminalIndex] = {
            ...term,
            widthFraction: WIDTH_CYCLE[nextIdx],
          };
          const updatedWorkspaces = [...state.workspaces];
          updatedWorkspaces[state.activeWorkspaceIndex] = {
            ...ws,
            terminals: updatedTerminals,
          };
          return { workspaces: updatedWorkspaces };
        });
      },

      addWorkspace: () => {
        set((state) => {
          const newWorkspace: Workspace = {
            id: uuidv4(),
            terminals: [{ id: uuidv4(), title: 'Terminal 1', widthFraction: '1' }],
            activeTerminalIndex: 0,
          };
          return {
            workspaces: [...state.workspaces, newWorkspace],
            activeWorkspaceIndex: state.workspaces.length,
          };
        });
      },

      toggleOverview: () => {
        set((state) => ({ isOverview: !state.isOverview }));
      },

      cycleThemes: () => {
        const themeKeys = Object.keys(THEMES);
        const currentThemeName = get().theme.name;
        const currentIdx = themeKeys.indexOf(
          themeKeys.find((k) => THEMES[k].name === currentThemeName) || 'standard'
        );
        const nextIdx = (currentIdx + 1) % themeKeys.length;
        set({ theme: THEMES[themeKeys[nextIdx]] });
      },
    }),
    {
      name: 'kmux-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
