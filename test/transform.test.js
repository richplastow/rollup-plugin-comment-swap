const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('../dist/cjs');

test('Plugin name', t => {
    t.is(commentSwap().name, 'commentSwap');
});

test('quickCss() passes', t => {
	const boringCode = 'h1 { color:red }';
    const id = 'style.css';
    const literalBefore = ' h1/*=h2*/ { color:red /*= blue */}';
    const literalBeforeOut = ' h2 { color:blue }';

    t.is(commentSwap().transform(boringCode, id), null);
    t.is(commentSwap({ quick:true }).transform(literalBefore, id), literalBeforeOut);
    t.is(commentSwap().transform(literalBefore, id), literalBeforeOut); // defaults to `quick:true`
});

test('quickCss() fails', t => {
    const literalBeforeAtStart = '/*= abc */ def';
    const literalBeforeNoReplacement = 'abc:  /*= def */';
    const literalBeforeEndsEquals = 'abc /*= d =*/';
    const literalBeforeEndsDollar = 'ab /*= cd $*/';
    const literalBeforeEndsQuestion = 'a /*= b ?*/';

    const ternaryIfFalseAtStart = '/*: abc */ def';
    const ternaryIfFalseNoReplacement = '  /*: def */';
    const ternaryIfFalseEndsEquals = '/*: bcd =*/';
    const ternaryIfFalseEndsDollar = 'abcde /*: fg $*/';
    const ternaryIfFalseEndsQuestion = 'ab /*: cd ?*/';

    const variableBeforeAtStart = '/*$ abc */ def';
    const variableBeforeNoReplacement = 'abc:  /*$ def */';
    const variableBeforeEndsEquals = 'a /*$ bcd =*/';
    const variableBeforeEndsDollar = 'ab /*$ cd $*/';
    const variableBeforeEndsQuestion = 'abc /*$ d ?*/';
    const id = 'style.css';

    t.throws(() => commentSwap().transform(literalBeforeAtStart, id), {
        instanceOf: Error,
        message: "A 'LiteralBefore' Comment Swap is at pos 0",
    });
    t.throws(() => commentSwap().transform(literalBeforeNoReplacement, id), {
        message: "A 'LiteralBefore' Comment Swap has no replacement" });
    t.throws(() => commentSwap().transform(literalBeforeEndsEquals, id), {
        message: "'LiteralBefore' Comment Swap ends '=' (pos 4)" });
    t.throws(() => commentSwap().transform(literalBeforeEndsDollar, id), {
        message: "'LiteralBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => commentSwap().transform(literalBeforeEndsQuestion, id), {
        message: "'LiteralBefore' Comment Swap ends '?' (pos 2)" });

    t.throws(() => commentSwap().transform(ternaryIfFalseAtStart, id), {
        message: "A 'TernaryIfFalse' Comment Swap is at pos 0" });
    t.throws(() => commentSwap().transform(ternaryIfFalseEndsEquals, id), {
        message: "'TernaryIfFalse' Comment Swap ends '=' (pos 0)" });
    t.throws(() => commentSwap().transform(ternaryIfFalseEndsDollar, id), {
        message: "'TernaryIfFalse' Comment Swap ends '$' (pos 6)" });
    t.throws(() => commentSwap().transform(ternaryIfFalseEndsQuestion, id), {
        message: "'TernaryIfFalse' Comment Swap ends '?' (pos 3)" });

    t.throws(() => commentSwap().transform(variableBeforeAtStart, id), {
        message: "A 'VariableBefore' Comment Swap is at pos 0" });
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
