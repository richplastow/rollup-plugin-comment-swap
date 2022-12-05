const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('../dist/cjs');

test('Plugin name', t => {
    t.is(commentSwap().name, 'commentSwap');
});

test('quickCss() passes', t => {
    const boringCode = 'foo()';
    const funCode = 'foo() /*= bar() */';
    const id = 'style.css';
    const expected = 'foo() /*= bar() */\n\n// @TODO quickCss';

    t.is(commentSwap().transform(boringCode, id), null);
    t.is(commentSwap().transform(funCode, id), expected); // defaults to `quick:true`
    t.is(commentSwap({ quick:true }).transform(funCode, id), expected);
});

test('quickCss() fails', t => {
    const literalBeforeEndsEquals = 'abc /*= d =*/';
    const literalBeforeEndsDollar = 'ab /*= cd $*/';
    const literalBeforeEndsQuestion = 'a /*= b ?*/';
    const ternaryBeforeEndsEquals = '/*: bcd =*/';
    const ternaryBeforeEndsDollar = 'abcde /*: fg $*/';
    const ternaryBeforeEndsQuestion = 'ab /*: cd ?*/';
    const variableBeforeEndsEquals = 'a /*$ bcd =*/';
    const variableBeforeEndsDollar = 'ab /*$ cd $*/';
    const variableBeforeEndsQuestion = 'abc /*$ d ?*/';
    const id = 'style.css';

    t.throws(() => commentSwap().transform(literalBeforeEndsEquals, id), {
        instanceOf: Error,
        message: "'LiteralBefore' Comment Swap ends '=' (pos 4)",
    });
    t.throws(() => commentSwap().transform(literalBeforeEndsDollar, id), {
        message: "'LiteralBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => commentSwap().transform(literalBeforeEndsQuestion, id), {
        message: "'LiteralBefore' Comment Swap ends '?' (pos 2)" });

    t.throws(() => commentSwap().transform(ternaryBeforeEndsEquals, id), {
        message: "'TernaryIfFalse' Comment Swap ends '=' (pos 0)" });
    t.throws(() => commentSwap().transform(ternaryBeforeEndsDollar, id), {
        message: "'TernaryIfFalse' Comment Swap ends '$' (pos 6)" });
    t.throws(() => commentSwap().transform(ternaryBeforeEndsQuestion, id), {
        message: "'TernaryIfFalse' Comment Swap ends '?' (pos 3)" });

    t.throws(() => commentSwap().transform(variableBeforeEndsEquals, id), {
        message: "'VariableBefore' Comment Swap ends '=' (pos 2)" });
    t.throws(() => commentSwap().transform(variableBeforeEndsDollar, id), {
        message: "'VariableBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => commentSwap().transform(variableBeforeEndsQuestion, id), {
        message: "'VariableBefore' Comment Swap ends '?' (pos 4)" });

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
