import * as pkg from '../lib/pkg.js';
import update from '../lib/update.js';

export const description = 'Setup xo for linting.';

export const commit = {
	scope: 'package.json',
	subject: description,
};

export async function postcondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const devDeps = pkg.devDeps(pkgjson);
	assert(devDeps.has('xo'));
	assert(pkgjson.xo !== undefined);
	assert(pkgjson.prettier !== undefined);
	assert(pkgjson.scripts?.lint !== undefined);
	assert(pkgjson.scripts?.['lint-and-fix'] !== undefined);
}

export async function precondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const devDeps = pkg.devDeps(pkgjson);
	assert(!devDeps.has('xo'));
	assert(pkgjson.xo === undefined);
	assert(pkgjson.prettier === undefined);
	assert(pkgjson.scripts?.lint === undefined);
	assert(pkgjson.scripts?.['lint-and-fix'] === undefined);
}

export async function apply({readPkg, writePkg, upgrade, fixPkg}) {
	await update({
		read: readPkg,
		write: writePkg,
		edit: (pkgjson) => {
			pkgjson.devDependencies.xo = '0.0.0';
			pkgjson.scripts.lint = 'xo';
			pkgjson.scripts['lint-and-fix'] = 'npm run lint -- --fix';
			pkgjson.xo = xoConfig;
			pkgjson.prettier = prettierConfig;
			return pkgjson;
		},
	});
	await upgrade('xo');
	await fixPkg();
}

export const dependencies = ['package.json:initial-lint'];

const xoConfig = {
	prettier: true,
	plugins: ['unicorn'],
	rules: {
		'unicorn/filename-case': [
			'error',
			{
				case: 'camelCase',
			},
		],
	},
	overrides: [
		{
			files: ['doc/**'],
			env: 'browser',
		},
	],
};

const prettierConfig = {
	trailingComma: 'all',
};