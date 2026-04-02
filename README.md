# KMux

Basic Electron Forge project with Vite, TypeScript, React/Tailwind dependencies, and terminal-related packages installed.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the app:

```bash
pnpm start
```

## Useful Commands

```bash
pnpm lint
pnpm typecheck
pnpm package
pnpm make
```

## Notes

- This repo is standardized on `pnpm`.
- `node-pty` and `@xterm/xterm` are installed as dependencies.
- `node-pty` is not currently wired into the app runtime.
- If you want to enable `node-pty`, you will need native build tools on Windows and must re-enable its rebuild in `forge.config.ts`.
