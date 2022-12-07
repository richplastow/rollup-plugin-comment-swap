const test = require('ava');
// const { rollup } = require('rollup');

const commentSwap = require('../dist/cjs');

test('Plugin name', t => {
    t.is(commentSwap().name, 'commentSwap');
});

test('quickCss() passes', t => {
	const boringCode = 'h1 { color:red }';
    const id = 'style.css';

    const literalAfter  = '/* h2 =*/ h1 { color:/*blue=*/red }';
    const literalBefore = ' h1/*=h2*/ { color:red /*= blue */}';
    const literalOut = ' h2 { color:blue }';

    const ternaryEmptyConditionLiteral = '/* \t\n ?*/ h1 /*= h2 */{ color:/*?*/red/*=blue*/ }';
    const ternaryFalseyConditionLiteral = '/* falsey ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryMissingConditionLiteral = '/* missing ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryTruthyConditionLiteral = '/* truthy ?*/ h2 /*= h1 */{ color:blue }';
    const ternaryOut = ' h2 { color:blue }';

    const variableAfter  = '/* h2 $*/ h1 { color:/*blue$*/red }';
    const variableBefore = ' h1/*$h2*/ { color:red /*$ blue */}';
    const variableOut = ' h2 { color:blue }';

    t.is(commentSwap().transform(boringCode, id), null);

    t.is(commentSwap({ quick:true }).transform(literalAfter, id), literalOut);
    t.is(commentSwap().transform(literalAfter, id), literalOut); // defaults to `quick:true`
    t.is(commentSwap().transform(literalBefore, id), literalOut);

    t.is(commentSwap().transform(ternaryEmptyConditionLiteral, id), ternaryOut);
    t.is(commentSwap({ $:{ falsey:'' } }).transform(ternaryFalseyConditionLiteral, id), ternaryOut);
    t.is(commentSwap().transform(ternaryMissingConditionLiteral, id), ternaryOut);
    t.is(commentSwap({ $:{ truthy:[] } }).transform(ternaryTruthyConditionLiteral, id), ternaryOut);

    t.is(commentSwap().transform(variableAfter, id), variableOut);
    t.is(commentSwap().transform(variableBefore, id), variableOut);
});

test('quickCss() fails', t => {
    const literalAfterAtEnd = 'abc /* def =*/';
    const literalAfterNoReplacement = '/* abc =*/ :def';

    const literalBeforeAtStart = '/*= abc */ def';
    const literalBeforeNoReplacement = 'abc:  /*= def */';
    const literalBeforeEndsEquals = 'abc /*= d =*/';
    const literalBeforeEndsDollar = 'ab /*= cd $*/';
    const literalBeforeEndsQuestion = 'a /*= b ?*/';

    const ternaryConditionAtEnd = '/* abc ?*/';
    const ternaryConditionIsOnlyCommentSwap = '/* abc ?*/ def /* ghi */';
    const ternaryConditionThenLiteralAfter = '/* abc ?*/ def /* ghi =*/ jkl';
    const ternaryConditionThenVariableAfter = 'a /* bc ?*/ def /* ghi $*/ jkl';
    const twoTernaryConditionsApart = '\t/* abc ?*/ def /* ghi ?*/ jkl';
    const twoTernaryConditionsTogether = '.../* abc ?*//* def ?*/ ghi';

    const ternarySyntaxError = '/* # ?*/ a /*= b */';

    const variableAfterAtEnd = 'abc/*def$*/';
    const variableAfterNoReplacement = 'abc/*def$*/ ';

    const variableBeforeAtStart = '/*$ abc */ def';
    const variableBeforeNoReplacement = 'abc:  /*$ def */';
    const variableBeforeEndsEquals = 'a /*$ bcd =*/';
    const variableBeforeEndsDollar = 'ab /*$ cd $*/';
    const variableBeforeEndsQuestion = 'abc /*$ d ?*/';
    const id = 'style.css';

    t.throws(() => commentSwap().transform(literalAfterAtEnd, id), {
        instanceOf: Error,
        message: "A 'LiteralAfter' Comment Swap is at end of code",
    });
    t.throws(() => commentSwap().transform(literalAfterNoReplacement, id), {
        message: "A 'LiteralAfter' Comment Swap has nothing after it to replace" });

    t.throws(() => commentSwap().transform(literalBeforeAtStart, id), {
        message: "A 'LiteralBefore' Comment Swap is at pos 0" });
    t.throws(() => commentSwap().transform(literalBeforeNoReplacement, id), {
        message: "A 'LiteralBefore' Comment Swap has nothing before it to replace" });
    t.throws(() => commentSwap().transform(literalBeforeEndsEquals, id), {
        message: "'LiteralBefore' Comment Swap ends '=' (pos 4)" });
    t.throws(() => commentSwap().transform(literalBeforeEndsDollar, id), {
        message: "'LiteralBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => commentSwap().transform(literalBeforeEndsQuestion, id), {
        message: "'LiteralBefore' Comment Swap ends '?' (pos 2)" });

    t.throws(() => commentSwap().transform(ternaryConditionAtEnd, id), {
        message: "A 'TernaryCondition' Comment Swap is at end of code" });
    t.throws(() => commentSwap().transform(ternaryConditionIsOnlyCommentSwap, id), {
        message: "'TernaryCondition' at pos 0 is the last Comment Swap in the code" });
    t.throws(() => commentSwap().transform(ternaryConditionThenLiteralAfter, id), {
        message: "'LiteralAfter' at pos 15 follows 'TernaryCondition' at pos 0" });
    t.throws(() => commentSwap().transform(ternaryConditionThenVariableAfter, id), {
        message: "'VariableAfter' at pos 16 follows 'TernaryCondition' at pos 2" });
    t.throws(() => commentSwap().transform(twoTernaryConditionsApart, id), {
        message: "'TernaryCondition' at pos 16 follows 'TernaryCondition' at pos 1" });
    t.throws(() => commentSwap().transform(twoTernaryConditionsTogether, id), {
        message: "'TernaryCondition' at pos 13 follows 'TernaryCondition' at pos 3" });

    t.throws(() => commentSwap().transform(ternarySyntaxError, id), {
        message: "'TernaryCondition' at pos 0 fails /^[$_a-z][$_a-z0-9]*$/i" });

    t.throws(() => commentSwap().transform(variableAfterAtEnd, id), {
        message: "A 'VariableAfter' Comment Swap is at end of code" });
    t.throws(() => commentSwap().transform(variableAfterNoReplacement, id), {
        message: "A 'VariableAfter' Comment Swap has nothing after it to replace" });

    t.throws(() => commentSwap().transform(variableBeforeAtStart, id), {
        message: "A 'VariableBefore' Comment Swap is at pos 0" });
    t.throws(() => commentSwap().transform(variableBeforeNoReplacement, id), {
        message: "A 'VariableBefore' Comment Swap has nothing before it to replace" });
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
