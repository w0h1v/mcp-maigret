import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommand, parseRunnerSetting, resolveRunner, DOCKER_IMAGE } from '../build/runner.js';

test('MAIGRET_RUNNER parsing', () => {
  assert.equal(parseRunnerSetting(undefined), 'auto');
  assert.equal(parseRunnerSetting(''), 'auto');
  assert.equal(parseRunnerSetting(' Local '), 'local');
  assert.equal(parseRunnerSetting('docker'), 'docker');
  assert.throws(() => parseRunnerSetting('podman'), /MAIGRET_RUNNER/);
});

test('auto prefers a local maigret, falls back to Docker', () => {
  assert.equal(resolveRunner('auto', true), 'local');
  assert.equal(resolveRunner('auto', false), 'docker');
  assert.equal(resolveRunner('docker', true), 'docker');
  assert.equal(resolveRunner('local', false), 'local');
});

test('docker command mounts the reports dir and keeps arguments as an array', () => {
  const c = buildCommand('docker', '/r', ['alice', '--txt']);
  assert.deepEqual(c, {
    cmd: 'docker',
    args: ['run', '--rm', '-v', '/r:/app/reports', DOCKER_IMAGE, 'alice', '--txt'],
  });
});

test('local command writes reports to the reports dir', () => {
  const c = buildCommand('local', '/r', ['alice', '--txt']);
  assert.deepEqual(c, { cmd: 'maigret', args: ['alice', '--txt', '--folderoutput', '/r'] });
});
