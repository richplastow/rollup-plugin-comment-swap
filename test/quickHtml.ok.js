const test = require('ava');
const commentSwap = require('../dist/cjs');

const id = 'index.html';

test('quickHtml() ok: No Comment Swaps', t => {
    const boringCode = '<h1>Hello <em>World</em></h1>';
    t.is(commentSwap().transform(boringCode, id), null);
});

test('quickHtml() ok', t => {
    const boringCode = 'dev';
    const funCode = 'Dev<!--= Prod -->';
    const idLongExt = 'some/path/page.HtMl';
    const idShortExt = 'some/path/page.htm';
    const expected = 'Prod';

    t.is(commentSwap().transform(boringCode, idLongExt), null);
    t.is(commentSwap().transform(funCode, idLongExt), expected);
    t.is(commentSwap().transform(funCode, idShortExt), expected);
});

test('quickHtml() ok: Literal', t => {
    const literalAfter  = '<h1><!-- Hi =-->Hello <em><!-- Planet =-->World</em></h1>';
    const literalBefore  = '<h1>Hello <!--= Hi --><em>World<!--= Planet --></em></h1>';
    const literalEmpty  = '<h1>Hello<!--=-->Hi <em>World<!--=-->Planet</em></h1>';
    const literalOk = '<h1>Hi <em>Planet</em></h1>';

    t.is(commentSwap({ quick:true }).transform(literalAfter, id), literalOk);
    t.is(commentSwap().transform(literalAfter, id), literalOk); // defaults to `quick:true`
    t.is(commentSwap().transform(literalBefore, id), literalOk);
    t.is(commentSwap().transform(literalEmpty, id), literalOk);
});

test('quickHtml() ok: Ternary Literal', t => {
    const ternaryAlmostEmptyConditionLiteral = '<!-- \t\n ?--> <h1> <!--= <h2> -->Hi <!-- ?--></h1><!--=</h2>--> !';
    const ternaryEmptyConditionLiteral = '<!--?--> <h1> <!--= <h2> -->Hi <!--?--></h1><!--=</h2>--> !';
    const ternaryFalseyConditionLiteral = '<!-- falsey ?--> <h1> <!--= <h2> -->Hi </h2> !';
    const ternaryMissingConditionLiteral = '<!-- missing ?--> <h1> <!--= <h2> -->Hi </h2> !';
    const ternaryTruthyConditionLiteral = '<!-- truthy ?--> <h2> <!--= <h1> -->Hi </h2> !';
    const ternaryOk = ' <h2> Hi </h2> !';

    t.is(commentSwap().transform(ternaryAlmostEmptyConditionLiteral, id), ternaryOk);
    t.is(commentSwap().transform(ternaryEmptyConditionLiteral, id), ternaryOk);
    t.is(commentSwap({ $:{ falsey:'' } }).transform(ternaryFalseyConditionLiteral, id), ternaryOk);
    t.is(commentSwap().transform(ternaryMissingConditionLiteral, id), ternaryOk);
    t.is(commentSwap({ $:{ truthy:[] } }).transform(ternaryTruthyConditionLiteral, id), ternaryOk);
});

test('quickHtml() ok: Ternary Variable', t => {
    const ternaryEmptyConditionVariable =
        ' <!-- \t\n ?--><h1><!--$ begin --> Hi<!--?--></h1><!--$ end --> }';
    const ternaryFalseyConditionVariable =
        '<!-- falsey ?--> <h1> <!--$ beginSpc -->Hi<!--nonesuch?--></h1> <!--$endSpc-->}';
    const ternaryTruthyConditionVariable =
        '<!-- truthy ?--> <h2> <!--$ end -->Hi<!-- end ?--> </h2><!--$falsey--> }';
    const ternaryVariableDoesNotExist =
        ' <!-- falsey?--><h2><!--$ nonesuch --> Hi<!-- ?--> </h2><!--$nonesuch--> }';
    const ternaryOk = ' <h2> Hi </h2> }';
    const opts = {
        $:{ falsey:false, begin:'<h2>', beginSpc:' <h2> ', end:' </h2>' , endSpc:' </h2> ', truthy:123 }
    };

    t.is(commentSwap(opts).transform(ternaryEmptyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryFalseyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryTruthyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryVariableDoesNotExist, id), ternaryOk);
});

test('quickHtml() ok: Variable', t => {
    const variableAfter = '<h1><!-- greet $-->Hello <em><!-- place $-->World</em></h1>';
    const variableBefore = '<h1>Hello <!--$ greet --><em>World<!--$ place --></em></h1>';
    const variableNonesuch = '<h1><!-- nonesuch $-->Hi <em>Planet<!--$ nonesuch--></em></h1>';
    const variableOk = '<h1>Hi <em>Planet</em></h1>';
    const opts = {
        $:{ greet:'Hi', place:'Planet' }
    };

    t.is(commentSwap(opts).transform(variableAfter, id), variableOk);
    t.is(commentSwap(opts).transform(variableBefore, id), variableOk);
    t.is(commentSwap(opts).transform(variableNonesuch, id), variableOk);
});
