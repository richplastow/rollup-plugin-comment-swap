import CSKind from './CommentSwapKind';

export default class CommentSwapCss {
    replacement: string;
    swapBegin: number;
    swapEnd: number;

    constructor(
        readonly commentBegin: number,
        readonly commentEnd: number,
        readonly kind: CSKind,
        code: string,
    ) {
        this.swapBegin = commentBegin;
        this.swapEnd = commentEnd;

        switch (kind) {
            case CSKind.LiteralAfter:
            case CSKind.VariableAfter:
            case CSKind.TernaryCondition:
                [ this.replacement, this.swapEnd ] =
                    prepareReplacementAfter(commentBegin, commentEnd, kind, code);
                break;

            case CSKind.LiteralBefore:
            case CSKind.VariableBefore:
                [ this.replacement, this.swapBegin ] =
                    prepareReplacementBefore(commentBegin, commentEnd, kind, code);
                break;

            // case CSKind.TernaryCondition:
            //     [ this.replacement, this.swapEnd ] =
            //         prepareReplacementTernary(commentBegin, commentEnd, kind, code);
            //     break;
        }

    }

    toString() {
        return `${CSKind[this.kind]} ${this.commentBegin}-${this.commentEnd}`
    }
}

function prepareReplacementBefore(
    commentBegin: number,
    commentEnd: number,
    kind: CSKind,
    code: string,
): [ string, number ] {
    // Throw an exception if this Comment Swaps begins the code.
    if (commentBegin === 0)
        throw Error(`A '${CSKind[kind]}' Comment Swap is at pos 0`);

    // Start at the character position before the beginning of the Comment Swap.
    // We have established above that `commentBegin` is at least 1,  so `pos`
    // must be at least 0.
    let pos = commentBegin - 1;

    // Step backwards through the code, character-by-character, to find the
    // start position of any whitespace which should be preserved.
    for (; pos>-1; pos--) {
        const char = code[pos];
        const charIsSpace = char === ' ' || char === '\t' || char === '\n';
        if (! charIsSpace) { break; }
    }
    const preservedSpaceBegin = pos + 1;

    // Step backwards through the code, character-by-character, to find the
    // start position of the identifier or literal to replace.
    for (; pos>-1; pos--) {
        const char = code[pos];
        const charIsSpace = char === ' ' || char === '\t' || char === '\n';
        if (charIsSpace || char === ':') {
            break;
        }
    }
    const swapBegin = pos + 1;

    // Ensure there is something to replace.
    if (swapBegin === preservedSpaceBegin)
        throw Error(`A '${CSKind[kind]}' Comment Swap has nothing before it to replace`);

    // Get the replacement code from inside the comment.
    const replacement =
        code.slice(commentBegin + 3, commentEnd - 2).trim() +
        code.slice(preservedSpaceBegin, commentBegin)
    ;

    return [ replacement, swapBegin ];
}

function prepareReplacementAfter(
    commentBegin: number,
    commentEnd: number,
    kind: CSKind,
    code: string,
): [ string, number ] {
    const len = code.length;

    // Throw an exception if this Comment Swaps ends the code.
    if (commentEnd === len)
        throw Error(`A '${CSKind[kind]}' Comment Swap is at end of code`);

    // Start at the character position after the end of the Comment Swap.
    // We have established above that `commentEnd` is not at the very end of
    // the code, so there must be at least one character after it.
    let pos = commentEnd;

    // Step forwards through the code, character-by-character, to find the end
    // position of any whitespace which should be preserved.
    for (; pos<len; pos++) {
        const char = code[pos];
        const charIsSpace = char === ' ' || char === '\t' || char === '\n';
        if (! charIsSpace) { break; }
    }
    const preservedSpaceEnd = pos;

    // Step forwards through the code, character-by-character, to find the end
    // position of the identifier or literal to replace.
    for (; pos<len; pos++) {
        const char = code[pos];
        const charIsSpace = char === ' ' || char === '\t' || char === '\n';
        if (charIsSpace || char === ':' || char === ';') {
            break;
        }
    }
    const swapEnd = pos;

    // Ensure there is something to replace.
    if (swapEnd === preservedSpaceEnd)
        throw Error(`A '${CSKind[kind]}' Comment Swap has nothing after it to replace`);

    // Get the replacement code from inside the comment.
    const replacement =
        code.slice(commentEnd, preservedSpaceEnd) +
        code.slice(commentBegin + 2, commentEnd - 3).trim()
    ;

    return [ replacement, swapEnd ];
}
