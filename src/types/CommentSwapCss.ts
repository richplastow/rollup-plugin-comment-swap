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
            // Throw an exception if one of these Comment Swaps begins the code.
            case CSKind.LiteralBefore:
            case CSKind.VariableBefore:
            case CSKind.TernaryIfFalse:
                if (commentBegin === 0)
                    throw Error(`A '${CSKind[kind]}' Comment Swap is at pos 0`);
        }

        switch (kind) {
            case CSKind.LiteralBefore:
            case CSKind.VariableBefore:
            case CSKind.TernaryIfFalse:
                // Start at the character position before the beginning comment.
                // We have established above that `commentBegin` is at least 1,
                // so `pos` must be at least 0.
                let pos = commentBegin - 1;

                // Step backwards through the code, character-by-character,
                // to find the start position of any whitespace which should be preserved.
                for (; pos>-1; pos--) {
                    const char = code[pos];
                    const charIsSpace = char === ' ' || char === '\t' || char === '\n';
                    if (! charIsSpace) { break; }
                }
                const preservedSpacePos = pos + 1;

                // Step backwards through the code, character-by-character, 
                // to find the start position of the identifier or literal to replace.
                for (; pos>-1; pos--) {
                    const char = code[pos];
                    const charIsSpace = char === ' ' || char === '\t' || char === '\n';
                    if (charIsSpace || char === ':') {
                        break;
                    }
                }
                this.swapBegin = pos + 1;

                if (this.swapBegin === preservedSpacePos)
                    throw Error(`A '${CSKind[kind]}' Comment Swap has no replacement`);

                this.replacement =
                    code.slice(commentBegin + 3, commentEnd - 2).trim() +
                    code.slice(preservedSpacePos, commentBegin)
                ;

                break;
        }

    }

    toString() {
        return `${CSKind[this.kind]} ${this.commentBegin}-${this.commentEnd}`
    }
}
