import type { RollupCommentSwapOptions } from '../../types';
import CSKind from './CommentSwapKind';
import Filetype from './Filetype';

export default class CommentSwap {
    replacement: string;
    swapBegin: number;
    swapEnd: number;

    constructor(
        readonly commentBegin: number,
        readonly commentEnd: number,
        readonly filetype: Filetype,
        readonly kind: CSKind,
    ) {}

    process(
        opts: RollupCommentSwapOptions,
        code: string,
        prevKind: CSKind,
        nextCommentSwap: CommentSwap | null,
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
                        opts,
                        this.commentBegin,
                        this.commentEnd,
                        this.kind,
                        code,
                        this.filetype,
                    );
                break;

            case CSKind.LiteralBefore:
            case CSKind.VariableBefore:
                [ this.replacement, this.swapBegin ] =
                    prepareReplacementBefore(
                        opts,
                        this.commentBegin,
                        this.commentEnd,
                        this.kind,
                        code,
                        this.filetype,
                    );
                break;

            case CSKind.TernaryCondition:
                [ this.replacement, this.swapEnd ] =
                    prepareReplacementTernary(
                        opts,
                        this.commentBegin,
                        this.commentEnd,
                        code,
                        this.filetype,
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
    opts: RollupCommentSwapOptions,
    commentBegin: number,
    commentEnd: number,
    kind: CSKind.LiteralAfter | CSKind.VariableAfter,
    code: string,
    filetype: Filetype,
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
        if (! charIsWhitespace(code[pos])) { break; }
    }
    const preservedSpaceEnd = pos;

    // Step forwards through the code, character-by-character, to find the
    // position of a special 'break' character, which delimits the replacement.
    switch (filetype) {
        case Filetype.Css:
            for (; pos<len; pos++) {
                const c = code[pos];
                if (c === '{' || // eg /* h1 =*/ div { color:red } => h1 { color:red }
                    c === ':' || // eg h1 { /* color =*/background:red } => h1 { color:red }
                    c === ';' || // eg h1 { color:/* red =*/blue; top:0 } => h1 { color:red; top:0 }
                    c === '}'    // eg h1 { color:/* red =*/blue } => h1 { color:red }
                ) break;
            }
            break;
        case Filetype.Js:
            for (; pos<len; pos++) {
                const c = code[pos];
                if (c === '(' || // eg function/* foo =*/ bar() {} => foo() {}
                    c === '=' || // eg let /* foo =*/bar = "foo" => let foo = "foo"
                    c === ')'    // eg function fn(/* foo =*/bar) {} => fn(foo) {}
                ) break;
            }
            break;
        default:
            throw Error(`filetype '${Filetype[filetype]}' not supported`);
    }

    // Wind backwards, to preserve any whitespace directly before the break character.
    for (; pos>preservedSpaceEnd; pos--) {
        if (! charIsWhitespace(code[pos - 1])) { break; } // note the `- 1`
    }
    const swapEnd = pos;

    // Ensure there is something to replace.
    if (swapEnd === preservedSpaceEnd) throw Error(`A '${CSKind[kind]
        }' Comment Swap has nothing after it to replace`);

    // Get the content (literal or variable) from inside the comment.
    const content = getCommentContent(
        commentBegin + 2, commentEnd - 3, code, kind);

    // If this Comment Swap is a Variable, retrieve it from `opts.$`.
    // Otherwise use the content literally returned by getCommentContent().
    const value = kind === CSKind.VariableAfter
        ? opts.$?.[content]
        : content;

    // The replacement code is any preserved whitespace followed by the value.
    // In the edge case where the variable is missing from `opts.$`, keep the
    // original source code the way it was.
    const replacement = typeof value !== 'undefined'
        ? code.slice(commentEnd, preservedSpaceEnd) + value
        : code.slice(commentEnd, swapEnd);

    return [ replacement, swapEnd ];
}

