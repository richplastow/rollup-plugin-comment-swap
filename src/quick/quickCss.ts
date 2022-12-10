import type { RollupCommentSwapOptions } from '../../types';
import CommentSwapCss from '../types/CommentSwapCss';
import CSKind from '../types/CommentSwapKind';

export default function quickCss(
    opts: RollupCommentSwapOptions,
    code: string,
) {
    // Initialise `commentSwaps`, which will contain each CommentSwapCss instance.
    // Initialise `pos`, the current character position in `code`.
    // Get `len`, the number of characters in `code`.
    const commentSwaps: CommentSwapCss[] = [];
    let pos = 0;
    const len = code.length;

    // Traverse the source code. Fully parsing it into an AST is usually overkill,
    // and (I guess) would be slower.
    // Setting the `quick` option to `false` runs slow (but robust) AST processing. @TODO
    while (pos < len) {

        // Get the start position of the next multiline comment.
        const commentBegin = code.indexOf('/*', pos);
        if (commentBegin === -1) break; // no more multiline comments
        pos = commentBegin + 2; // jump to the character after '/*'

        // Get the end position of the next multiline comment.
        let commentEnd = code.indexOf('*/', pos);
        if (commentEnd === -1) break; // maybe a malformed multiline comment
        commentEnd += 2; // the position after the '/'
        pos = commentEnd; // jump to the character after '*/'

        // Treat /*=*/ as a LiteralBefore Comment Swap, with empty content.
        const charBeforeCommentEnd = code[commentEnd-3];
        const charAfterCommentBegin = code[commentBegin+2];
        if (commentEnd === commentBegin + 5 && charAfterCommentBegin === '=') {
            commentSwaps.push(new CommentSwapCss(
                commentBegin,
                commentEnd,
                CSKind.LiteralBefore,
            ));
            continue;
        }

        // Determine the kind of Comment Swap.
        let kind = CSKind.Absent;
        switch (charAfterCommentBegin) {
            case '=':
                kind = CSKind.LiteralBefore; break;
            case '$':
                kind = CSKind.VariableBefore; break;
        }
        switch (charBeforeCommentEnd) {
            case '=':
                if (kind !== CSKind.Absent) throw Error(
                    `'${CSKind[kind]}' Comment Swap ends '=' (pos ${commentBegin})`);
                kind = CSKind.LiteralAfter; break;
            case '$':
                if (kind !== CSKind.Absent) throw Error(
                    `'${CSKind[kind]}' Comment Swap ends '$' (pos ${commentBegin})`);
                kind = CSKind.VariableAfter; break;
            case '?':
                if (kind !== CSKind.Absent) throw Error(
                    `'${CSKind[kind]}' Comment Swap ends '?' (pos ${commentBegin})`);
                kind = CSKind.TernaryCondition; break;
        }

        // Record the Comment Swap.
        if (kind !== CSKind.Absent) {
            commentSwaps.push(new CommentSwapCss(
                commentBegin,
                commentEnd,
                kind,
            ));
        }

    }

    // If there are no valid Comment Swaps, return the source code untransformed.
    if (commentSwaps.length === 0)
        return code;

    // Process each Comment Swap. This will populate the `replacement`, `swapBegin`
    // and `swapEnd` properties.
    for (let i=0, len=commentSwaps.length; i<len; i++) {
        const prevKind = i === 0 ? CSKind.Absent : commentSwaps[i-1].kind;
        const nextCommentSwap = i === len - 1 ? null : commentSwaps[i+1];
        commentSwaps[i].process(opts, code, prevKind, nextCommentSwap);
    }

    // Initialise an array, which will be output as a string.
    const transformedCode = [
        code.slice(0, commentSwaps[0].swapBegin), // before the first Comment Swap
    ];

    // Rebuild the source code using each Comment Swap's replacement value.
    for (let i=0, len=commentSwaps.length; i<len; i++) {

        // Append this Comment Swap's replacement code.
        transformedCode.push(commentSwaps[i].replacement);

        // Append the code between this Comment Swap and the next one. Or if this
        // is the last Comment Swap, just append the remaining code.
        transformedCode.push(
            code.slice(commentSwaps[i].swapEnd, commentSwaps[i+1]?.swapBegin)
        );

    }

    // console.log(commentSwaps+'')
    // console.log(transformedCode.join(''));

    return transformedCode.join('');
}
