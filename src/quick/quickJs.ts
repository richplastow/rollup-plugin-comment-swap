import type { RollupCommentSwapOptions } from '../../types';
import Filetype from '../types/Filetype';
import quick from './quick';

export default function quickJs(
    opts: RollupCommentSwapOptions,
    code: string,
) {
    return quick(opts, code, Filetype.Js);
}
