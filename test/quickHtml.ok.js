const test = require('ava');
const commentSwap = require('../dist/cjs');

test('quickHtml() ok', t => {
    const boringCode = 'abc';
    const funCode = 'abc $-->';
    const idLongExt = 'some/path/page.HtMl';
    const idShortExt = 'some/path/page.htm';
    const expected = 'abc $-->\n\n// @TODO quickHtml';

    t.is(commentSwap().transform(boringCode, idLongExt), null);
    t.is(commentSwap().transform(funCode, idLongExt), expected);
    t.is(commentSwap().transform(funCode, idShortExt), expected);
});
