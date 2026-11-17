load("config.js");
// Bình luận của một truyện, kéo xuống tải thêm. input: ID truyện.
// Mỗi trang lấy thêm trả lời cho tối đa MAX_REPLY_FETCH bình luận có trả lời (mỗi cái = 1 request).
var MAX_REPLY_FETCH = 10;

function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>");
}

function commentItem(c) {
    var text = c.comment ? esc(c.comment) : (c.stampId ? "[Sticker]" : "");
    return {
        name: c.userName || "",
        avatar: imgUrl(c.img || ""),
        content: text,
        description: c.commentDate || "",
        replies: []
    };
}

function execute(input, page) {
    var m = String(input || "").match(/\d+/);
    if (!m) return Response.error("Thiếu ID truyện");
    var id = m[0];
    var offset = page ? parseInt(page) : 0;
    var limit = 30;

    var body = api("/ajax/novels/comments/roots?novel_id=" + id + "&offset=" + offset + "&limit=" + limit + "&lang=zh");
    if (!body) body = api("/ajax/novel/" + id + "/comments/roots?offset=" + offset + "&limit=" + limit + "&lang=zh");
    if (!body) return Response.error("Không tải được bình luận");

    var list = body.comments || [];
    var fetched = 0;
    var items = list.map(function (c) {
        var it = commentItem(c);
        if (c.hasReplies && fetched < MAX_REPLY_FETCH) {
            fetched++;
            var r = api("/ajax/novels/comments/replies?comment_id=" + c.id + "&page=1&lang=zh");
            if (r && r.comments) it.replies = r.comments.map(commentItem);
        }
        return it;
    });
    console.log("bình luận truyện " + id + ": " + items.length + " mục, tải trả lời " + fetched + " lần");
    return Response.success(items, body.hasNext && list.length > 0 ? String(offset + list.length) : "");
}
