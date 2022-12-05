import CommentSwapCss from '../types/CommentSwapCss';
import CSKind from '../types/CommentSwapKind';

export default function quickCss(code: string) {
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
        commentSwaps.push(new CommentSwapCss(
            commentBegin,
            commentEnd,
            kind,
            code,
        ));

    }

    // If there are no valid Comment Swaps, return the source code untransformed.
    if (commentSwaps.length === 0)
        return code;

    // Initialise an array, which will be output as a string.
    const transformedCode = [
        code.slice(0, commentSwaps[0].swapBegin), // before the first Comment Swap
    ];

    // Rebuild the source code with either the truthy or falsey code from each
    // Comment Swap.
    for (let i=0, len=commentSwaps.length; i<len; i++) {
        const commentSwap = commentSwaps[i];

        switch (commentSwap.kind) {
            case CSKind.LiteralBefore:
                transformedCode.push(commentSwap.replacement);
                break;
        }

        if (i !== commentSwaps.length-1) {
            // Append the code between this Comment Swap and the next one.
            transformedCode.push(
                code.slice(commentSwaps[i].swapEnd, commentSwaps[i+1].swapBegin)
            );
        } else {
            // Append the remaining code after the last Comment Swap.
            transformedCode.push(
                code.slice(commentSwaps[i].swapEnd)
            );
        }

/*
        const condition = commentPair.condition.source;
        const isTruthy = options[condition];
        console.log(condition, 'is', isTruthy?'truthy':'falsey', commentPair);
        transformedCode.push(
            isTruthy
            ? commentPair.truthy.source
            : commentPair.falsey.source
        );
        transformedCode.push(
            source.slice(
                commentPair.falsey.end,
                i === len-1 ? source.length : commentSwaps[i+1].condition.begin
            )
        );
*/
    }

    console.log(commentSwaps+'')
    console.log(transformedCode.join(''));

    return transformedCode.join('');
}
