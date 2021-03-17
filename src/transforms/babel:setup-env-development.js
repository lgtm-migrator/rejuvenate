import update from '../lib/update.js';
import {includes, replaceOrInsert} from '../lib/babel.js';

export const description = 'Setup development environment.';

export const commit = {
	type: 'config',
	scope: 'babel',
	subject: description,
};

const presetPowerAssert = 'babel-preset-power-assert';
const pluginRemoveDebug = [
	'transform-remove-console',
	{
		exclude: ['log', 'error', 'warn'],
	},
];
export async function postcondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const env = pkgjson.babel?.env?.development;
	assert(env !== undefined);
	assert(env.presets !== undefined);
	assert(env.plugins !== undefined);
	assert(includes(env.presets, presetPowerAssert));
	assert(includes(env.plugins, pluginRemoveDebug));
}

export async function precondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const env = pkgjson.babel?.env?.development;
	assert(
		!includes(env?.presets, presetPowerAssert) ||
			!includes(env?.plugins, pluginRemoveDebug),
	);
}

export async function apply({readPkg, writePkg, fixConfig}) {
	await update({
		read: readPkg,
		write: writePkg,
		edit: (pkgjson) => {
			const env = pkgjson.babel.env.development;
			env.presets = replaceOrInsert(env.presets, presetPowerAssert);
			env.plugins = replaceOrInsert(env.plugins, pluginRemoveDebug);
			return pkgjson;
		},
	});
	await fixConfig();
}

export const dependencies = [
	'config:lint-setup',
	'babel:setup-presets',
	'deps:add-babel-preset-power-assert',
	'deps:add-babel-plugin-transform-remove-console',
	'package.json:ensure-babel-env-development',
];
