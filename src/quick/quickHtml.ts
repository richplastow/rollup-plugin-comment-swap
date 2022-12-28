import type { RollupCommentSwapOptions } from '../../types';
import Filetype from '../types/Filetype';
import quick from './quick';

export default function quickHtml(
    opts: RollupCommentSwapOptions,
    code: string,
) {
    return quick(opts, code, Filetype.Html);
}
