import type { RollupCommentSwapOptions } from '../../types';
import CSKind from './CommentSwapKind';

export default class CommentSwapCss {
    replacement: string;
    swapBegin: number;
    swapEnd: number;

    constructor(
        readonly commentBegin: number,
        readonly commentEnd: number,
        readonly kind: CSKind,
    ) {}

    process(
        opts: RollupCommentSwapOptions,
        code: string,
        prevKind: CSKind,
        nextCommentSwap: CommentSwapCss | null,
    ) {
        this.swapBegin = this.commentBegin;
        this.swapEnd = this.commentEnd;

        // If the previous Comment Swap was a Ternary Condition, then this should
        // be either a Literal Before or a Variable Before Comment Swap. The 
        // Ternary Condition will have already read the replacement code inside
        // this Comment Swap (if the condition is false), so we actually don’t
        // want this Comment Swap to contribute anything to the processed code.
        if (prevKind === CSKind.TernaryCondition) {
            this.replacement = '';
            return;            
        }

        switch (this.kind) {
            case CSKind.LiteralAfter:
            case CSKind.VariableAfter:
                [ this.replacement, this.swapEnd ] =
                    prepareReplacementAfter(
                        this.commentBegin,
                        this.commentEnd,
                        this.kind,
                        code
                    );
                break;

            case CSKind.LiteralBefore:
            case CSKind.VariableBefore:
                [ this.replacement, this.swapBegin ] =
                    prepareReplacementBefore(
                        this.commentBegin,
                        this.commentEnd,
                        this.kind,
                        code
                    );
                break;

            case CSKind.TernaryCondition:
                [ this.replacement, this.swapEnd ] =
                    prepareReplacementTernary(
                        opts,
                        this.commentBegin,
                        this.commentEnd,
                        code,
                        nextCommentSwap,
                    );
                break;
        }
    }

    toString() {
        return `${CSKind[this.kind]} ${this.commentBegin}-${this.commentEnd}`
    }
}

function prepareReplacementAfter(
    commentBegin: number,
    commentEnd: number,
    kind: CSKind,
    code: string,
): [ string, number ] {
    const len = code.length;

    // Throw an exception if this Comment Swap ends the code.
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

function prepareReplacementBefore(
    commentBegin: number,
    commentEnd: number,
    kind: CSKind,
    code: string,
): [ string, number ] {
    // Throw an exception if this Comment Swap begins the code.
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

function prepareReplacementTernary(
    opts: RollupCommentSwapOptions,
    commentBegin: number,
    commentEnd: number,
    code: string,
    nextCS: CommentSwapCss | null,
): [ string, number ] {
    const len = code.length;

    // Throw an exception if this Ternary Condition ends the code, or is the
    // last Comment Swap. 
    if (commentEnd === len)
        throw Error(`A 'TernaryCondition' Comment Swap is at end of code`);
    if (nextCS === null)
        throw Error(`'TernaryCondition' at pos ${
            commentBegin} is the last Comment Swap in the code`);

    // Throw an exception if this Ternary Condition is not followed by either
    // a 'Literal Before' or a 'Variable Before' Comment Swap.
    if (nextCS.kind !== CSKind.LiteralBefore &&
        nextCS.kind !== CSKind.VariableBefore)
        throw Error(`'${CSKind[nextCS.kind]}' at pos ${
            nextCS.commentBegin} follows 'TernaryCondition' at pos ${
            commentBegin}`);

    // Get the condition from inside this Ternary Condition's comment.
    const condition = code.slice(commentBegin + 2, commentEnd - 3).trim();

    // Throw an exception if the condition is not parseable.
    if (condition !== '' && ! /^[$_a-z][$_a-z0-9]*$/i.test(condition))
        throw Error(`'TernaryCondition' at pos ${
            commentBegin} fails /^[$_a-z][$_a-z0-9]*$/i`);

    // Resolve the condition against the `$` object, from the plugin options.
    const conditionIsTrue = opts.$?.[condition];

    return [
        conditionIsTrue
            // If true, `replacement` is the code between the end of this
            // Ternary Condition and the start of the next Comment Swap.
            ? code.slice(commentEnd, nextCS.commentBegin)

            // If false, `replacement` is the code inside the next Comment Swap.
            // It's not trimmed - whitespace is preserved as-is.
            : code.slice(nextCS.commentBegin + 3, nextCS.commentEnd - 2),

        // `swapEnd` is the position at the end of the next Comment Swap.
        nextCS.commentEnd,
    ];
}
