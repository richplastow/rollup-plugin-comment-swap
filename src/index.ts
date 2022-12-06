import Filetype from './types/filetype';

import type { Plugin } from 'rollup';
import type { RollupCommentSwapOptions } from '../types';

import quick from './quick';
import slow from './slow';
import {
    codeContainsCssJsCommentSwap,
    codeContainsHtmlCommentSwap,
    pathToFiletype,
} from './utils';

export default function commentSwap(
    opts: RollupCommentSwapOptions = {},
): Plugin {
    opts = {
        quick: true,
        ...opts,
    };
  
    return {
        // `name` is used by Rollup for error messages and warnings.
        name: 'commentSwap',
    
        transform(
            code, // the source code of a given file, as a string
            id, // the path which imported the module, as a string, eg './foo.js'
        ) {
            const filetype = pathToFiletype(id);
      
            // pathToFiletype() will return `Other` if `id` is not an extension
            // we can transform. Returning `null` tells Rollup that this file does
            // not need to be transformed.
            if (filetype === Filetype.Other) return null;
      
            // Only process HTML files which contain at least one of these strings:
            //     <!--=   =-->   <!--$   $-->   ?-->
            // Only process CSS and JS which contain at least one of these strings:
            //     /*=   =*/   /*$   $*/   ?*/
            // At least one of these will be present if the file uses Comment Swaps.
            if (filetype === Filetype.Html) {
                if (! codeContainsHtmlCommentSwap(code)) return null;
            } else {
                if (! codeContainsCssJsCommentSwap(code)) return null;
            }
      
            return opts.quick ? quick(code, filetype) : slow(code);
        }  
    };
}
