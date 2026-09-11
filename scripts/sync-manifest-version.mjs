import { readFile, writeFile } from 'node:fs/promises';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version) ||
    version.split('.').some((part) => Number(part) > 65535) ||
    version === '0.0.0'
) {
    throw new Error('Use a Chrome-compatible numeric version, such as 0.2.1.');
}
const manifest = await readFile('manifest.json', 'utf8');
const previous = JSON.parse(manifest).version;
await writeFile(
    'manifest.json',
    manifest.replace(
        `"version": ${JSON.stringify(previous)}`,
        `"version": ${JSON.stringify(version)}`
    )
);
