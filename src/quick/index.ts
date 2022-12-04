import Filetype from '../types/Filetype';

import quickCss from './quickCss';
import quickHtml from './quickHtml';
import quickJs from './quickJs';

export default function quick(
    code: String,
    filetype: Filetype,
) {
    switch (filetype) {
        case Filetype.Css:
            return quickCss(code);
        case Filetype.Html:
            return quickHtml(code);
        case Filetype.Js:
            return quickJs(code);
        default:
            throw Error(`no such filetype Filetype.'${filetype}'`);
    }
}
