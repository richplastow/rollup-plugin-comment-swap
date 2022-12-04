const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('..');

test('pass', t => {
	t.is(commentSwap().name, 'commentSwap');
	t.is(commentSwap().transform('abc'), 'abc\n\n// ok!');
});

test('fail', async t => {
	const foo = Promise.resolve('foo');
	t.is(await foo, 'foo');
});
