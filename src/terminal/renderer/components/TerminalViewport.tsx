import React, { useEffect, useRef } from 'react';
import type { Terminal as XtermTerminal } from '@xterm/xterm';
import { useCanvasStore } from '../../../store/useCanvasStore';
import type { TerminalSessionSnapshot } from '../../shared/terminal-types';
import { useTerminalRuntime } from '../context/useTerminalRuntime';
import { observeTerminalSize } from '../utils/terminalSizing';
import { createXterm } from '../xterm/createXterm';
import { toXtermTheme } from '../xterm/terminalTheme';

interface Props {
  terminalId: string;
  isActive: boolean;
}

const getStatusLabel = (session: TerminalSessionSnapshot | undefined): string => {
  if (!session) return 'starting...';
  if (session.status === 'running') return session.shell || 'running';
  if (session.status === 'exited') return `exited (${session.exitCode ?? 0})`;
  if (session.status === 'error') return session.errorMessage ?? 'failed to start';
  return 'starting...';
};

export const TerminalViewport: React.FC<Props> = ({ terminalId, isActive }) => {
  const theme = useCanvasStore((state) => state.theme);
  const { sessions, registerOutputSink, writeTerminal, resizeTerminal } = useTerminalRuntime();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<XtermTerminal | null>(null);
  const bootstrappedRef = useRef(false);

  const session = sessions[terminalId];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const { terminal, fitAddon } = createXterm(toXtermTheme(theme));
    xtermRef.current = terminal;
    terminal.open(container);

    const detachOutput = registerOutputSink(terminalId, (chunk) => {
      terminal.write(chunk);
    });

    const inputDisposable = terminal.onData((input) => {
      void writeTerminal(terminalId, input).catch((error) => {
        console.error(`Failed to write input for terminal "${terminalId}".`, error);
      });
    });

    const stopObserving = observeTerminalSize(container, terminal, fitAddon, ({ cols, rows }) => {
      void resizeTerminal(terminalId, cols, rows).catch((error) => {
        console.error(`Failed to resize terminal "${terminalId}".`, error);
      });
    });

    return () => {
      stopObserving();
      inputDisposable.dispose();
      detachOutput();
      terminal.dispose();
      xtermRef.current = null;
    };
  }, [registerOutputSink, resizeTerminal, terminalId, writeTerminal]);

  useEffect(() => {
    if (!xtermRef.current) {
      return;
    }
    xtermRef.current.options.theme = toXtermTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (isActive) {
      xtermRef.current?.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (!xtermRef.current || !session) {
      return;
    }
    if (bootstrappedRef.current) {
      return;
    }

    if (session.status === 'running') {
      bootstrappedRef.current = true;
      xtermRef.current.write(`\u001b[2m[${session.shell}] terminal ready\u001b[0m\r\n`);
    }
  }, [session]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full px-3 py-2" />
      <div
        className="absolute right-3 bottom-2 rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider pointer-events-none"
        style={{
          color: theme.textDim,
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        {getStatusLabel(session)}
      </div>
    </div>
  );
};
