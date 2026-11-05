// How maigret is started: through the soxoj/maigret Docker image, or a maigret
// binary on PATH (pip/pipx/conda install, or the bundled one in this repo's
// Docker image, where no Docker daemon is available). See #22.

export const DOCKER_IMAGE = 'soxoj/maigret:latest';
export const LOCAL_BINARY = 'maigret';

export type RunnerMode = 'docker' | 'local';
export type RunnerSetting = RunnerMode | 'auto';

export interface Command {
  cmd: string;
  args: string[];
}

/** Reads MAIGRET_RUNNER. Unset or empty means auto; anything else is an error. */
export function parseRunnerSetting(value: string | undefined): RunnerSetting {
  const v = (value ?? '').trim().toLowerCase();
  if (v === '' || v === 'auto') return 'auto';
  if (v === 'docker' || v === 'local') return v;
  throw new Error(`MAIGRET_RUNNER must be "docker", "local" or "auto" (got "${value}")`);
}

/** Auto picks a local maigret when one is installed, otherwise Docker. */
export function resolveRunner(setting: RunnerSetting, localAvailable: boolean): RunnerMode {
  if (setting !== 'auto') return setting;
  return localAvailable ? 'local' : 'docker';
}

/**
 * The command that runs maigret with `maigretArgs`, writing reports to `reportsDir`.
 * Arguments stay an array for execFile, so nothing passes through a shell.
 */
export function buildCommand(mode: RunnerMode, reportsDir: string, maigretArgs: string[]): Command {
  if (mode === 'local') {
    return { cmd: LOCAL_BINARY, args: [...maigretArgs, '--folderoutput', reportsDir] };
  }
  return {
    cmd: 'docker',
    args: ['run', '--rm', '-v', `${reportsDir}:/app/reports`, DOCKER_IMAGE, ...maigretArgs],
  };
}
