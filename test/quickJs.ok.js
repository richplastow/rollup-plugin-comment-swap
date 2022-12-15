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

test('quickJs() ok: Ternary Literal', t => {
    const ternaryAlmostEmptyConditionLiteral = '/* \t\n ?*/ const /*= let */foo = "foo"';
    const ternaryEmptyConditionLiteral = '/*?*/ const /*= let */foo = "foo"';
    const ternaryFalseyConditionLiteral = '/* falsey ?*/ const /*= let */foo = "foo"';
    const ternaryMissingConditionLiteral = '/* missing ?*/ const /*= let */foo = "foo"';
    const ternaryTruthyConditionLiteral = '/* truthy ?*/ let /*= const */foo = "foo"';
    const ternaryOk = ' let foo = "foo"';

    t.is(commentSwap().transform(ternaryAlmostEmptyConditionLiteral, id), ternaryOk);
    t.is(commentSwap().transform(ternaryEmptyConditionLiteral, id), ternaryOk);
    t.is(commentSwap({ $:{ falsey:'' } }).transform(ternaryFalseyConditionLiteral, id), ternaryOk);
    t.is(commentSwap().transform(ternaryMissingConditionLiteral, id), ternaryOk);
    t.is(commentSwap({ $:{ truthy:[] } }).transform(ternaryTruthyConditionLiteral, id), ternaryOk);
});

test('quickJs() ok: Ternary Variable', t => {
    const ternaryEmptyConditionLiteral =
        ' /* \t\n ?*/const/*$ assignmentKeyword */ foo = /*?*/"bar"/*$value*/';
    const ternaryFalseyConditionVariable =
        '/* falsey ?*/const/*$ assignmentKeywordSpc */foo = /*nonesuch?*/"bar"/*$value*/';
    const ternaryTruthyConditionVariable =
        '/* truthy ?*/ let /*$ falsey */foo = /*value?*/"foo"/*$assignmentKeyword*/';
    const ternaryVariableDoesNotExist =
        ' /* falsey?*/let/*$ nonesuch */ foo = /* ?*/"foo"/*$nonesuch*/';
    const ternaryOk = ' let foo = "foo"';
    const opts = {
        $:{ assignmentKeyword:'let', assignmentKeywordSpc:' let ', falsey:0, truthy:Math, value:'"foo"' }
    };

    t.is(commentSwap(opts).transform(ternaryEmptyConditionLiteral, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryFalseyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryTruthyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryVariableDoesNotExist, id), ternaryOk);
});

test('quickJs() ok: Variable', t => {
    const variableAfter  = 'fn();/* leftHand $*/ const bar =/*value$*/ "bar" ;';
    const variableBefore = 'fn(); const/*$assignmentKeyword*/ foo = "bar" /*$ value */;';
    const variableNonesuch  = 'fn();/* nonesuch $*/ let foo = "foo" /*$ nonesuch */;';
    const variableNumeric  = 'let foo =/* numeric $*/ "bar"';
    const variableOk = 'fn(); let foo = "foo" ;';
    const variableNumericOk = 'let foo = 123';
    const opts = {
        $:{ assignmentKeyword:'let', leftHand:'let foo', numeric:123, value:'"foo"' }
    };

    t.is(commentSwap(opts).transform(variableAfter, id), variableOk);
    t.is(commentSwap(opts).transform(variableBefore, id), variableOk);
    t.is(commentSwap(opts).transform(variableNonesuch, id), variableOk);
    t.is(commentSwap(opts).transform(variableNumeric, id), variableNumericOk);
});
