import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { WorkspaceRow } from './WorkspaceRow';
import { FuzzyFinder } from './FuzzyFinder';

export const CanvasContainer: React.FC = () => {
  const {
    workspaces,
    activeWorkspaceIndex,
    isOverview,
    theme,
    moveTerminal,
    moveWorkspace,
    addTerminal,
    removeTerminal,
    resizeTerminal,
    toggleOverview,
  } = useCanvasStore();

  const [controlsVisible, setControlsVisible] = useState(true);

  // Auto-hide controls after 5s of inactivity
  useEffect(() => {
    let id: number;
    if (controlsVisible) {
      id = window.setTimeout(() => setControlsVisible(false), 5000);
    }
    return () => clearTimeout(id);
  }, [controlsVisible]);

  // Handle global UI feedback for any keypress
  useEffect(() => {
    const poke = () => setControlsVisible(true);
    window.addEventListener('keydown', poke, true);
    window.addEventListener('mousedown', poke, true);
    return () => {
      window.removeEventListener('keydown', poke, true);
      window.removeEventListener('mousedown', poke, true);
    };
  }, []);

  // ── Camera math ────────────────────────────────────────────────────────────
  // Vertical axis: slide the entire workspace stack by -100vh per step
  const translateY = -(activeWorkspaceIndex * 100);

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: theme.bg }}
    >
      {/* Atmospheric ambient glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 30% 45%, ${theme.accent}20 0%, transparent 70%),
            radial-gradient(ellipse 50% 45% at 80% 80%, rgba(100,20,120,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at 70% 20%, ${theme.accent}0a 0%, transparent 60%)
          `,
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${theme.text}30 1px, transparent 1px), linear-gradient(90deg, ${theme.text}30 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── Main canvas — vertical + overview transforms applied here ── */}
      <div
        className="w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: isOverview ? 'scale(0.28)' : 'scale(1)' }}
      >
        <div
          className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform"
          style={{ transform: `translateY(${translateY}vh)` }}
        >
          {workspaces.map((ws, i) => (
            <WorkspaceRow
              key={ws.id}
              workspace={ws}
              isActiveWorkspace={i === activeWorkspaceIndex}
            />
          ))}
        </div>
      </div>

      {/* Fuzzy Search Overlay */}
      <FuzzyFinder />

      {/* Workspace indicator — vertical dot strip on the left */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {workspaces.map((_, i) => (
          <div
            key={i}
            className="transition-all duration-300"
            style={{
              width:  i === activeWorkspaceIndex ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === activeWorkspaceIndex
                ? theme.accent
                : theme.textDim,
              boxShadow: i === activeWorkspaceIndex ? `0 0 8px ${theme.accent}80` : 'none',
            }}
          />
        ))}
      </div>

      {/* Controls overlay — auto-hides after 5s */}
      <div
        className={`absolute top-5 right-5 z-50 transition-opacity duration-1000 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="px-4 py-3 rounded-lg text-xs font-mono"
          style={{
            background: theme.panelBg,
            border: `1px solid ${theme.border}`,
            backdropFilter: 'blur(20px)',
            color: theme.textDim,
            letterSpacing: '0.05em',
          }}
        >
          <p
            className="mb-2 font-semibold text-xs tracking-widest uppercase"
            style={{ color: theme.accent, borderBottom: `1px solid ${theme.accent}20`, paddingBottom: 8 }}
          >
            kmux controls — theme: {theme.name}
          </p>
          <p className="mb-2 opacity-50 border-b border-white/10 pb-1">modifiers: alt or super</p>
          <p>arrows · focus terminal / workspace</p>
          <p>enter · new terminal</p>
          <p>n · new workspace</p>
          <p>q/w · close terminal</p>
          <p>o · toggle overview</p>
          <p>f · fuzzy finder</p>
          <p>-/= · resize width</p>
        </div>
      </div>

      {/* Active workspace label — bottom centre */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-1000"
        style={{ opacity: controlsVisible ? 0.6 : 0 }}
      >
        <span
          className="text-xs tracking-[0.3em] uppercase font-mono"
          style={{ color: 'rgba(232,220,200,0.4)' }}
        >
          workspace {activeWorkspaceIndex + 1}
        </span>
      </div>
    </div>
  );
};
