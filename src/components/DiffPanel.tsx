import { parsePatchFiles } from '@pierre/diffs';
import { CodeView, type CodeViewItem } from '@pierre/diffs/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import type { DiffPanel as DiffPanelItem } from '../types/canvas-types';
import { GAPS_VW } from '../lib/constants';
import { getWidthVWString } from '../utils/layout';

interface Props {
  panel: DiffPanelItem;
  isActive: boolean;
}

type DiffPanelState =
  | { status: 'loading' }
  | { status: 'ready'; items: CodeViewItem[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export const DiffPanel: React.FC<Props> = ({ panel, isActive }) => {
  const { theme, isTerminalFullscreen, focusWorkspaceItem } = useCanvasStore();
  const [panelState, setPanelState] = useState<DiffPanelState>({ status: 'loading' });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPanelState({ status: 'loading' });

    void window.diffApi
      .getGitWorkingTreeDiff({ cwd: panel.cwd })
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setPanelState({ status: 'error', message: response.message });
          return;
        }

        if (response.patch.trim().length === 0) {
          setPanelState({ status: 'empty' });
          return;
        }

        try {
          const items = parsePatchFiles(response.patch).flatMap((patch, patchIndex) =>
            patch.files.map((fileDiff, fileIndex) => ({
              id: `${patchIndex}:${fileIndex}:${fileDiff.name}`,
              type: 'diff' as const,
              fileDiff,
            })),
          );
          setPanelState(items.length > 0 ? { status: 'ready', items } : { status: 'empty' });
        } catch (error) {
          setPanelState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setPanelState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [panel.cwd, refreshKey]);

  const width =
    isTerminalFullscreen && isActive ? '96vw' : getWidthVWString(panel.widthFraction);

  return (
    <section
      onMouseDown={() => {
        if (!isActive) {
          focusWorkspaceItem(panel.id);
        }
      }}
      style={{
        width,
        height: isTerminalFullscreen && isActive ? '99vh' : '96vh',
        flexShrink: 0,
        margin: isTerminalFullscreen && isActive ? '0' : `0 ${GAPS_VW / 2}vw`,
        background: theme.panelBg,
        transition:
          'width 150ms cubic-bezier(0.22, 1, 0.36, 1), height 150ms cubic-bezier(0.22, 1, 0.36, 1), margin 150ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms cubic-bezier(0.22, 1, 0.36, 1), background-color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: isActive ? 1 : 0.9,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <header
        className="flex items-center justify-between gap-3 px-3 py-2 border-b"
        style={{ borderColor: theme.border }}
      >
        <div className="min-w-0">
          <div
            className="truncate uppercase"
            style={{
              color: isActive ? theme.accent : theme.textDim,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              letterSpacing: '0.16em',
              fontWeight: 700,
            }}
          >
            {panel.title}
          </div>
          <div
            className="truncate"
            title={panel.cwd}
            style={{
              color: theme.textDim,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              marginTop: '3px',
            }}
          >
            {panel.cwd}
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            refresh();
          }}
          className="px-2 py-1 border uppercase"
          style={{
            borderColor: theme.border,
            color: theme.textDim,
            background: 'transparent',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            letterSpacing: '0.12em',
          }}
        >
          refresh
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-auto px-3 py-2">
        {panelState.status === 'loading' ? (
          <DiffPanelMessage label="loading diff" color={theme.textDim} />
        ) : panelState.status === 'error' ? (
          <DiffPanelMessage label={panelState.message} color={theme.accent} />
        ) : panelState.status === 'empty' ? (
          <DiffPanelMessage label="no changes against HEAD" color={theme.textDim} />
        ) : (
          <CodeView
            items={panelState.items}
            disableWorkerPool
            options={{
              theme: 'pierre-dark',
              diffStyle: 'split',
              disableBackground: true,
              lineDiffType: 'word',
            }}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
            }}
          />
        )}
      </div>
    </section>
  );
};

const DiffPanelMessage: React.FC<{ label: string; color: string }> = ({ label, color }) => {
  return (
    <div
      className="h-full flex items-center justify-center text-center px-6"
      style={{
        color,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        letterSpacing: '0.08em',
      }}
    >
      {label}
    </div>
  );
};
