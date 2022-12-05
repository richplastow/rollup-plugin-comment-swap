import CommentSwapKind from './CommentSwapKind';

export default class CommentSwap {
    constructor(
        readonly commentBegin: Number,
        readonly commentEnd: Number,
        readonly kind: CommentSwapKind,
    ) { }

    toString() {
        return `${CommentSwapKind[this.kind]} ${this.commentBegin}-${this.commentEnd}`
    }
}
