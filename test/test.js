const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('..');

test('Plugin name', t => {
	t.is(commentSwap().name, 'commentSwap');
});

test('quick passes', t => {
	t.is(commentSwap().transform('abc'), 'abc\n\n// @TODO quick');
	t.is(commentSwap({ quick:true }).transform('abc'), 'abc\n\n// @TODO quick');
});

test('slow passes', t => {
	t.is(commentSwap({ quick:false }).transform('abc'), 'abc\n\n// @TODO slow');
});

test('fail', async t => {
	const foo = Promise.resolve('foo');
	t.is(await foo, 'foo');
});
