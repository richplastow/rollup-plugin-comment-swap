const test = require('ava');
const commentSwap = require('../dist/cjs');

const id = 'foo.js';

test('slow() ok', t => {
    const boringCode = 'abc';
    const funCode = 'abc =*/';
    const expected = 'abc =*/\n\n// @TODO slow';

    t.is(commentSwap({ quick:false }).transform(boringCode, id), null);
    t.is(commentSwap({ quick:false }).transform(funCode, id), expected);
});
