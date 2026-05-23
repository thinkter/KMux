import React, { useEffect, useRef } from "react";
import { useCanvasStore } from "../store/useCanvasStore";
import { Z_LAYERS } from "../lib/constants";
import { KEYBIND_SECTIONS } from "../lib/keybinds";

const OVERLAY_TITLE_ID = "controls-overlay-title";
const FONT = "'JetBrains Mono', monospace";

export const ControlsOverlay: React.FC = () => {
  const { isControlsOpen, toggleControls, theme } = useCanvasStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isControlsOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    return () => {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [isControlsOpen]);

  useEffect(() => {
    if (!isControlsOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        toggleControls();
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isControlsOpen, toggleControls]);

  if (!isControlsOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z_LAYERS.SEARCH + 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.65)",
        padding: "16px",
      }}
      onClick={toggleControls}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={OVERLAY_TITLE_ID}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          maxHeight: "70vh",
          overflowY: "auto",
          background: theme.panelBg,
          border: "none",
          borderRadius: "0",
          boxShadow: "none",
          padding: "12px 14px",
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <span
            id={OVERLAY_TITLE_ID}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: theme.accent,
              textTransform: "uppercase",
            }}
          >
            KMux Controls
          </span>
          <button
            type="button"
            onClick={toggleControls}
            aria-label="Close controls"
            style={{
              fontSize: "11px",
              padding: "2px 6px",
              borderRadius: "0",
              border: "none",
              boxShadow: "none",
              background: "transparent",
              color: theme.textDim,
              cursor: "pointer",
            }}
          >
            ESC
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {KEYBIND_SECTIONS.map((section) => (
            <div key={section.title}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: theme.textDim,
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                {section.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {section.bindings.map((binding) => (
                  <div
                    key={binding.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: theme.text }}>{binding.label}</span>
                    <span style={{ fontSize: "12px", color: theme.textDim }}>
                      {binding.shortcut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