function prepareReplacementBefore(
    opts: RollupCommentSwapOptions,
    commentBegin: number,
    commentEnd: number,
    kind: CSKind.LiteralBefore | CSKind.VariableBefore,
    code: string,
    filetype: Filetype,
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
    // position of a special 'break' character, which delimits the replacement.
    switch (filetype) {
        case Filetype.Css:
            for (; pos>-1; pos--) {
                const c = code[pos];
                if (c === '{' || // eg h1 { background/*= color */:red } => h1 { color:red }
                    c === ':' || // eg h1 { color:blue/*= red */ } => h1 { color:red }
                    c === ';' || // eg h1 { color:red; width/*= top */:0 } => h1 { color:red; top:0 }
                    c === '}'    // eg h1 { color:blue } div/*= h2 */ {} => h1 { color:red } h2 {}
                ) break;
            }
            break;
        case Filetype.Js:
            for (; pos>-1; pos--) {
                const c = code[pos];
                if (c === '(' || // eg function fn(bar/*= foo */) {} => fn(foo) {}
                    c === '=' || // eg let foo = "bar"/*= "foo" */ => let foo = "foo"
                    c === ')'    // eg @TODO add an example here
                ) break;
            }
            break;
        default:
            throw Error(`filetype '${Filetype[filetype]}' not supported`);
    }

    // Step forwards, to preserve any whitespace directly after the break character.
    for (; pos<preservedSpaceBegin; pos++) {
        const char = code[pos + 1]; // note the `+ 1`
        const charIsSpace = char === ' ' || char === '\t' || char === '\n';
        if (! charIsSpace) { break; }
    }
    const swapBegin = pos + 1;

    // Ensure there is something to replace.
    if (swapBegin === preservedSpaceBegin + 1) throw Error(`A '${CSKind[kind]
        }' Comment Swap has nothing before it to replace`);

    // Get the content (literal or variable) from inside the comment.
    const content = getCommentContent(
        commentBegin + 3, commentEnd - 2, code, kind);

    // If this Comment Swap is a Variable, retrieve it from `opts.$`.
    // Otherwise use the content literally returned by getCommentContent().
    const value = kind === CSKind.VariableBefore
        ? opts.$?.[content]
        : content;

    // The replacement code is the value followed by any preserved whitespace.
    // In the edge case where the variable is missing from `opts.$`, keep the
    // original source code the way it was.
    const replacement = typeof value !== 'undefined'
        ? value + code.slice(preservedSpaceBegin, commentBegin)
        : code.slice(swapBegin, commentBegin);

    return [ replacement, swapBegin ];
}

function prepareReplacementTernary(
    opts: RollupCommentSwapOptions,
    commentBegin: number,
    commentEnd: number,
    code: string,
    filetype: Filetype,
    nextCS: CommentSwap | null,
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

    // Get the content from inside this Ternary Condition comment.
    const condition = getCommentContent(
        commentBegin + 2, commentEnd - 3, code, CSKind.TernaryCondition);

    // Resolve the condition against the `$` object, from the plugin options.
    // If true, `replacement` is the code between the end of this Ternary Condition
    // and the start of the next Comment Swap.
    if (opts.$?.[condition]) {
        return [
            code.slice(commentEnd, nextCS.commentBegin),
            nextCS.commentEnd, // the position at the end of the next Comment Swap
        ]
    };

    // The condition is false, so get the content (literal or variable) from
    // inside the next Comment Swap.
    const content = getCommentContent(
        nextCS.commentBegin + 3,
        nextCS.commentEnd - 2,
        code,
        nextCS.kind,
        nextCS.kind === CSKind.LiteralBefore, // special case!
    );

    // If the condition is false and the next Comment Swap is a Variable,
    // retrieve it from `opts.$`.
    //
    // Otherwise use the content literally returned by getCommentContent().
    // In this special case, the Literal content has not been trimmed -
    // whitespace was preserved as-is.
    const value = nextCS.kind === CSKind.VariableBefore
        ? opts.$?.[content]
        : content;

    // The replacement code is usually just the value. In the edge case where the
    // variable is missing from `opts.$`, behave as if the condition was falsey.
    const replacement = typeof value !== 'undefined'
        ? value
        : code.slice(commentEnd, nextCS.commentBegin);

    return [ replacement, nextCS.commentEnd ];
}

function getCommentContent(
    sourceBegin: number,
    sourceEnd: number,
    code: string,
    kind: CSKind,
    preserveWhitespace: boolean = false,
) {
    // Get the content (Literal or Variable) from inside the comment.
    let content = code.slice(sourceBegin, sourceEnd);

    // Literal Comment Swap content can contain any characters.
    if (kind === CSKind.LiteralAfter ||
        kind === CSKind.LiteralBefore
    ) {
        // Leading and trailing whitespace should be removed, unless this
        // is a LiteralBefore following a TernaryCondition.
        if (preserveWhitespace)
            return content;
        else
            return content.trim();
    }

    // Not a Literal Comment Swap, so remove leading and trailing whitespace.
    content = content.trim();

    // Throw an exception if the content is not parseable.
    if (content !== '' && ! /^[$_a-z][$_a-z0-9]*$/i.test(content))
        throw Error(`'${CSKind[kind]}' content at pos ${
            sourceBegin} fails /^[$_a-z][$_a-z0-9]*$/i`);

    return content;
}

// Returns `true` if `char` is a W3C-defined whitespace character.
// From www.w3.org/TR/2003/WD-CSS21-20030915/syndata.html 4.1.1:
//     Only the characters "space" (Unicode code 32), "tab" (9), "line feed" (10),
//     "carriage return" (13), and "form feed" (12) can occur in whitespace."
function charIsWhitespace(
    char: string,
) {
    // Short circuit for the usual case where `char` is not whitespace.
    // eg the ASCII character '!' is greater than ' '.
    if (char > ' ') return false;

    // Test `char`. Start with "space" (the most commonly found), and end with
    // "form feed" (the least commonly found).
    return char===' ' || char==='\n' || char==='\t' || char==='\r' || char==='\f';
}
