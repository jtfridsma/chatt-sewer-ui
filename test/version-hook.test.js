import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('npm version syncs the manifest and lockfile without changing other manifest fields', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'csui-version-'));
    try {
        await mkdir(join(cwd, 'scripts'));
        for (const file of [
            'package.json',
            'package-lock.json',
            'manifest.json',
            'scripts/sync-manifest-version.mjs',
        ]) {
            await copyFile(file, join(cwd, file));
        }
        const read = async (file) => JSON.parse(await readFile(join(cwd, file), 'utf8'));
        const before = await read('manifest.json');
        execFileSync('npm', ['version', 'patch', '--no-git-tag-version'], { cwd, stdio: 'pipe' });
        const { version } = await read('package.json');
        assert.notEqual(version, before.version);
        assert.deepEqual(await read('manifest.json'), { ...before, version });
        const lock = await read('package-lock.json');
        assert.equal(lock.version, version);
        assert.equal(lock.packages[''].version, version);
    } finally {
        await rm(cwd, { recursive: true, force: true });
    }
});
