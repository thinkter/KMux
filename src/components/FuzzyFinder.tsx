import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { SEARCH_BOX_TOP, SEARCH_BOX_WIDTH, Z_LAYERS } from '../lib/constants';
import { useTerminalRuntime } from '../terminal/renderer/context/useTerminalRuntime';

const MAX_PREVIEW_BUFFER = 4000;
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_REGEX = new RegExp('\\u001B\\[[0-9;?]*[ -/]*[@-~]', 'g');

const stripAnsi = (value: string): string => value.replace(ANSI_ESCAPE_REGEX, '');

const toPreview = (value: string): string => {
  const cleaned = stripAnsi(value).replace(/\r/g, '');
  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.at(-1) ?? '';
};

const getDisplayPath = (cwd: string | undefined): string => {
  if (!cwd) {
    return 'directory unavailable';
  }

  const normalized = cwd.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length <= 2) {
    return cwd;
  }

  return `.../${segments.slice(-2).join('/')}`;
};

export const FuzzyFinder: React.FC = () => {
  const { workspaces, theme, isSearchOpen, toggleSearch, jumpToGlobalTerminal } = useCanvasStore();
  const { sessions, registerOutputSink } = useTerminalRuntime();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewBuffersRef = useRef<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const terminalIds = useMemo(
    () => workspaces.flatMap((workspace) => workspace.terminals.map((terminal) => terminal.id)),
    [workspaces],
  );

  useEffect(() => {
    if (!isSearchOpen) {
      previewBuffersRef.current.clear();
      setPreviews({});
      return;
    }

    const detachHandlers = terminalIds.map((terminalId) =>
      registerOutputSink(terminalId, (chunk) => {
        const previousBuffer = previewBuffersRef.current.get(terminalId) ?? '';
        const nextBuffer = `${previousBuffer}${chunk}`.slice(-MAX_PREVIEW_BUFFER);
        previewBuffersRef.current.set(terminalId, nextBuffer);
        setPreviews((current) => ({
          ...current,
          [terminalId]: toPreview(nextBuffer),
        }));
      }),
    );

    return () => {
      detachHandlers.forEach((detach) => detach());
    };
  }, [isSearchOpen, registerOutputSink, terminalIds]);

  const allTerminals = workspaces.flatMap((workspace, wsIdx) =>
    workspace.terminals.map((terminal) => ({
      ...terminal,
      workspaceName: workspace.title,
      shell: sessions[terminal.id]?.shell ?? 'starting',
      cwd: sessions[terminal.id]?.cwd ?? '',
      displayPath: getDisplayPath(sessions[terminal.id]?.cwd),
      preview: previews[terminal.id] ?? '',
      wsIdx,
    })),
  );

  const filtered = allTerminals.filter((terminal) =>
    terminal.title.toLowerCase().includes(query.toLowerCase()) ||
    terminal.workspaceName.toLowerCase().includes(query.toLowerCase()) ||
    terminal.shell.toLowerCase().includes(query.toLowerCase()) ||
    terminal.cwd.toLowerCase().includes(query.toLowerCase()) ||
    terminal.preview.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    setQuery('');
    setSelectedIndex(0);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(focusTimer);
  }, [isSearchOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      event.preventDefault();
    } else if (event.key === 'Enter') {
      if (filtered[selectedIndex]) {
        jumpToGlobalTerminal(filtered[selectedIndex].id);
      }
    } else if (event.key === 'Escape') {
      toggleSearch();
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center px-4 animate-in fade-in duration-200"
      style={{
        zIndex: Z_LAYERS.SEARCH,
        paddingTop: SEARCH_BOX_TOP,
      }}
      onClick={toggleSearch}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full rounded-2xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-black/50"
        style={{
          maxWidth: SEARCH_BOX_WIDTH,
          background: theme.panelBg,
          backdropFilter: 'blur(40px) saturate(150%)',
          boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${theme.border}`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center px-5 py-4 border-b border-white/5 bg-white/5">
          <svg
            className="w-5 h-5 opacity-40 mr-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: theme.text }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-xl font-light placeholder:text-white/20"
            placeholder="Search terminals or sessions..."
            style={{ color: theme.text }}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div
            className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 opacity-30 font-mono"
            style={{ color: theme.text }}
          >
            ESC
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto py-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center opacity-40 text-sm italic" style={{ color: theme.text }}>
              No terminals found matching "{query}"
            </div>
          ) : (
            filtered.map((terminal, index) => (
              <div
                key={terminal.id}
                className={`flex items-center px-4 py-3 mx-2 rounded-xl cursor-pointer transition-all duration-150 group ${
                  index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                onClick={() => jumpToGlobalTerminal(terminal.id)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-transform ${
                    index === selectedIndex ? 'scale-110' : ''
                  }`}
                  style={{
                    background:
                      index === selectedIndex ? theme.accent : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: index === selectedIndex ? '#fff' : theme.textDim }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: index === selectedIndex ? theme.text : theme.textDim }}
                  >
                    {terminal.title}
                  </div>
                  <div
                    className="text-[10px] opacity-40 truncate flex items-center gap-2 uppercase tracking-widest mt-0.5"
                    style={{ color: theme.text }}
                  >
                    <span>{terminal.workspaceName}</span>
                    <span>{terminal.shell}</span>
                    <span className="normal-case tracking-normal">{terminal.displayPath}</span>
                  </div>
                  {terminal.preview ? (
                    <div
                      className="text-[10px] opacity-60 truncate mt-1 normal-case"
                      style={{ color: theme.textDim }}
                    >
                      {terminal.preview}
                    </div>
                  ) : null}
                </div>

                {index === selectedIndex && (
                  <div
                    className="text-[10px] font-mono opacity-60 flex items-center gap-1"
                    style={{ color: theme.accent }}
                  >
                    <span>JUMP</span>
                    <span className="bg-black/20 px-1 rounded">Enter</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div
          className="px-5 py-2 border-t border-white/5 bg-black/10 flex justify-between items-center opacity-40 text-[9px] tracking-wider uppercase"
          style={{ color: theme.text }}
        >
          <div className="flex gap-4">
            <span>Up/Down Navigate</span>
            <span>Enter Select</span>
          </div>
          <div>{filtered.length} Results</div>
        </div>
      </div>
    </div>
  );
};
