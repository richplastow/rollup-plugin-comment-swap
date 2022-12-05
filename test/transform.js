const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('../dist/cjs');

test('Plugin name', t => {
	t.is(commentSwap().name, 'commentSwap');
});

test('quickCss() passes', t => {
	const boringCode = 'abc';
	const funCode = 'abc /*=';
	const id = 'style.css';
	const expected = 'abc /*=\n\n// @TODO quickCss';

	t.is(commentSwap({ quick:true }).transform(boringCode, id), null);
	t.is(commentSwap().transform(funCode, id), expected); // defaults to `quick:true`
	t.is(commentSwap({ quick:true }).transform(funCode, id), expected);
});

test('quickHtml() passes', t => {
	const boringCode = 'abc';
	const funCode = 'abc $-->';
	const idLongExt = 'some/path/page.HtMl';
	const idShortExt = 'some/path/page.htm';
	const expected = 'abc $-->\n\n// @TODO quickHtml';

	t.is(commentSwap().transform(boringCode, idLongExt), null);
	t.is(commentSwap().transform(funCode, idLongExt), expected);
	t.is(commentSwap().transform(funCode, idShortExt), expected);
});

test('quickJs() passes', t => {
	const boringCode = 'abc';
	const funCode = '?*/ abc';
	const id = 'some/library/script.js';
	const expected = '?*/ abc\n\n// @TODO quickJs';

	t.is(commentSwap().transform(boringCode, id), null);
	t.is(commentSwap().transform(funCode, id), expected);
});

test('slow passes', t => {
	const boringCode = 'abc';
	const funCode = 'abc =*/';
	const id = 'foo.js';
	const expected = 'abc =*/\n\n// @TODO slow';

	t.is(commentSwap({ quick:false }).transform(boringCode, id), null);
	t.is(commentSwap({ quick:false }).transform(funCode, id), expected);
});
