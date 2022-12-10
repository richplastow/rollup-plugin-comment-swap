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
    const literalEmpty = 'article/*=*/ h2 { /*hullo*//*=*/color:blue }';
    const literalOk = ' h2 { color:blue }';

    t.is(commentSwap({ quick:true }).transform(literalAfter, id), literalOk);
    t.is(commentSwap().transform(literalAfter, id), literalOk); // defaults to `quick:true`
    t.is(commentSwap().transform(literalBefore, id), literalOk);
    t.is(commentSwap().transform(literalEmpty, id), literalOk);
});

test('quickCss() ok: Ternary Literal', t => {
    const ternaryAlmostEmptyConditionLiteral = '/* \t\n ?*/ h1 /*= h2 */{ color:/*?*/red/*=blue*/ }';
    const ternaryEmptyConditionLiteral = '/*?*/ h1 /*= h2 */{ color:/*?*/red/*=blue*/ }';
    const ternaryFalseyConditionLiteral = '/* falsey ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryMissingConditionLiteral = '/* missing ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryTruthyConditionLiteral = '/* truthy ?*/ h2 /*= h1 */{ color:blue }';
    const ternaryOk = ' h2 { color:blue }';

    t.is(commentSwap().transform(ternaryAlmostEmptyConditionLiteral, id), ternaryOk);
    t.is(commentSwap().transform(ternaryEmptyConditionLiteral, id), ternaryOk);
    t.is(commentSwap({ $:{ falsey:'' } }).transform(ternaryFalseyConditionLiteral, id), ternaryOk);
    t.is(commentSwap().transform(ternaryMissingConditionLiteral, id), ternaryOk);
    t.is(commentSwap({ $:{ truthy:[] } }).transform(ternaryTruthyConditionLiteral, id), ternaryOk);
});

test('quickCss() ok: Ternary Variable', t => {
    const ternaryEmptyConditionVariable =
        ' /* \t\n ?*/h1/*$ heading */ { color:/*?*/red/*$ shade */ }';
    const ternaryFalseyConditionVariable =
        '/* falsey ?*/ h1 /*$ headingSpc */{ color:/*nonesuch?*/red /*$shadeSpc*/}';
    const ternaryTruthyConditionVariable =
        '/* truthy ?*/ h2 /*$ headingSpc */{ color:/*?shade*/red/*$shade*/ }';
    const ternaryVariableDoesNotExist =
        ' /* falsey?*/h2/*$ nonesuch */ { color:/* ?*/blue/*$nonesuch*/ }';
    const ternaryOk = ' h2 { color:blue }';
    const opts = {
        $:{ heading:'h2', headingSpc:' h2 ', shade:'blue' , shadeSpc:'blue ' }
    };

    t.is(commentSwap(opts).transform(ternaryEmptyConditionVariable, id), ternaryOk);
    t.is(commentSwap({ $:{ falsey:'' }, ...opts }).transform(ternaryFalseyConditionVariable, id), ternaryOk);
    t.is(commentSwap({ $:{ truthy:[] }, ...opts }).transform(ternaryTruthyConditionVariable, id), ternaryOk);
    t.is(commentSwap({ $:{ falsey:'' }, ...opts }).transform(ternaryVariableDoesNotExist, id), ternaryOk);
});

test('quickCss() ok: Variable', t => {
    const variableAfter  = '/* heading $*/ h1 { color:/*shade$*/red }';
    const variableBefore = ' h1/*$heading*/ { color:red /*$ shade */}';
    const variableNonesuch  = '/* nonesuch $*/ h2 { color:blue /*$ nonesuch */}';
    const variableNumeric  = ' h/* numeric $*/1 { color:blue }';
    const variableOk = ' h2 { color:blue }';
    const opts = {
        $:{ heading:'h2', numeric:2, shade:'blue' }
    };

    t.is(commentSwap(opts).transform(variableAfter, id), variableOk);
    t.is(commentSwap(opts).transform(variableBefore, id), variableOk);
    t.is(commentSwap(opts).transform(variableNonesuch, id), variableOk);
    t.is(commentSwap(opts).transform(variableNumeric, id), variableOk);
});

test('quickCss() ok: CSS Selector', t => {
    const comma1    = '/* h4, h3 =*/h1, h2 { color:red };';
    const comma1Ok  = 'h4, h3, h2 { color:red };';
    const comma2    = 'a,p/*=q*/{}';
    const comma2Ok  = 'a,q{}';
    const comma3    = 'div/*?*/, span/*=*/ {}';
    const comma3Ok  = 'div {}';

    t.is(commentSwap().transform(comma1, id), comma1Ok);
    t.is(commentSwap().transform(comma2, id), comma2Ok);
    t.is(commentSwap().transform(comma3, id), comma3Ok);
});
