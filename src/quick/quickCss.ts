import CommentSwap from '../types/CommentSwap';
import CSKind from '../types/CommentSwapKind';

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
        let kind = CSKind.Absent;
        switch (charAfterCommentBegin) {
            case '=':
                kind = CSKind.LiteralBefore; break;
            case '$':
                kind = CSKind.VariableBefore; break;
            case ':':
                kind = CSKind.TernaryIfFalse; break;
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
        commentSwaps.push(new CommentSwap(
            commentBegin,
            commentEnd,
            kind,
        ));

    }

    // console.log(commentSwaps+'')

    return `${code}\n\n// @TODO quickCss`;
}
