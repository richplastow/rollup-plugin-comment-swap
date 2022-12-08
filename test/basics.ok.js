const test = require('ava');
// const { rollup } = require('rollup'); //@TODO integration tests

const commentSwap = require('../dist/cjs');

test('Plugin name', t => {
    t.is(commentSwap().name, 'commentSwap');
});
