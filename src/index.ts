import Filetype from './types/filetype';

import type { Plugin } from 'rollup';
import type { RollupCommentSwapOptions } from '../types';

import quick from './quick';
import slow from './slow';

export default function commentSwap(opts: RollupCommentSwapOptions = {}): Plugin {
  opts = {
    quick: true,
    ...opts,
  };

  return {
    // `name` is used by Rollup for error messages and warnings.
    name: 'commentSwap',

    transform(
      code, // the source code of a given file, as a string
      _id, // the path that was used to import the module, as a string, eg './utilities.js'
    ) {
      const filetype = Filetype.Css;

      return opts.quick ? quick(code, filetype) : slow(code);
    }
  };
}
