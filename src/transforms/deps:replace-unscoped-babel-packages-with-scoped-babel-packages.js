import * as pkg from '../lib/pkg.js';
import update from '../lib/update.js';
import {format} from '../lib/babel.js';

export const description =
	'Replace all references to unscoped babel-* packages by references to scoped @babel/* packages.';

export const commit = {
	type: 'deps',
	subject: 'Use scoped babel packages.',
};

const babelPackages = ['polyfill', 'register', 'cli', 'preset-env'];

export async function postcondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const devDeps = pkg.devDeps(pkgjson);
	for (const dep of babelPackages) {
		assert(!devDeps.has(`babel-${dep}`));
	}
}

export async function precondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const devDeps = pkg.devDeps(pkgjson);
	assert(babelPackages.some((dep) => devDeps.has(`babel-${dep}`)));
}

export async function apply({readPkg, writePkg, upgrade, install}) {
	// Update package.json
	await update({
		read: readPkg,
		write: writePkg,
		edit(pkgjson) {
			for (const dep of babelPackages) {
				pkg.replaceDep(pkgjson, `babel-${dep}`, `@babel/${dep}`);
			}

			if (pkgjson.ava?.require) {
				for (const dep of babelPackages) {
					pkgjson.ava.require = pkgjson.ava.require.map((x) =>
						x === `babel-${dep}` ? `@babel/${dep}` : x,
					);
				}
			}

			if (pkgjson.babel?.presets) {
				const presetPrefix = 'preset-';
				const presets = babelPackages.filter((dep) =>
					dep.startsWith(presetPrefix),
				);
				for (const preset of presets) {
					const presetName = preset.slice(presetPrefix.length);
					pkgjson.babel.presets = pkgjson.babel.presets.map((x) =>
						x === presetName ? `@babel/${preset}` : x,
					);
				}
			}

			return format(pkgjson);
		},
	});

	await upgrade(babelPackages.map((dep) => `@babel/${dep}`));
	await install();
}
