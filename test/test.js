const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('..');

test('Plugin name', t => {
	t.is(commentSwap().name, 'commentSwap');
});

test('quickCss() passes', t => {
	const code = 'abc';
	const id = 'foo.css';
	const expected = 'abc\n\n// @TODO quickCss';
	t.is(commentSwap().transform(code, id), expected);
	t.is(commentSwap({ quick:true }).transform(code, id), expected);
});

test('slow passes', t => {
	t.is(commentSwap({ quick:false }).transform('abc'), 'abc\n\n// @TODO slow');
});

test('fail', async t => {
	const foo = Promise.resolve('foo');
	t.is(await foo, 'foo');
});
