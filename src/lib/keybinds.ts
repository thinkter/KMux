/**
 * KMux keybinds - single source of truth.
 *
 * Keyboard handling and the controls overlay both consume these definitions.
 */

export type KeyAction =
  | 'moveTerminalLeft'
  | 'moveTerminalRight'
  | 'moveWorkspaceUp'
  | 'moveWorkspaceDown'
  | 'jumpToWorkspace'
  | 'addTerminal'
  | 'openTerminalPicker'
  | 'removeTerminal'
  | 'addWorkspace'
  | 'openWorkspacePicker'
  | 'openDiffPanel'
  | 'toggleFullscreen'
  | 'toggleExplorer'
  | 'cycleWidth'
  | 'resizeShrink'
  | 'resizeExpand'
  | 'fontSizeIncrease'
  | 'fontSizeDecrease'
  | 'globalFontSizeIncrease'
  | 'globalFontSizeDecrease'
  | 'toggleOverview'
  | 'toggleSearch'
  | 'cycleThemes'
  | 'toggleControls';

export interface KeyBind {
  action: KeyAction;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  keys?: string[];
  keyPattern?: RegExp;
}

export interface KeyBindDisplay {
  label: string;
  shortcut: string;
}

export interface KeyBindSection {
  title: string;
  bindings: KeyBindDisplay[];
}

export const KEYBINDS: KeyBind[] = [
  { action: 'globalFontSizeIncrease', ctrl: true, shift: true, keys: ['+', '='] },
  { action: 'globalFontSizeDecrease', ctrl: true, shift: true, keys: ['-', '_'] },
  { action: 'fontSizeIncrease', ctrl: true, keys: ['+', '='] },
  { action: 'fontSizeDecrease', ctrl: true, keys: ['-', '_'] },
  { action: 'openTerminalPicker', alt: true, shift: true, keys: ['enter'] },
  { action: 'openWorkspacePicker', alt: true, shift: true, keys: ['n'] },
  { action: 'toggleControls', alt: true, keys: ['/', '?'] },
  { action: 'openDiffPanel', alt: true, keys: ['c'] },
  { action: 'toggleFullscreen', alt: true, keys: ['b'] },
  { action: 'toggleExplorer', alt: true, keys: ['e'] },
  { action: 'jumpToWorkspace', alt: true, keyPattern: /^[1-9]$/ },
  { action: 'moveTerminalLeft', alt: true, keys: ['arrowleft', 'h'] },
  { action: 'moveTerminalRight', alt: true, keys: ['arrowright', 'l'] },
  { action: 'moveWorkspaceUp', alt: true, keys: ['arrowup', 'k'] },
  { action: 'moveWorkspaceDown', alt: true, keys: ['arrowdown', 'j'] },
  { action: 'addTerminal', alt: true, keys: ['enter'] },
  { action: 'addWorkspace', alt: true, keys: ['n'] },
  { action: 'removeTerminal', alt: true, keys: ['w', 'q', 'x'] },
  { action: 'toggleOverview', alt: true, keys: ['o'] },
  { action: 'cycleThemes', alt: true, keys: ['t'] },
  { action: 'toggleSearch', alt: true, keys: ['f'] },
  { action: 'cycleWidth', alt: true, keys: ['r'] },
  { action: 'resizeShrink', alt: true, keys: ['-'] },
  { action: 'resizeExpand', alt: true, keys: ['=', '+'] },
];

export const KEYBIND_SECTIONS: KeyBindSection[] = [
  {
    title: 'Navigation',
    bindings: [
      { label: 'Focus panel', shortcut: 'Alt + H/L' },
      { label: 'Switch workspace', shortcut: 'Alt + J/K' },
      { label: 'Jump to workspace', shortcut: 'Alt + 1-9' },
    ],
  },
  {
    title: 'Terminals',
    bindings: [
      { label: 'New terminal', shortcut: 'Alt + Enter' },
      { label: 'Choose profile', shortcut: 'Alt + Shift + Enter' },
      { label: 'Close panel', shortcut: 'Alt + Q/W' },
      { label: 'Toggle fullscreen', shortcut: 'Alt + B' },
    ],
  },
  {
    title: 'Layout',
    bindings: [
      { label: 'Cycle width', shortcut: 'Alt + R' },
      { label: 'Resize', shortcut: 'Alt + -/=' },
      { label: 'Font size', shortcut: 'Ctrl + -/=' },
      { label: 'Global font size', shortcut: 'Ctrl + Shift + -/=' },
    ],
  },
  {
    title: 'Utilities',
    bindings: [
      { label: 'Git diff panel', shortcut: 'Alt + C' },
      { label: 'File explorer', shortcut: 'Alt + E' },
      { label: 'Overview', shortcut: 'Alt + O' },
      { label: 'Fuzzy finder', shortcut: 'Alt + F' },
      { label: 'Cycle themes', shortcut: 'Alt + T' },
      { label: 'Toggle help', shortcut: 'Alt + ?' },
    ],
  },
];

export function matchKeybind(e: KeyboardEvent, bind: KeyBind): boolean {
  const key = e.key.toLowerCase();
  const altOrMeta = e.altKey || e.metaKey;

  if (bind.ctrl && !bind.alt) {
    if (!e.ctrlKey || altOrMeta) return false;
    if (bind.shift && !e.shiftKey) return false;
    if (!bind.shift && e.shiftKey) return false;
  } else if (bind.alt && !bind.ctrl) {
    if (!altOrMeta || e.ctrlKey) return false;
    if (bind.shift && !e.shiftKey) return false;
  } else {
    return false;
  }

  if (bind.keys?.includes(key)) return true;
  if (bind.keyPattern?.test(key)) return true;

  return false;
}

export function findKeybind(e: KeyboardEvent): KeyBind | undefined {
  return KEYBINDS.find((bind) => matchKeybind(e, bind));
}
