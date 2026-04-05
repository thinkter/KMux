/**
 * TerminalPanel.tsx — STUB
 *
 * This is a placeholder owned by Divyansh (Aesthetic Render & Terminal UI).
 * It is scaffolded here purely so the project compiles while Divyansh's
 * real implementation is in progress.
 *
 * DO NOT build permanent UI here — Divyansh owns this file.
 */

import React from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import type { Terminal } from '../types';
import { getWidthVWString } from '../utils/layout';

interface Props {
  terminal: Terminal;
  isActive: boolean;
}

export const TerminalPanel: React.FC<Props> = ({ terminal, isActive }) => {
  const { theme } = useCanvasStore();
  const w = getWidthVWString(terminal.widthFraction);

  return (
    <div
      style={{
        width: w,
        height: '75vh',
        flexShrink: 0,
        margin: '0 1.5vw',
        borderRadius: '12px',
        border: `1px solid ${isActive ? theme.accent : theme.border}`,
        background: theme.panelBg,
        backdropFilter: 'blur(24px)',
        boxShadow: isActive
          ? `0 0 40px ${theme.accent}20, inset 0 0 0 1px ${theme.accent}10`
          : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isActive ? 1 : 0.45,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Fake title bar */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: theme.accent, opacity: 0.8, display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: theme.textDim, display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: theme.textDim, display: 'inline-block' }} />
        <span
          style={{
            marginLeft: 8,
            fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace',
            fontSize: 11,
            color: theme.textDim,
            letterSpacing: '0.08em',
          }}
        >
          {terminal.title}
        </span>
      </div>

      {/* Placeholder body — xterm.js goes here (Team 1 integration) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace',
          fontSize: 11,
          color: 'rgba(232,220,200,0.15)',
          letterSpacing: '0.2em',
        }}
      >
        {isActive ? '▋' : '·'}
      </div>
    </div>
  );
};
