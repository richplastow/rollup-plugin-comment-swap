import type { Plugin } from 'rollup';

export interface RollupCommentSwapOptions {
    quick?: Boolean
    $?: Object
}

/**
 * A powerful and flexible Rollup plugin for injecting values and code into
 * bundled files.
 * 
 * @param options See rollup-plugin-comment-swap/README.md#options
 */
export default function commentSwap(
    options?: RollupCommentSwapOptions
): Plugin;
