import type { RollupCommentSwapOptions } from '../../types';
import Filetype from '../types/Filetype';

import quickCss from './quickCss';
import quickHtml from './quickHtml';
import quickJs from './quickJs';

export default function quick(
    opts: RollupCommentSwapOptions,
    code: string,
    filetype: Filetype,
) {
    switch (filetype) {
        case Filetype.Css:
            return quickCss(opts, code);
        case Filetype.Html:
            return quickHtml(opts, code);
        case Filetype.Js:
            return quickJs(opts, code);
        default:
            throw Error(`no such filetype Filetype.'${filetype}'`);
    }
}
