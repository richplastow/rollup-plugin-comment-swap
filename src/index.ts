import type { Plugin, PluginContext } from 'rollup';

import type { RollupCommentSwapOptions } from '../types';

export default function commentSwap(opts: RollupCommentSwapOptions = {}): Plugin {
  let input: string;

  return {
    // `name` is used by Rollup for error messages and warnings.
    name: 'commentSwap',

    transform(
      source, // the string code of a given file
      id, // the string path that was used to import the module, eg './utilities.js'
    ) {
      return source + '\n\n// ok!';
    }
  };
}
