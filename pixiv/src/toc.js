load("config.js");

// Bỏ tiền tố "#1 ", "#2 "... ở đầu tên chương
function clean(t) {
    t = String(t || "");
    var c = t.replace(/^\s*[#\uFF03]\s*\d+(?:\.\d+)?\s*[:\uFF1A.\-]?\s*/, "").trim();
    return c || t.trim();
}

function makeItem(id, title, idx) {
    var name = clean(title);
    return { name: name || ("Chương " + idx), url: novelLink(id), host: BASE_URL };
}

function execute(url) {
    // Link tác giả: mục lục = các truyện của tác giả (mới nhất trước, tối đa TOC_USER_MAX)
    var u = url.match(/users\/(\d+)/);
    if (u) {
        var ids = userNovelIds(u[1]);
        if (!ids) return Response.error("Không tải được danh sách truyện của tác giả");
        ids = ids.slice(0, TOC_USER_MAX);
        var all = [];
        for (var i = 0; i < ids.length; i += 50) {
            userNovels(u[1], ids.slice(i, i + 50)).forEach(function (n) {
                all.push(makeItem(n.id, n.title, all.length + 1));
            });
        }
        if (!all.length) return Response.error("Tác giả chưa có truyện nào xem được");
        return Response.success(all);
    }

    var s = url.match(/series\/(\d+)/);
    if (!s) {
        var m = url.match(/id=(\d+)/) || url.match(/novel\/(\d+)/);
        if (!m) return Response.error("URL không hợp lệ");
        var n = api("/ajax/novel/" + m[1] + "?lang=zh");
        return Response.success([makeItem(m[1], n ? n.title : "", 1)]);
    }

    var list = [];

    // Cách 1: lấy toàn bộ tên chương trong một lần gọi
    var t = api("/ajax/novel/series/" + s[1] + "/content_titles");
    var arr = t && t.length ? t : [];
    console.log("content_titles: " + arr.length + " | mẫu: " + JSON.stringify(arr[0]));
    arr.forEach(function (c) {
        if (c.available === false) return;
        list.push(makeItem(c.id, c.title, list.length + 1));
    });
    if (list.length) return Response.success(list);

    // Cách 2 (dự phòng): lấy theo từng trang 30 chương
    var last = 0, guard = 0;
    while (guard++ < 100) {
        var b = api("/ajax/novel/series_content/" + s[1] + "?limit=30&last_order=" + last + "&order_by=asc&lang=zh");
        var items = b && b.page && b.page.seriesContents ? b.page.seriesContents : [];
        if (!items.length) {
            if (!list.length) console.log("series_content rỗng: " + JSON.stringify(b));
            break;
        }
        console.log("series_content mẫu: " + JSON.stringify(items[0]));
        items.forEach(function (c) {
            if (c.available === false) return;
            list.push(makeItem(c.id, c.title || c.name, list.length + 1));
        });
        last += items.length;
        if (items.length < 30) break;
    }
    if (!list.length) return Response.error("Không lấy được mục lục. Truyện R-18 cần đặt COOKIE trong config.js");
    return Response.success(list);
}
