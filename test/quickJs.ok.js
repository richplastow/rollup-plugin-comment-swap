const test = require('ava');
const commentSwap = require('../dist/cjs');

const id = 'some/library/script.js';

test('quickJs() ok', t => {
    const boringCode = 'abc';
    const funCode = '?*/ abc';
    const expected = '?*/ abc\n\n// @TODO quickJs';

    t.is(commentSwap().transform(boringCode, id), null);
    t.is(commentSwap().transform(funCode, id), expected);
});
