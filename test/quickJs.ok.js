const test = require('ava');
const commentSwap = require('../dist/cjs');

const id = 'some/library/script.js';

test('quickJs() ok: No Comment Swaps', t => {
    const boringCode = 'const foo = "bar"; /* ok */';
    t.is(commentSwap().transform(boringCode, id), null);
});

test('quickJs() ok: Literal', t => {
    const literalAfter  = ' let /* foo =*/bar = "foo"';
    const literalBefore = ' let foo = "bar"/*= "foo" */';
    const literalEmpty = ' let foo = "bar " +/*=*/"foo"';
    const literalOk = ' let foo = "foo"';

    t.is(commentSwap({ quick:true }).transform(literalAfter, id), literalOk);
    t.is(commentSwap().transform(literalAfter, id), literalOk); // defaults to `quick:true`
    t.is(commentSwap().transform(literalBefore, id), literalOk);
    t.is(commentSwap().transform(literalEmpty, id), literalOk);
});
