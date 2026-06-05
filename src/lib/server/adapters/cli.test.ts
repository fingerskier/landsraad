import { describe, expect, it } from 'vitest';
import { effectiveModel, getCliConfig, parseAdapterId, runCliAdapter, shouldUseShell } from './cli';

describe('runCliAdapter stdin handling', () => {
  it('closes stdin for arg-mode adapters so a stdin-reading CLI exits instead of hanging', async () => {
    // `cat` with no args echoes stdin until EOF. In arg mode the prompt rides in argv,
    // so if stdin is left open the process never exits — the real grok 120s-timeout bug.
    const streams = runCliAdapter(
      { id: 'cli:test-cat', command: 'cat', args: () => [], stdinMode: 'arg' },
      { prompt: 'unused — rides in argv', cwd: process.cwd() }
    );
    for await (const _chunk of streams.chunks) {
      void _chunk; // drain
    }
    const res = await streams.result;
    expect(res.exit_code).toBe(0);
  }, 4000);
});

describe('cli adapter configs', () => {
  it('codex exec is invoked with --skip-git-repo-check so non-git council dirs work', () => {
    const cfg = getCliConfig('cli:codex');
    expect(cfg).not.toBeNull();
    const args = cfg!.args('prompt');
    expect(args).toContain('--skip-git-repo-check');
    expect(args[0]).toBe('exec');
  });

  it('claude CLI uses -p print mode', () => {
    const cfg = getCliConfig('cli:claude');
    expect(cfg).not.toBeNull();
    expect(cfg!.args('prompt')).toEqual(['-p']);
  });

  it('claude CLI injects --model when a model opt is supplied', () => {
    const cfg = getCliConfig('cli:claude');
    expect(cfg!.args('prompt', { model: 'claude-haiku-4-5' })).toEqual([
      '-p',
      '--model',
      'claude-haiku-4-5'
    ]);
  });

  it('claude CLI omits --model when the model opt is blank', () => {
    const cfg = getCliConfig('cli:claude');
    expect(cfg!.args('prompt', { model: '' })).toEqual(['-p']);
  });
});

describe('parseAdapterId', () => {
  it('splits a bare id into base with empty params', () => {
    expect(parseAdapterId('cli:claude')).toEqual({ base: 'cli:claude', params: {} });
  });

  it('parses a ?model= query suffix', () => {
    expect(parseAdapterId('cli:claude?model=claude-haiku-4-5')).toEqual({
      base: 'cli:claude',
      params: { model: 'claude-haiku-4-5' }
    });
  });

  it('parses multiple params and ignores empty segments', () => {
    expect(parseAdapterId('cli:codex?model=gpt-5-mini&foo=bar')).toEqual({
      base: 'cli:codex',
      params: { model: 'gpt-5-mini', foo: 'bar' }
    });
  });

  it('resolves getCliConfig against the parsed base', () => {
    const { base } = parseAdapterId('cli:claude?model=x');
    expect(getCliConfig(base)).not.toBeNull();
  });
});

describe('effectiveModel', () => {
  it('returns undefined for a bare id with no default', () => {
    expect(effectiveModel('cli:claude')).toBeUndefined();
  });

  it('applies the host-wide default when the adapter pins no model', () => {
    expect(effectiveModel('cli:claude', 'haiku')).toBe('haiku');
  });

  it('lets a per-councillor ?model= win over the host-wide default', () => {
    expect(effectiveModel('cli:claude?model=opus', 'haiku')).toBe('opus');
  });

  it('trims whitespace and treats a blank default as no override', () => {
    expect(effectiveModel('cli:claude', '   ')).toBeUndefined();
    expect(effectiveModel('cli:claude?model=', 'haiku')).toBe('haiku');
  });
});

