import assert from 'node:assert/strict';
import test from 'node:test';
import { Osc7CwdParser, parseOsc7Payload } from '../../src/terminal/main/cwd/osc7.ts';
import { probeProcessCwd, type CwdProbeRuntime } from '../../src/terminal/main/cwd/probe.ts';
import {
  formatCwdHint,
  getPathBasename,
  getTerminalSearchText,
  shortenPath,
} from '../../src/terminal/shared/cwd-format.ts';
import type { TerminalSessionSnapshot } from '../../src/terminal/shared/terminal-types.ts';

test('osc7 parser handles split sequences across chunks', () => {
  const parser = new Osc7CwdParser();

  assert.deepEqual(parser.push('\u001b]7;file://local'), []);
  const updates = parser.push('host/home/a/project\u0007');

  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0], {
    path: '/home/a/project',
    host: undefined,
    isLocal: true,
  });
});

test('osc7 parser handles multiple sequences and ST terminator', () => {
  const parser = new Osc7CwdParser();
  const updates = parser.push(
    'x\u001b]7;file://localhost/home/a\u0007y\u001b]7;file://localhost/home/a/b\u001b\\z',
  );

  assert.equal(updates.length, 2);
  assert.equal(updates[0].path, '/home/a');
  assert.equal(updates[1].path, '/home/a/b');
});

test('osc7 parser marks remote hosts as non-local display metadata', () => {
  const parsed = parseOsc7Payload('file://server.example.com/home/ubuntu/app');

  assert.deepEqual(parsed, {
    path: '/home/ubuntu/app',
    host: 'server.example.com',
    isLocal: false,
  });
});

test('osc7 parser decodes spaces and windows file urls', () => {
  assert.deepEqual(parseOsc7Payload('file://localhost/home/a/My%20Project'), {
    path: '/home/a/My Project',
    host: undefined,
    isLocal: true,
  });

  assert.deepEqual(parseOsc7Payload('file://localhost/C:/Users/a/project'), {
    path: 'C:\\Users\\a\\project',
    host: undefined,
    isLocal: true,
  });
});

test('osc7 parser ignores malformed and oversized incomplete sequences', () => {
  const parser = new Osc7CwdParser();

  assert.equal(parseOsc7Payload('not-a-file-uri'), null);
  assert.deepEqual(parser.push('\u001b]7;not-a-file-uri\u0007'), []);
  assert.deepEqual(parser.push(`\u001b]7;file://localhost/${'x'.repeat(5000)}`), []);
  assert.deepEqual(parser.push('/home/a\u0007'), []);
});

test('path basename and shortening cover posix, windows, and root paths', () => {
  assert.equal(getPathBasename('/'), '/');
  assert.equal(getPathBasename('/home/a/project/'), 'project');
  assert.equal(getPathBasename('C:\\Users\\a\\project'), 'project');
  assert.equal(getPathBasename('\\\\wsl.localhost\\Ubuntu\\home\\a\\project'), 'project');

  assert.equal(shortenPath('/home/a', '/home/a'), '~');
  assert.equal(shortenPath('/home/a/project', '/home/a'), '~/project');
  assert.equal(shortenPath('/Users/a/project', '/Users/a'), '~/project');
  assert.equal(shortenPath('C:\\Users\\a\\project', 'C:\\Users\\a'), '~\\project');
  assert.equal(shortenPath('/mnt/c/Users/a/project', '/home/a'), '/mnt/c/Users/a/project');
});

test('cwd hint formats remote host without local home shortening', () => {
  const hint = formatCwdHint(
    {
      path: '/home/ubuntu/app',
      host: 'server.example.com',
      isLocal: false,
      source: 'osc7',
      updatedAt: 1,
    },
    '/home/ubuntu',
  );

  assert.deepEqual(hint, {
    folder: 'app',
    shortPath: '/home/ubuntu/app',
    fullPath: '/home/ubuntu/app',
    host: 'server.example.com',
  });
});

test('terminal search text includes cwd fields and host', () => {
  const session: TerminalSessionSnapshot = {
    terminalId: 'terminal-1',
    pid: 1,
    shell: 'zsh',
    foregroundProcess: 'pnpm dev',
    cwd: '/home/a',
    currentCwd: {
      path: '/home/a/KMux',
      host: 'server.example.com',
      isLocal: false,
      source: 'osc7',
      updatedAt: 1,
    },
    cols: 120,
    rows: 30,
    status: 'running',
  };

  const searchText = getTerminalSearchText(session, 'Terminal 1', 'ws 1', 'pnpm dev');

  assert.match(searchText, /kmux/);
  assert.match(searchText, /server\.example\.com/);
  assert.match(searchText, /pnpm dev/);
  assert.match(searchText, /terminal 1/);
});

test('process cwd probe supports linux procfs and macos lsof parsing', () => {
  const runtime: CwdProbeRuntime = {
    readlink: (targetPath) => {
      assert.equal(targetPath, '/proc/123/cwd');
      return '/home/a/project';
    },
    runCommand: () => ({ status: 0, stdout: 'p123\nn/Users/a/project\n' }),
  };

  assert.deepEqual(
    { ...probeProcessCwd('linux', 123, runtime), updatedAt: 1 },
    {
      path: '/home/a/project',
      isLocal: true,
      source: 'procfs',
      updatedAt: 1,
    },
  );

  assert.deepEqual(
    { ...probeProcessCwd('darwin', 123, runtime), updatedAt: 1 },
    {
      path: '/Users/a/project',
      isLocal: true,
      source: 'lsof',
      updatedAt: 1,
    },
  );
});
