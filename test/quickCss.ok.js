const test = require('ava');
const commentSwap = require('../dist/cjs');

const id = 'style.css';

test('quickCss() ok: No Comment Swaps', t => {
    const boringCode = 'h1 { color:red }';
    t.is(commentSwap().transform(boringCode, id), null);
});

test('quickCss() ok: Literal', t => {
    const literalAfter  = '/* h2 =*/ h1 { color:/*blue=*/red }';
    const literalBefore = ' h1/*=h2*/ { color:red /*= blue */}';
    const literalOut = ' h2 { color:blue }';

    t.is(commentSwap({ quick:true }).transform(literalAfter, id), literalOut);
    t.is(commentSwap().transform(literalAfter, id), literalOut); // defaults to `quick:true`
    t.is(commentSwap().transform(literalBefore, id), literalOut);
});

test('quickCss() ok: Ternary', t => {
    const ternaryEmptyConditionLiteral = '/* \t\n ?*/ h1 /*= h2 */{ color:/*?*/red/*=blue*/ }';
    const ternaryFalseyConditionLiteral = '/* falsey ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryMissingConditionLiteral = '/* missing ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryTruthyConditionLiteral = '/* truthy ?*/ h2 /*= h1 */{ color:blue }';
    const ternaryOut = ' h2 { color:blue }';

    t.is(commentSwap().transform(ternaryEmptyConditionLiteral, id), ternaryOut);
    t.is(commentSwap({ $:{ falsey:'' } }).transform(ternaryFalseyConditionLiteral, id), ternaryOut);
    t.is(commentSwap().transform(ternaryMissingConditionLiteral, id), ternaryOut);
    t.is(commentSwap({ $:{ truthy:[] } }).transform(ternaryTruthyConditionLiteral, id), ternaryOut);
});

test('quickCss() ok: Variable', t => {
    const variableAfter  = '/* h2 $*/ h1 { color:/*blue$*/red }';
    const variableBefore = ' h1/*$h2*/ { color:red /*$ blue */}';
    const variableOut = ' h2 { color:blue }';

    t.is(commentSwap().transform(variableAfter, id), variableOut);
    t.is(commentSwap().transform(variableBefore, id), variableOut);
});