describe('effectiveModel tier aliases', () => {
  it('maps a lite/medium/heavy host-wide default through the adapter tier table', () => {
    expect(effectiveModel('cli:claude', 'lite')).toBe('haiku');
    expect(effectiveModel('cli:claude', 'medium')).toBe('sonnet');
    expect(effectiveModel('cli:claude', 'heavy')).toBe('opus');
  });

  it('maps a tier keyword supplied via a per-councillor ?model= pin', () => {
    expect(effectiveModel('cli:claude?model=heavy', 'lite')).toBe('opus');
  });

  it('matches tier keywords case-insensitively', () => {
    expect(effectiveModel('cli:claude', 'Heavy')).toBe('opus');
  });

  it('passes a literal model id through untouched (not a tier keyword)', () => {
    expect(effectiveModel('cli:claude', 'claude-opus-4-8')).toBe('claude-opus-4-8');
    expect(effectiveModel('cli:claude?model=claude-haiku-4-5')).toBe('claude-haiku-4-5');
  });

  it('no-ops a tier keyword for an adapter that defines no tier table (falls back to CLI default)', () => {
    expect(effectiveModel('cli:codex', 'lite')).toBeUndefined();
  });
});

describe('cli adapter tier tables', () => {
  it('claude exposes lite/medium/heavy tier aliases', () => {
    const cfg = getCliConfig('cli:claude');
    expect(cfg!.tiers).toEqual({ lite: 'haiku', medium: 'sonnet', heavy: 'opus' });
  });
});

describe('shouldUseShell', () => {
  // Arg-mode adapters pass the prompt as an argv entry. Node does NOT quote args
  // when shell:true, so on Windows a multi-word prompt gets split by cmd.exe and
  // the CLI mis-parses it (grok read "Persona:" as --single's value, then the
  // next word as a subcommand → "unrecognized subcommand"). These commands are
  // native exes, so they spawn fine without a shell — and then Node quotes argv.
  it('never uses a shell for arg-mode adapters (prevents unquoted-arg splitting)', () => {
    expect(shouldUseShell(getCliConfig('cli:grok')!)).toBe(false);
    expect(shouldUseShell(getCliConfig('cli:aider')!)).toBe(false);
    expect(shouldUseShell(getCliConfig('cli:warp')!)).toBe(false);
  });

  // Pipe-mode commands are often npm .cmd shims that Node can only launch via the
  // shell on Windows; their argv is static flags with no user text, so it's safe.
  it('uses a shell for pipe-mode adapters only on Windows', () => {
    expect(shouldUseShell(getCliConfig('cli:claude')!)).toBe(process.platform === 'win32');
  });
});

describe('cli adapter configs (more)', () => {
  it('gemini CLI runs headless via piped stdin', () => {
    const cfg = getCliConfig('cli:gemini');
    expect(cfg).not.toBeNull();
    expect(cfg!.command).toBe('gemini');
    expect(cfg!.stdinMode).toBe('pipe');
  });

  it('grok CLI runs single-turn headless via --single (official xAI CLI)', () => {
    const cfg = getCliConfig('cli:grok');
    expect(cfg).not.toBeNull();
    expect(cfg!.command).toBe('grok');
    expect(cfg!.stdinMode).toBe('arg');
    expect(cfg!.args('hello world')).toEqual(['--single', 'hello world']);
  });

  it('qwen CLI runs headless via piped stdin', () => {
    const cfg = getCliConfig('cli:qwen');
    expect(cfg).not.toBeNull();
    expect(cfg!.command).toBe('qwen');
    expect(cfg!.stdinMode).toBe('pipe');
  });

  it('vibe CLI (Mistral) runs non-interactively via piped stdin', () => {
    const cfg = getCliConfig('cli:vibe');
    expect(cfg).not.toBeNull();
    expect(cfg!.command).toBe('vibe');
    expect(cfg!.stdinMode).toBe('pipe');
  });

  it('aider runs a single message then exits, with confirmations and auto-commits disabled', () => {
    const cfg = getCliConfig('cli:aider');
    expect(cfg).not.toBeNull();
    expect(cfg!.command).toBe('aider');
    expect(cfg!.stdinMode).toBe('arg');
    expect(cfg!.args('hello world')).toEqual([
      '--message',
      'hello world',
      '--yes',
      '--no-auto-commits'
    ]);
  });

  it('warp uses the Oz CLI to run an agent headlessly', () => {
    const cfg = getCliConfig('cli:warp');
    expect(cfg).not.toBeNull();
    expect(cfg!.command).toBe('oz');
    expect(cfg!.stdinMode).toBe('arg');
    expect(cfg!.args('hello world')).toEqual(['agent', 'run', '--prompt', 'hello world']);
  });
});
