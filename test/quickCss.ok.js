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
        '/* truthy ?*/ h2 /*$ shade */{ color:/* shade ?*/blue/*$falsey*/ }';
    const ternaryVariableDoesNotExist =
        ' /* falsey?*/h2/*$ nonesuch */ { color:/* ?*/blue/*$nonesuch*/ }';
    const ternaryOk = ' h2 { color:blue }';
    const opts = {
        $:{ falsey:'', heading:'h2', headingSpc:' h2 ', shade:'blue' , shadeSpc:'blue ', truthy:[] }
    };

    t.is(commentSwap(opts).transform(ternaryEmptyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryFalseyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryTruthyConditionVariable, id), ternaryOk);
    t.is(commentSwap(opts).transform(ternaryVariableDoesNotExist, id), ternaryOk);
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
    const comma1    = '/* h4, h3 =*/h1, h2   { color:red }';
    const comma1ok  = 'h4, h3   { color:red }';
    const comma2    = 'a,p/*=q*/{}';
    const comma2ok  = 'q{}';
    const comma3    = 'div/*?*/, span/*=*/ {}';
    const comma3ok  = 'div {}';

    t.is(commentSwap().transform(comma1, id), comma1ok);
    t.is(commentSwap().transform(comma2, id), comma2ok);
    t.is(commentSwap().transform(comma3, id), comma3ok);

    const id1    = ' /*  #prod  =*/  #dev{ color:red }';
    const id1ok  = '   #prod{ color:red }';
    const id2    = 'a{color:blue}  h2#dev   /*= h1#prod */ { color:red }';
    const id2ok  = 'a{color:blue}  h1#prod    { color:red }';
    const id3    = 'div/*?*/#dev/*=#prod*/ {}';
    const id3ok  = 'div#prod {}';

    t.is(commentSwap().transform(id1, id), id1ok);
    t.is(commentSwap().transform(id2, id), id2ok);
    t.is(commentSwap().transform(id3, id), id3ok);

    const class1     = 'ul.big/*.prod.ok=*/.dev.error { color:red }';
    const class1ok   = 'ul.big.prod.ok { color:red }';
    const class2     = 'a{color:blue}\tul.big.dev.error/*=div.big.prod.ok*/{ color:red }';
    const class2ok   = 'a{color:blue}\tdiv.big.prod.ok{ color:red }';
    const class3bad  = 'ul.big./*?*/dev./*=prod.*/ok {color:red}'; // css(css-identifierexpected), though browsers do display it
    const class3good = 'ul.big/*?*/.dev/*=.prod*/.ok {color:red}'; // this is the proper syntax
    const class3ok   = 'ul.big.prod.ok {color:red}';

    t.is(commentSwap().transform(class1, id), class1ok);
    t.is(commentSwap().transform(class2, id), class2ok);
    t.is(commentSwap().transform(class3bad, id), class3ok);
    t.is(commentSwap().transform(class3good, id), class3ok);

    const misc1    = '/* x-prod =*/\f\r\t\na#b.c[d="e"]\n\t\r\f{ color:red }';
    const misc2    = '\f\r\t\na#b.c[d="e"]\n\t\r\f/*= x-prod */{ color:red }';
    const misc3    = '\f\r\t\n/*?*/a#b.c[d="e"]:hover/*=x-prod*/\n\t\r\f{ color:red }';
    const miscok   = '\f\r\t\nx-prod\n\t\r\f{ color:red }';

    t.is(commentSwap().transform(misc1, id), miscok);
    t.is(commentSwap().transform(misc2, id), miscok);
    t.is(commentSwap().transform(misc3, id), miscok);

    const pseudo1    = '/* b, x-prod =*/a, x-dev:hover { color:red }';
    const pseudo1ok  = 'b, x-prod:hover { color:red }';
    const pseudo2    = '  input:\fhover >div\t\t/*= focus*/{ color:red }';
    const pseudo2ok  = '  input:\ffocus\t\t{ color:red }';
    const pseudo3    = 'input/*?*/:hover/*=.focusable:focus\f\r*/{ color:red }';
    const pseudo3ok  = 'input.focusable:focus\f\r{ color:red }';

    t.is(commentSwap().transform(pseudo1, id), pseudo1ok);
    t.is(commentSwap().transform(pseudo2, id), pseudo2ok);
    t.is(commentSwap().transform(pseudo3, id), pseudo3ok);
});

