import CommentSwap from '../types/CommentSwap';
import CommentSwapKind from '../types/CommentSwapKind';

export default function quickCss(code: String) {
    // Initialise `commentSwaps`, which will contain each CommentSwap instance.
    // Initialise `pos`, the current character position in `code`.
    // Get `len`, the number of characters in `code`.
    const commentSwaps: CommentSwap[] = [];
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

        // Determine the kind of Comment Swap.
        const charBeforeCommentEnd = code[commentEnd-3];
        const charAfterCommentBegin = code[commentBegin+2];
        let kind = CommentSwapKind.Absent;
        switch (charAfterCommentBegin) {
            case '=':
                kind = CommentSwapKind.LiteralBefore; break;
            case '$':
                kind = CommentSwapKind.VariableBefore; break;
            case ':':
                kind = CommentSwapKind.TernaryIfFalse; break;
        }
        switch (charBeforeCommentEnd) {
            case '=':
                if (kind !== CommentSwapKind.Absent) throw Error(
                    `'${kind}' Comment Swap ends '=' (pos ${commentBegin})`);
                kind = CommentSwapKind.LiteralAfter; break;
            case '$':
                if (kind !== CommentSwapKind.Absent) throw Error(
                    `'${kind}' Comment Swap ends '$' (pos ${commentBegin})`);
                kind = CommentSwapKind.VariableAfter; break;
            case '?':
                if (kind !== CommentSwapKind.Absent) throw Error(
                    `'${kind}' Comment Swap ends '?' (pos ${commentBegin})`);
                kind = CommentSwapKind.TernaryCondition; break;
        }

        // Record the Comment Swap.
        commentSwaps.push(new CommentSwap(
            commentBegin,
            commentEnd,
            kind,
        ));

    }

    // console.log(commentSwaps+'')

    return `${code}\n\n// @TODO quickCss`;
}
