const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('../dist/cjs');

test('Plugin name', t => {
	t.is(commentSwap().name, 'commentSwap');
});

test('quickCss() passes', t => {
	const code = 'abc';
	const id = 'style.css';
	const expected = 'abc\n\n// @TODO quickCss';
	t.is(commentSwap().transform(code, id), expected);
	t.is(commentSwap({ quick:true }).transform(code, id), expected);
});

test('quickHtml() passes', t => {
	const code = 'abc';
	const idLong = 'some/path/page.HtMl';
	const idShort = 'some/path/page.htm';
	const expected = 'abc\n\n// @TODO quickHtml';
	t.is(commentSwap().transform(code, idLong), expected);
	t.is(commentSwap().transform(code, idShort), expected);
});

test('quickJs() passes', t => {
	const code = 'abc';
	const id = 'some/library/script.js';
	const expected = 'abc\n\n// @TODO quickJs';
	t.is(commentSwap().transform(code, id), expected);
});

test('slow passes', t => {
	const code = 'abc';
	const id = 'foo.css';
	const expected = 'abc\n\n// @TODO slow';
	t.is(commentSwap({ quick:false }).transform(code, id), expected);
});

test('fail', async t => {
	const foo = Promise.resolve('foo');
	t.is(await foo, 'foo');
});