test('quickCss() ok: CSS Properties', t => {
    const property1     = 'h1 { /* color =*/\f\nbackground-color \t\ :red }';
    const property1ok   = 'h1 { \f\ncolor \t\ :red }';
    const property2     = 'h1 {\r\tbackground-color\f\n/*=outline-color*/ :red }';
    const property2ok   = 'h1 {\r\toutline-color\f\n :red }';
    const property3bad  = 'h1 {/*?*/background/*=\toutline*/-color:red }'; // browsers do not display this 
    const property3good = 'h1 {/*?*/background-color/*=\toutline-color*/:red }'; // this is the proper syntax
    const property3ok   = 'h1 {\toutline-color:red }';

    t.is(commentSwap().transform(property1, id), property1ok);
    t.is(commentSwap().transform(property2, id), property2ok);
    t.is(commentSwap().transform(property3bad, id), property3ok);
    t.is(commentSwap().transform(property3good, id), property3ok);
});

test('quickCss() ok: CSS Values', t => {
    const value1     = 'h1 { color:/* red =*/\fblue; top:0 }';
    const value1ok   = 'h1 { color:\fred; top:0 }';
    const value2     = 'h1 { color:rgb(1,2,3)/*= red */ }';
    const value2ok   = 'h1 { color:red }';
    const value3bad  = 'h1 { color:pale/*?*/green/*=goldenrod*/ }'; // browsers do not display this
    const value3good = 'h1 { color:/*?*/palegreen/*=palegoldenrod*/ }'; // this is the proper syntax
    const value3ok   = 'h1 { color:palegoldenrod }';

    t.is(commentSwap().transform(value1, id), value1ok);
    t.is(commentSwap().transform(value2, id), value2ok);
    t.is(commentSwap().transform(value3bad, id), value3ok);
    t.is(commentSwap().transform(value3good, id), value3ok);
});

test('quickCss() ok: @import', t => {
    const import1opts = { $:{ urlAndMedia:'url("prod.css") print, screen' } };
    const import1     = '@import/* urlAndMedia $*/ url("dev.css") print;';
    const import2opts = { $:{ importUrl:'@import url("prod.css")' } };
    const import2     = '@import url("dev.css") /*$ importUrl */print, screen;';
    const import3opts = { $:{ isDev:false, url:'url("prod.css")' } };
    const import3     = '@import /* isDev ?*/url("dev.css")/*$ url */ print, screen;';
    const importOk    = '@import url("prod.css") print, screen;';

    t.is(commentSwap(import1opts).transform(import1, id), importOk);
    t.is(commentSwap(import2opts).transform(import2, id), importOk);
    t.is(commentSwap(import3opts).transform(import3, id), importOk);
});

test('quickCss() ok: @media', t => {
    const media1opts = { $:{ property:'min-width' } };
    const media1     = '@media screen and (/* property $*/min-height: 900px) { }';
    const media2opts = { $:{ value:'900px' } };
    const media2     = '@media screen and (min-width: 900px/*$ value */) { }';
    const media3opts = { $:{ pdfMode:false, media:'screen' } };
    const media3     = '@media /*pdfMode?*/print/*$media*/ and (min-width: 900px/*$ value */) { }';
    const mediaOk    = '@media screen and (min-width: 900px) { }';

    t.is(commentSwap(media1opts).transform(media1, id), mediaOk);
    t.is(commentSwap(media2opts).transform(media2, id), mediaOk);
    t.is(commentSwap(media3opts).transform(media3, id), mediaOk);
});

test('quickCss() ok: remove comments', t => {
    const comments   = 'h1 { color:green /*?*//* green means go *//*=*/}';
    const commentsOk = 'h1 { color:green }';
    t.is(commentSwap().transform(comments, id), commentsOk);
});
