import update from '../lib/update.js';
import replace from '../lib/text/replace.js';
import * as pkg from '../lib/pkg.js';

export const description = 'Configure microbundle to produce build.';

export const commit = {
	type: 'build',
	subject: description,
};

export async function postcondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const devDeps = pkg.devDeps(pkgjson);
	assert(!devDeps.has('@babel/cli'));
	assert(devDeps.has('microbundle'));
	assert(pkgjson.bin === undefined);
	assert(pkgjson.main === 'dist/index.js');
}

export async function precondition({readPkg, assert}) {
	const pkgjson = await readPkg();
	const devDeps = pkg.devDeps(pkgjson);
	assert(devDeps.has('@babel/cli'));
	assert(!devDeps.has('microbundle'));
	assert(pkgjson.bin === undefined);
	assert(pkgjson.main === 'lib/index.js');
}

export async function apply({
	readPkg,
	writePkg,
	read,
	write,
	remove,
	upgrade,
	fixConfig,
	install,
}) {
	await update({
		read: readPkg,
		write: writePkg,
		edit: (pkgjson) => {
			pkg.replaceDep(pkgjson, '@babel/cli', 'microbundle');
			pkgjson.source = 'src/index.js';
			pkgjson.main = 'dist/index.js';
			pkgjson.module = 'dist/index.module.js';
			pkgjson['umd:main'] = 'dist/index.umd.js';
			pkgjson.unpkg = 'dist/index.umd.js';
			pkgjson.exports = {
				'.': {
					browser: './dist/index.module.js',
					umd: './dist/index.umd.js',
					require: './dist/index.js',
					default: './dist/index.modern.js',
				},
			};
			pkgjson.files = pkgjson.files.map((x) => (x === 'lib' ? 'dist' : x));
			pkgjson.scripts.build = 'NODE_ENV=production microbundle';
			return pkgjson;
		},
	});
	await replace(
		[['- "lib/', () => '- "dist/']],
		['.codacy.yml', '.codeclimate.yml'],
		{read, write, method: replace.all},
	);
	await replace([['/lib', () => '/dist']], ['.gitignore'], {
		read,
		write,
		method: replace.all,
	});
	await remove(['lib/**']);
	await upgrade('microbundle');
	await fixConfig();
	await install();
}

export const dependencies = ['config:lint-setup'];