import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

test('loads bundled text fonts once and keeps only icons on Google Fonts', async () => {
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
            ['csui-local-fonts', 'csui-google-symbols']
        );
        assert.equal(links[0].href, 'chrome-extension://test/public/fonts/fonts.css');
        assert.match(links[1].href, /family=Material\+Symbols\+Rounded/);
        const css = await readFile('public/fonts/fonts.css', 'utf8');
        const paths = [...css.matchAll(/url\('\.\/([^']+)'\)/g)].map((match) => match[1]);
        assert.equal(paths.length, 8);
        for (const path of paths) {
            const font = await readFile(`public/fonts/${path}`);
            assert.equal(font.readUInt32BE(0), 0x00010000);
        }
    } finally {
        dom.window.close();
    }
});
