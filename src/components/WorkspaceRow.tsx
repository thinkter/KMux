import React, { useState, useEffect } from "react";
import { useCanvasStore } from "../store/useCanvasStore";
import type { Workspace } from "../store/useCanvasStore";
import { TerminalPanel } from "./TerminalPanel";
import { DiffPanel } from "./DiffPanel";
import { getWidthVW } from "../utils/layout";
import { CAMERA_PADDING, GAPS_VW, SCREEN_WIDTH_VW } from "../lib/constants";

interface Props {
  workspace: Workspace;
  isActiveWorkspace: boolean;
}

export const WorkspaceRow: React.FC<Props> = ({
  workspace,
  isActiveWorkspace,
}) => {
  const [viewOffset, setViewOffset] = useState(0);
  const { theme, isOverview, isTerminalFullscreen } = useCanvasStore();
  const totalRowWidth = workspace.items.reduce(
    (total, item) => total + getWidthVW(item.widthFraction) + GAPS_VW,
    0,
  );
  const fitsOnScreen = totalRowWidth <= SCREEN_WIDTH_VW;

  /**
   * Cinematic Layout Logic (Infinite Strip / Sliding Window)
   * Calculates the perspective camera's offset based on terminal density and focus.
   */
  useEffect(() => {
    if (workspace.items.length === 0) {
      setViewOffset(0);
      return;
    }

    const { activeItemIndex, items } = workspace;

    // Relative positioning calculations
    let activeLeft = 0;
    for (let i = 0; i < activeItemIndex; i++) {
      activeLeft += getWidthVW(items[i].widthFraction) + GAPS_VW;
    }
    const activeWidth = getWidthVW(
      items[activeItemIndex].widthFraction,
    );
    const activeRight = activeLeft + activeWidth + GAPS_VW;

    setViewOffset((currentOffset) => {
      let targetOffset = currentOffset;
      const maxOffset = Math.max(0, totalRowWidth - SCREEN_WIDTH_VW);

      // Single-Terminal Centering (Focal Focus mode)
      if (items.length === 1 || totalRowWidth <= SCREEN_WIDTH_VW) {
        targetOffset = 0;
      }
      // Multi-Terminal Panning (Magnetic Strip mode)
      else {
        const isLastItem = activeItemIndex === items.length - 1;

        // Right-edge magnetism for context reveal
        // Clamp to activeLeft so a wide terminal is never scrolled off its own left edge
        if (isLastItem) {
          targetOffset = Math.min(
            activeRight - SCREEN_WIDTH_VW + CAMERA_PADDING,
            activeLeft,
          );
        }
        // Lazy tracking for internal strip movement
        else if (activeLeft < currentOffset + CAMERA_PADDING) {
          targetOffset = activeLeft - CAMERA_PADDING;
        } else if (activeRight > currentOffset + SCREEN_WIDTH_VW - CAMERA_PADDING) {
          targetOffset = activeRight - SCREEN_WIDTH_VW + CAMERA_PADDING;
        }

        // Prevent viewport overflow of empty leading or trailing space.
        targetOffset = Math.min(maxOffset, Math.max(0, targetOffset));
      }

      // Threshold-based state update to minimize jitter
      return Math.abs(targetOffset - currentOffset) > 0.01 ? targetOffset : currentOffset;
    });
  }, [workspace.activeItemIndex, workspace.items, totalRowWidth]);

  const activeItem = workspace.items[workspace.activeItemIndex];
  const visibleItems =
    isActiveWorkspace && isTerminalFullscreen && activeItem
      ? [activeItem]
      : workspace.items;
  const shouldCenterTerminals =
    fitsOnScreen || (isActiveWorkspace && isTerminalFullscreen);

  return (
    <div
      className={`w-screen h-screen flex-shrink-0 flex items-center transition-opacity duration-150 ${
        isActiveWorkspace || isOverview ? "opacity-100" : "opacity-40"
      }`}
    >
      {workspace.items.length === 0 ? (
        <div className="w-full text-center select-none">
          {isActiveWorkspace ? (
            <div>
              <p
                className="text-xs tracking-[0.4em] uppercase mb-3 animate-pulse"
                style={{
                  color: theme.accent,
                  opacity: 0.5,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                empty workspace
              </p>
              <p
                style={{
                  color: theme.textDim,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                }}
              >
                press <span style={{ color: theme.accent }}>alt + enter</span>{" "}
                to spawn terminal
              </p>
            </div>
          ) : (
            <p
              className="text-xs tracking-[0.4em] uppercase"
              style={{
                color: theme.textDim,
                opacity: 0.2,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              empty workspace
            </p>
          )}
        </div>
      ) : (
        <div
          className="flex transition-transform duration-[180ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            transform: shouldCenterTerminals
              ? "translateX(0)"
              : `translateX(${-viewOffset}vw)`,
            width: shouldCenterTerminals ? "100%" : undefined,
            justifyContent: shouldCenterTerminals ? "center" : undefined,
          }}
        >
          {visibleItems.map((item) => {
            const itemIsActive = isActiveWorkspace && item.id === activeItem?.id;

            return item.type === "terminal" ? (
              <TerminalPanel
                key={item.id}
                terminal={item}
                isActive={itemIsActive}
              />
            ) : (
              <DiffPanel key={item.id} panel={item} isActive={itemIsActive} />
            );
          })}
        </div>
      )}
    </div>
  );
};
