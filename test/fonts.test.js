import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

test('loads bundled text and icon fonts once without external font connections', async () => {
    const { outputFiles } = await build({
        stdin: {
            contents: `export { applyThemeClasses } from './src/scripts/utilities/theme.js';`,
            resolveDir: process.cwd(),
        },
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'theme',
    });
    const dom = new JSDOM('', {
        url: 'https://share.dwcorp.com/',
        runScripts: 'outside-only',
    });
    try {
        const { window } = dom;
        window.chrome = { runtime: { getURL: (path) => `chrome-extension://test/${path}` } };
        window.eval(outputFiles[0].text);
        window.theme.applyThemeClasses({ isRelevant: true });
        window.theme.applyThemeClasses({ isRelevant: true });
        const links = [...window.document.querySelectorAll('link[rel="stylesheet"]')];
        assert.deepEqual(
            links.map((link) => link.id),
            ['csui-local-fonts']
        );
        assert.equal(links[0].href, 'chrome-extension://test/public/fonts/fonts.css');
        assert.equal(window.document.querySelector('link[rel="preconnect"]'), null);
        const css = await readFile('public/fonts/fonts.css', 'utf8');
        const paths = [...css.matchAll(/url\('\.\/([^']+)'\)/g)].map((match) => match[1]);
        assert.equal(paths.length, 9);
        for (const path of paths) {
            const font = await readFile(`public/fonts/${path}`);
            assert.equal(font.readUInt32BE(0), 0x00010000);
        }
    } finally {
        dom.window.close();
    }
});
