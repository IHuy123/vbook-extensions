load("config.js");

function tagList(tags) {
    var arr = [];
    if (tags && tags.tags) tags = tags.tags;
    (tags || []).forEach(function (t) {
        var name = typeof t === "string" ? t : (t.tag || "");
        if (name) arr.push({ title: name, input: name, script: "homer18.js" });
    });
    return arr;
}

// Dòng báo ảnh ở trang chi tiết: chỉ chữ thường, không tag/liên kết. Không có ảnh thì để trống.
function imageLine(count, prefix) {
    return count > 0 ? "<br>【" + prefix + "含插图 " + count + " 张】" : "";
}

// Series: quét IMG_SCAN_MAX chương ĐẦU để đếm ảnh.
function seriesImageLine(seriesId) {
    if (IMG_SCAN_MAX <= 0) return "";
    var t = api("/ajax/novel/series/" + seriesId + "/content_titles");
    var ids = [];
    (t && t.length ? t : []).forEach(function (c) {
        if (c && c.id && c.available !== false) ids.push(c.id);
    });
    var scan = Math.min(ids.length, IMG_SCAN_MAX), total = 0;
    var picked = ids.slice(0, scan);
    for (var i = 0; i < picked.length; i++) {
        var n = api("/ajax/novel/" + picked[i] + "?lang=zh");
        if (n) total += countImages(n.content);
    }
    console.log("quét ảnh series " + seriesId + ": " + scan + "/" + ids.length + " chương, " + total + " ảnh");
    return imageLine(total, ids.length > scan ? "前" + scan + "章" : "");
}

// Nguồn "Truyện liên quan" và "Bình luận" trong trang chi tiết (input = ID truyện)
function relatedSource(novelId, title) {
    return novelId ? [{ title: title, input: String(novelId), script: "similar.js" }] : [];
}
function commentSource(novelId, title) {
    return novelId ? [{ title: title, input: String(novelId), script: "comments.js" }] : [];
}

function execute(url) {
    // Link tác giả: hiện tác giả như một "bộ truyện", mục lục là các truyện của họ
    var u = url.match(/users\/(\d+)/);
    if (u) {
        var p = api("/ajax/user/" + u[1] + "?full=1&lang=zh");
        if (!p) return Response.error("Không tải được thông tin tác giả");
        var uids = userNovelIds(u[1]) || [];
        var uFollowed = boolOrNull(p.isFollowed);
        return Response.success({
            name: p.name,
            cover: imgUrl(p.imageBig || p.image || ""),
            host: BASE_URL,
            author: p.name,
            description: (p.comment || "").replace(/<br\s*\/?>/gi, "\n"),
            detail: authorLine(p.name, uFollowed) + "<br>Số truyện: " + uids.length,
            ongoing: true,
            // Danh sách truyện của tác giả (ảnh bìa, gộp theo series) hiện ngay trên trang này;
            // chip "Tác giả" mở cùng danh sách đó ở dạng kéo xuống tải thêm.
            genres: authorChip(u[1], p.name, uFollowed),
            suggests: [{ title: "Truyện của tác giả", input: u[1], script: "author.js" }]
        });
    }

    var s = url.match(/series\/(\d+)/);
    if (s) {
        var b = api("/ajax/novel/series/" + s[1] + "?lang=zh");
        if (!b) return Response.error("Không tải được thông tin series");
        var urls = (b.cover && b.cover.urls) || {};
        var imgLine = seriesImageLine(s[1]);
        var sFollowed = userFollowed(b.userId);
        return Response.success({
            name: b.title,
            cover: urls["480mw"] || urls["240mw"] || urls.original || "",
            host: BASE_URL,
            author: b.userName,
            description: (b.caption || "").replace(/<br\s*\/?>/gi, "\n"),
            detail: authorLine(b.userName, sFollowed) + "<br>Số chương: " + (b.publishedContentCount || b.total || "?") + imgLine,
            ongoing: !b.isConcluded,
            genres: authorChip(b.userId, b.userName, sFollowed).concat(tagList(b.tags)),
            // Bình luận và truyện liên quan lấy theo chương đầu của series
            suggests: relatedSource(b.firstNovelId, "Truyện liên quan"),
            comments: commentSource(b.firstNovelId, "Bình luận (chương đầu)")
        });
    }

    var m = url.match(/id=(\d+)/) || url.match(/novel\/(\d+)/);
    if (!m) return Response.error("URL không hợp lệ");
    var n = api("/ajax/novel/" + m[1] + "?lang=zh");
    if (!n) return Response.error("Không tải được thông tin truyện");
    var nFollowed = userFollowed(n.userId);
    return Response.success({
        name: n.title,
        cover: n.coverUrl || "",
        host: BASE_URL,
        author: n.userName,
        description: (n.description || "").replace(/<br\s*\/?>/gi, "\n"),
        detail: authorLine(n.userName, nFollowed) + "<br>Số chữ: " + (n.textCount || "?") + imageLine(countImages(n.content), ""),
        ongoing: false,
        genres: authorChip(n.userId, n.userName, nFollowed).concat(tagList(n.tags)),
        suggests: relatedSource(m[1], "Truyện liên quan"),
        comments: commentSource(m[1], "Bình luận")
    });
}
