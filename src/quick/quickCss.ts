import CommentSwapKind from '../types/CommentSwapKind';

class CommentSwap {
    commentBegin: Number;
    commentEnd: Number;
    kind: CommentSwapKind;

    constructor(
        commentBegin: Number,
        commentEnd: Number,
        kind: CommentSwapKind,
    ) {
        this.commentBegin = commentBegin;
        this.commentEnd = commentEnd;
        this.kind = kind;
    }

    toString() {
        return `${CommentSwapKind[this.kind]} ${this.commentBegin}-${this.commentEnd}`
    }
}

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
        let commentSwapKind = CommentSwapKind.Absent;
        switch (charAfterCommentBegin) {
            case '=':
                commentSwapKind = CommentSwapKind.LiteralBefore; break;
            case '$':
                commentSwapKind = CommentSwapKind.VariableBefore; break;
            case ':':
                commentSwapKind = CommentSwapKind.TernaryIfFalse; break;
        }
        switch (charBeforeCommentEnd) {
            case '=':
                if (commentSwapKind !== CommentSwapKind.Absent) throw Error(
                    `'${commentSwapKind}' Comment Swap ends '=' (pos ${commentBegin})`);
                commentSwapKind = CommentSwapKind.LiteralAfter; break;
            case '$':
                if (commentSwapKind !== CommentSwapKind.Absent) throw Error(
                    `'${commentSwapKind}' Comment Swap ends '$' (pos ${commentBegin})`);
                commentSwapKind = CommentSwapKind.VariableAfter; break;
            case '?':
                if (commentSwapKind !== CommentSwapKind.Absent) throw Error(
                    `'${commentSwapKind}' Comment Swap ends '?' (pos ${commentBegin})`);
                commentSwapKind = CommentSwapKind.TernaryCondition; break;
        }

        // Record the Comment Swap.
        commentSwaps.push(new CommentSwap(
            commentBegin,
            commentEnd,
            commentSwapKind,
        ));

    }

    // console.log(commentSwaps+'')

    return `${code}\n\n// @TODO quickCss`;
}
