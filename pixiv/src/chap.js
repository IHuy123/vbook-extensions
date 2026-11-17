load("config.js");

// Danh sách trang của một ảnh minh họa; mỗi ID chỉ gọi API một lần trong một chương.
var pagesMemo = {};
function illustPages(id) {
    if (pagesMemo[id] === undefined) pagesMemo[id] = api("/ajax/illust/" + id + "/pages?lang=zh") || null;
    return pagesMemo[id];
}

// Lấy link ảnh của [pixivimage:ID] hoặc [pixivimage:ID-trang].
// Trang 1: dùng dữ liệu ảnh đã kèm trong truyện (không tốn request); trang khác: gọi API trang ảnh.
function pixivImage(id, page, novel) {
    var idx = page ? parseInt(page) - 1 : 0;
    var pk = null;
    if (idx === 0) {
        var il = novel.illusts && novel.illusts[id] && novel.illusts[id].illust;
        if (il && il.images) pk = pickImage(il.images, "pixiv");
    }
    if (!pk) {
        var p = illustPages(id);
        if (p && p[idx] && p[idx].urls) pk = pickImage(p[idx].urls, "pixiv");
    }
    return pk ? imgUrl(pk.url) : "";
}

function format(t, novel) {
    var imgs = [];
    var count = 0; // tổng số ảnh trong chương (kể cả ảnh không lấy được link)
    // Mỗi ảnh được đánh dấu bằng tag tiếng Trung 【插图N】; có link thì hiện ảnh ngay dưới tag.
    function hold(url) {
        count++;
        var tag = "\n【插图" + count + "】\n";
        if (!url) return tag;
        imgs.push(url);
        return tag + "@@IMG" + (imgs.length - 1) + "@@\n";
    }

    t = (t || "")
        .replace(/\[\[rb:\s*([^>\]]*?)\s*>\s*[^\]]*?\]\]/g, "$1")
        .replace(/\[\[jumpuri:\s*([^>\]]*?)\s*>\s*[^\]]*?\]\]/g, "$1")
        .replace(/\[chapter:\s*([^\]]*)\]/g, "\n$1\n")
        .replace(/\[newpage\]/g, "\n\n")
        .replace(/\[uploadedimage:(\d+)\]/g, function (_, id) {
            var e = novel.textEmbeddedImages && novel.textEmbeddedImages[id];
            var pk = e && e.urls ? pickImage(e.urls, "upload") : null;
            return hold(pk ? imgUrl(pk.url) : "");
        })
        .replace(/\[pixivimage:(\d+)(?:-(\d+))?\]/g, function (_, id, page) {
            return hold(pixivImage(id, page, novel));
        })
        .replace(/\[jump:[^\]]*\]/g, "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    t = t.replace(/\r?\n/g, "<br>");
    t = t.replace(/@@IMG(\d+)@@/g, function (_, i) {
        return '<img src="' + imgs[parseInt(i)] + '">';
    });
    // Chương có ảnh: thêm dòng báo ở đầu
    if (count > 0) t = "【本章含插图 " + count + " 张】<br><br>" + t;
    return t;
}

function execute(url) {
    var m = url.match(/id=(\d+)/) || url.match(/novel\/(\d+)/);
    if (!m) return Response.error("URL không hợp lệ");
    var n = api("/ajax/novel/" + m[1] + "?lang=zh");
    if (!n || !n.content) return Response.error("Không tải được chương (có thể cần đăng nhập, xem COOKIE trong config.js)");
    return Response.success(format(n.content, n));
}
