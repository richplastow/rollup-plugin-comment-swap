const test = require('ava');
const commentSwap = require('../dist/cjs');

const id = 'some/library/script.js';

test('quickJs() error: Literal After', t => {
    const literalAfterAtEnd = 'abc /* def =*/';
    const literalAfterNoReplacement = '/* abc =*/ =def';

    t.throws(() => commentSwap().transform(literalAfterAtEnd, id), {
        instanceOf: Error,
        message: "A 'LiteralAfter' Comment Swap is at end of code",
    });
    t.throws(() => commentSwap().transform(literalAfterNoReplacement, id), {
        message: "A 'LiteralAfter' Comment Swap has nothing after it to replace" });
});

test('quickJs() error: Literal Before', t => {
    const literalBeforeAtStart = '/*= abc */ def';
    const literalBeforeNoReplacement = 'abc=  /*= def */';
    const literalBeforeEndsEquals = 'abc /*= d =*/';
    const literalBeforeEndsDollar = 'ab /*= cd $*/';
    const literalBeforeEndsQuestion = 'a /*= b ?*/';

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
});

test('quickJs() error: Ternary Placement', t => {
    const ternaryConditionAtEnd = '/* abc ?*/';
    const ternaryConditionIsOnlyCommentSwap = '/* abc ?*/ def /* ghi */';
    const ternaryConditionThenLiteralAfter = '/* abc ?*/ def /* ghi =*/ jkl';
    const ternaryConditionThenVariableAfter = 'a /* bc ?*/ def /* ghi $*/ jkl';
    const twoTernaryConditionsApart = '\t/* abc ?*/ def /* ghi ?*/ jkl';
    const twoTernaryConditionsTogether = '.../* abc ?*//* def ?*/ ghi';

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
});

test('quickJs() error: Ternary Syntax', t => {
    const ternarySyntaxError = '/* # ?*/ a /*= b */';

    t.throws(() => commentSwap().transform(ternarySyntaxError, id), {
        message: "'TernaryCondition' content at pos 2 fails /^[$_a-z][$_a-z0-9]*$/i" });
});

test('quickJs() error: Variable After', t => {
    const variableAfterAtEnd = 'abc/*def$*/';
    const variableAfterNoReplacement = 'abc/*def$*/ ';

    t.throws(() => commentSwap().transform(variableAfterAtEnd, id), {
        message: "A 'VariableAfter' Comment Swap is at end of code" });
    t.throws(() => commentSwap().transform(variableAfterNoReplacement, id), {
        message: "A 'VariableAfter' Comment Swap has nothing after it to replace" });
});

test('quickJs() error: Variable Before', t => {
    const variableBeforeAtStart = '/*$ abc */ def';
    const variableBeforeNoReplacement = 'abc=  /*$ def */';
    const variableBeforeEndsEquals = 'a /*$ bcd =*/';
    const variableBeforeEndsDollar = 'ab /*$ cd $*/';
    const variableBeforeEndsQuestion = 'abc /*$ d ?*/';

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
