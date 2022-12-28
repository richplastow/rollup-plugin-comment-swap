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
    const variableAfter = 'fn();/* leftHand $*/ const bar =/*value$*/ "bar" ;';
    const variableBefore = 'fn(); const/*$assignmentKeyword*/ foo = "bar" /*$ value */;';
    const variableNonesuch = 'fn();/* nonesuch $*/ let foo = "foo" /*$ nonesuch */;';
    const variableNumeric = 'let foo =/* numeric $*/ "bar"';
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

test('quickJs() ok: Replaces up to open bracket', t => {
    const openBracket1   = 'function/* foo =*/  bar() {}';
    const openBracket1ok = 'function  foo() {}';
    const openBracket2   = 'function fn(\tbar/*= foo */) {}';
    const openBracket2ok = 'function fn(\tfoo) {}';

    t.is(commentSwap().transform(openBracket1, id), openBracket1ok);
    t.is(commentSwap().transform(openBracket2, id), openBracket2ok);
});

test('quickJs() ok: Replaces up to close bracket', t => {
    const closeBracket1   = 'function fn(/* foo =*/bar) {}';
    const closeBracket1ok = 'function fn(foo) {}';
    const closeBracket2   = '(1+2)*3/*=*4*/';
    const closeBracket2ok = '(1+2)*4';

    t.is(commentSwap().transform(closeBracket1, id), closeBracket1ok);
    t.is(commentSwap().transform(closeBracket2, id), closeBracket2ok);
});

test('quickJs() ok: Replaces up to comma', t => {
    const comma1   = 'add(/* 99 =*/1, 2)';
    const comma1ok = 'add(99, 2)';
    const comma2   = 'add(1, 2/*= 99 */)';
    const comma2ok = 'add(1, 99)';

    t.is(commentSwap().transform(comma1, id), comma1ok);
    t.is(commentSwap().transform(comma2, id), comma2ok);
});

test('quickJs() ok: Replaces up to colon', t => {
    const colon1   = '{ /* bar =*/foo:1 }';
    const colon1ok = '{ bar:1 }';
    const colon2   = '{ foo:99/*= 1 */ }';
    const colon2ok = '{ foo:1 }';

    t.is(commentSwap().transform(colon1, id), colon1ok);
    t.is(commentSwap().transform(colon2, id), colon2ok);
});

test('quickJs() ok: Replaces up to semicolon', t => {
    const semicolon1   = 'let foo = /* "foo" =*/"bar" ;';
    const semicolon1ok = 'let foo = "foo" ;';
    const semicolon2   = 'h1 { color:red; width/*= top */:0 }';
    const semicolon2ok = 'h1 { color:red; top:0 }';

    t.is(commentSwap().transform(semicolon1, id), semicolon1ok);
    t.is(commentSwap().transform(semicolon2, id), semicolon2ok);
});

test('quickJs() ok: Replaces up to equals', t => {
    const equals1   = 'let /* foo =*/\rbar\n\r= "foo"';
        const equals1ok = 'let \rfoo\n\r= "foo"';
    const equals2   = 'let foo ="bar"\f/*= "foo" */';
    const equals2ok = 'let foo ="foo"\f';

    t.is(commentSwap().transform(equals1, id), equals1ok);
    t.is(commentSwap().transform(equals2, id), equals2ok);
});

test('quickJs() ok: Replaces up to open curly bracket', t => {
    const openCurly1   = 'class /* Bar =*/Foo {}';
    const openCurly1ok = 'class Bar {}';
    const openCurly2   = 'item => { add/*= remove */(item) }';
    const openCurly2ok = 'item => { remove(item) }';

    t.is(commentSwap().transform(openCurly1, id), openCurly1ok);
    t.is(commentSwap().transform(openCurly2, id), openCurly2ok);
});

test('quickJs() ok: Replaces up to close curly bracket', t => {
    const closeCurly1   = 'import { a, /* b =*/c } from "d"';
    const closeCurly1ok = 'import { a, b } from "d"';
    const closeCurly2   = 'import { a } from "b"/*= from "c" */';
    const closeCurly2ok = 'import { a } from "c"';

    t.is(commentSwap().transform(closeCurly1, id), closeCurly1ok);
    t.is(commentSwap().transform(closeCurly2, id), closeCurly2ok);
});
