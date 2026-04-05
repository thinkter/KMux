/**
 * App.tsx — Sujal's Dev Harness (TEMPORARY)
 *
 * This file is a throwaway debug scaffold so Sujal can test the Zustand store
 * and keyboard navigation BEFORE Prradyun delivers CanvasContainer.tsx / WorkspaceRow.tsx.
 *
 * When Prradyun merges his components, this file gets replaced by the real app shell.
 * DO NOT build any permanent UI here.
 */

import React from 'react';
import { useCanvasStore } from './store/useCanvasStore';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import type { Workspace, Terminal } from './types';

export default function App(): React.JSX.Element {
  // Mount the global keyboard listener — this is the real hook being tested
  useKeyboardNav();

  const {
    workspaces,
    activeWorkspaceIndex,
    addWorkspace,
    addTerminal,
  } = useCanvasStore();

  const activeWorkspace = workspaces[activeWorkspaceIndex];

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <span style={styles.logo}>⌗ KMux</span>
        <span style={styles.badge}>Dev Harness — State Inspector</span>
      </header>

      <main style={styles.main}>
        {/* ── Global State ─────────────────────────────────── */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>📐 Global Canvas State</h2>
          <table style={styles.table}>
            <tbody>
              <tr>
                <td style={styles.label}>Active Workspace Index</td>
                <td style={styles.value}>{activeWorkspaceIndex}</td>
              </tr>
              <tr>
                <td style={styles.label}>Total Workspaces</td>
                <td style={styles.value}>{workspaces.length}</td>
              </tr>
              <tr>
                <td style={styles.label}>Active Terminal Index</td>
                <td style={styles.value}>{activeWorkspace.activeTerminalIndex}</td>
              </tr>
              <tr>
                <td style={styles.label}>Total Terminals (active WS)</td>
                <td style={styles.value}>{activeWorkspace.terminals.length}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Workspaces Map ───────────────────────────────── */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>🗺 Workspace × Terminal Map</h2>
          <div style={styles.grid}>
            {workspaces.map((ws: Workspace, wsIdx: number) => (
              <div
                key={ws.id}
                style={{
                  ...styles.wsRow,
                  borderColor: wsIdx === activeWorkspaceIndex ? '#6ee7b7' : '#334155',
                  opacity: wsIdx === activeWorkspaceIndex ? 1 : 0.5,
                }}
              >
                <div style={styles.wsLabel}>
                  {wsIdx === activeWorkspaceIndex ? '▶ ' : '  '}WS {wsIdx}
                  <span style={styles.wsId}> [{ws.id.slice(0, 6)}]</span>
                </div>
                <div style={styles.terminalRow}>
                  {ws.terminals.map((term: Terminal, tIdx: number) => (
                    <div
                      key={term.id}
                      style={{
                        ...styles.termChip,
                        background:
                          wsIdx === activeWorkspaceIndex && tIdx === ws.activeTerminalIndex
                            ? '#065f46'
                            : '#1e293b',
                        borderColor:
                          wsIdx === activeWorkspaceIndex && tIdx === ws.activeTerminalIndex
                            ? '#6ee7b7'
                            : '#475569',
                      }}
                    >
                      {tIdx === ws.activeTerminalIndex ? '◉' : '○'} {term.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Controls ─────────────────────────────────────── */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>🎮 Manual Controls (buttons = same as keyboard)</h2>
          <div style={styles.controls}>
            <button style={styles.btn} onClick={addWorkspace}>+ Workspace</button>
            <button style={styles.btn} onClick={addTerminal}>+ Terminal</button>
          </div>
          <div style={styles.hint}>
            <code>Super + ↑↓</code> — switch workspace &nbsp;|&nbsp;
            <code>Super + ←→</code> — switch terminal
          </div>
        </section>

        {/* ── Raw JSON Dump ────────────────────────────────── */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>🔬 Raw Store JSON</h2>
          <pre style={styles.json}>
            {JSON.stringify({ activeWorkspaceIndex, workspaces }, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}

// ─── Inline styles (no Tailwind needed for a dev harness) ──────────────────
const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    background: '#020617',
    color: '#e2e8f0',
    fontFamily: 'IBM Plex Mono, Cascadia Code, monospace',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    background: '#0f172a',
    borderBottom: '1px solid #1e293b',
  },
  logo: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#6ee7b7',
    letterSpacing: '0.08em',
  },
  badge: {
    fontSize: '11px',
    color: '#64748b',
    background: '#1e293b',
    padding: '2px 10px',
    borderRadius: '999px',
    border: '1px solid #334155',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  card: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '16px 20px',
  },
  cardTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  label: {
    color: '#64748b',
    padding: '4px 0',
    paddingRight: '24px',
    whiteSpace: 'nowrap',
  },
  value: {
    color: '#6ee7b7',
    fontWeight: 700,
    fontSize: '14px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  wsRow: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '10px 14px',
    transition: 'opacity 0.2s, border-color 0.2s',
  },
  wsLabel: {
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '8px',
  },
  wsId: {
    color: '#475569',
    fontWeight: 400,
    fontSize: '11px',
  },
  terminalRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  termChip: {
    border: '1px solid',
    borderRadius: '4px',
    padding: '3px 10px',
    fontSize: '12px',
    color: '#e2e8f0',
    transition: 'background 0.2s, border-color 0.2s',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  btn: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#e2e8f0',
    borderRadius: '4px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '12px',
  },
  hint: {
    color: '#475569',
    fontSize: '12px',
  },
  json: {
    color: '#94a3b8',
    fontSize: '11px',
    overflowX: 'auto',
    lineHeight: 1.6,
  },
};
