var BASE_URL = "https://www.pixiv.net";
// Để trống: app tự gửi cookie đã lưu ở Cài đặt extension > Cookie. Chỉ điền nếu muốn ép cookie riêng.
var COOKIE = "";
// Proxy ảnh (theo tiện ích tham khảo). Đặt "" nếu muốn dùng thẳng i.pximg.net
var IMG_PROXY = "https://i0.wp.com/pximg.perennialte.ch";

function headers() {
    var h = {
        "Referer": BASE_URL + "/",
        "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"
    };
    if (COOKIE) h["Cookie"] = COOKIE;
    return h;
}

function api(path) {
    var r = fetch(BASE_URL + path, { headers: headers() });
    if (!r.ok) {
        console.log("HTTP " + r.status + " " + path);
        return null;
    }
    var j = r.json();
    if (!j || j.error) {
        console.log("API lỗi " + path + ": " + (j ? j.message : "rỗng"));
        return null;
    }
    return j.body;
}

function novelLink(id) {
    return BASE_URL + "/novel/show.php?id=" + id;
}

// Chuyển danh sách novel của Pixiv sang định dạng vBook (gộp truyện cùng series)
function toList(data) {
    var out = [], seen = {};
    (data || []).forEach(function (n) {
        if (!n || !n.id) return;
        var isSeries = !!n.seriesId;
        var key = isSeries ? "s" + n.seriesId : "n" + n.id;
        if (seen[key]) return;
        seen[key] = true;
        out.push({
            name: isSeries && n.seriesTitle ? n.seriesTitle : n.title,
            link: isSeries ? BASE_URL + "/novel/series/" + n.seriesId : novelLink(n.id),
            cover: n.url || "",
            description: (n.userName || "") + (n.textCount ? " · " + n.textCount + " 字" : ""),
            host: BASE_URL
        });
    });
    return out;
}

function searchTag(tag, page, mode, sMode) {
    page = page ? parseInt(page) : 1;
    var t = encodeURIComponent(tag);
    var body = api("/ajax/search/novels/" + t + "?word=" + t + "&order=date_d&mode=" + mode +
        "&p=" + page + "&s_mode=" + sMode + "&lang=zh");
    if (!body || !body.novel) return Response.error("Không tải được danh sách");
    var data = body.novel.data || [];
    return Response.success(toList(data), data.length > 0 ? String(page + 1) : "");
}

// Bỏ tiền tố kiểu "#1 ", "#2 ", "＃3 " ở đầu tên chương
function cleanTitle(t) {
    t = (t || "").replace(/^\s*[#＃]\s*\d+(?:\.\d+)?\s*[:：.\-]?\s*/, "");
    return t.trim();
}

function imgUrl(u) {
    if (!u) return "";
    u = String(u);
    return IMG_PROXY ? u.replace("https://i.pximg.net", IMG_PROXY) : u;
}

// Số chương ĐẦU được quét ảnh khi mở trang chi tiết của một series (mỗi chương = 1 request).
// Chỉnh trong Cài đặt extension (scan_chapters); 0 = tắt. Giá trị mặc định nếu app không truyền cài đặt: 2.
var IMG_SCAN_MAX = 2;
try {
    var scanSetting = parseInt(scan_chapters);
    if (!isNaN(scanSetting) && scanSetting >= 0) IMG_SCAN_MAX = scanSetting;
} catch (error) {
}

// Chất lượng ảnh trong chương: "Nhỏ" | "Vừa" | "Gốc" (cài đặt image_quality).
var IMG_QUALITY = "Nhỏ";
try {
    if (image_quality) IMG_QUALITY = String(image_quality);
} catch (error) {
}

// Thứ tự ưu tiên các bản ảnh theo chất lượng. kind: "upload" (ảnh tải lên trong truyện)
// hoặc "pixiv" (ảnh minh họa Pixiv: small / medium / regular / original)
function imageKeyOrder(kind) {
    var q = IMG_QUALITY;
    if (kind === "upload") {
        if (q === "Gốc") return ["original", "1200x1200", "480mw"];
        if (q === "Vừa") return ["1200x1200", "480mw", "original"];
        return ["480mw", "1200x1200", "original"];
    }
    if (q === "Gốc") return ["original", "regular", "medium", "small"];
    if (q === "Vừa") return ["regular", "medium", "small", "original"];
    return ["small", "medium", "regular", "original"];
}

// Chọn bản ảnh đầu tiên có trong urls theo thứ tự ưu tiên. Trả { url, key, fallback } hoặc null.
function pickImage(urls, kind) {
    if (!urls) return null;
    var order = imageKeyOrder(kind);
    for (var i = 0; i < order.length; i++) {
        if (urls[order[i]]) return { url: urls[order[i]], key: order[i], fallback: i > 0 };
    }
    return null;
}

// Đếm ảnh trong nội dung truyện: [uploadedimage:ID] và [pixivimage:ID] / [pixivimage:ID-trang]
function countImages(text) {
    text = String(text || "");
    var a = text.match(/\[uploadedimage:\d+\]/g) || [];
    var b = text.match(/\[pixivimage:\d+(?:-\d+)?\]/g) || [];
    return a.length + b.length;
}

// ===== Xem theo tác giả =====
// Số truyện tối đa đưa vào mục lục khi mở trang tác giả bằng link users/ID (mỗi 50 truyện = 1 request).
var TOC_USER_MAX = 200;

// Lấy ID tác giả từ link ".../users/ID" hoặc từ chuỗi chỉ gồm số
function userIdFrom(s) {
    s = String(s || "");
    var m = s.match(/users\/(\d+)/) || s.match(/^\s*(\d+)\s*$/);
    return m ? m[1] : "";
}

// Danh sách ID truyện của tác giả, mới nhất trước. null nếu không tải được.
function userNovelIds(uid) {
    var body = api("/ajax/user/" + uid + "/profile/all?lang=zh");
    if (!body) return null;
    var ids = [], novels = body.novels;
    if (novels && !Array.isArray(novels)) {
        for (var k in novels) ids.push(String(k));
    } else if (Array.isArray(novels)) {
        novels.forEach(function (x) { if (x && x.id) ids.push(String(x.id)); });
    }
    ids.sort(function (a, b) { return parseInt(b) - parseInt(a); });
    return ids;
}

// Thông tin chi tiết của một nhóm ID truyện (giữ đúng thứ tự ids)
function userNovels(uid, ids) {
    if (!ids.length) return [];
    var q = ids.map(function (i) { return "ids%5B%5D=" + i; }).join("&");
    var body = api("/ajax/user/" + uid + "/novels?" + q + "&lang=zh");
    if (!body) return [];
    var out = [];
    if (Array.isArray(body)) return body;
    ids.forEach(function (i) { if (body[i]) out.push(body[i]); });
    return out;
}

// Một trang (24 truyện) trong danh sách truyện của tác giả
function authorPage(uid, page) {
    var per = 24;
    page = page ? parseInt(page) : 1;
    var ids = null;
    if (page > 1) {
        try { ids = JSON.parse(cacheStorage.getItem("author_" + uid) || "null"); } catch (e) { ids = null; }
    }
    if (!ids) {
        ids = userNovelIds(uid);
        if (!ids) return Response.error("Không tải được danh sách truyện của tác giả " + uid + " (kiểm tra Cookie trong cài đặt extension)");
        try { cacheStorage.setItem("author_" + uid, JSON.stringify(ids)); } catch (e2) {}
    }
    var items = toList(userNovels(uid, ids.slice((page - 1) * per, page * per)));
    console.log("tác giả " + uid + " trang " + page + ": " + items.length + " mục / " + ids.length + " truyện");
    return Response.success(items, page * per < ids.length ? String(page + 1) : "");
}

// Chip "Tác giả: tên" ở trang chi tiết, bấm vào để xem truyện của tác giả
// Chuyển giá trị isFollowed của Pixiv thành true / false / null (null = không biết, ví dụ chưa đăng nhập)
function boolOrNull(f) {
    if (f === true || String(f) === "true") return true;
    if (f === false || String(f) === "false") return false;
    return null;
}

// Tác giả có đang được tài khoản đăng nhập theo dõi không: true / false / null.
// Kết quả "biết chắc" được nhớ 10 phút trong cacheStorage nên mở lại trang chi tiết không tốn thêm request.
function userFollowed(userId) {
    if (!userId) return null;
    var key = "followed_" + userId;
    try {
        var cached = JSON.parse(cacheStorage.getItem(key) || "null");
        if (cached && (new Date().getTime() - cached.t) < 600000) return cached.v;
    } catch (error) {
    }
    var p = api("/ajax/user/" + userId + "?full=1&lang=zh");
    var v = p ? boolOrNull(p.isFollowed) : null;
    if (v !== null) {
        try { cacheStorage.setItem(key, JSON.stringify({ v: v, t: new Date().getTime() })); } catch (error2) {}
    }
    return v;
}

// Chip app không đổi màu được, nên tác giả đang theo dõi được đánh dấu bằng ★ và chữ ngay trên chip.
function authorChip(userId, name, followed) {
    if (!userId) return [];
    var on = followed === true;
    return [{
        title: (on ? "★ " : "") + "Tác giả: " + (name || userId) + (on ? " · Đã theo dõi" : ""),
        input: String(userId),
        script: "author.js"
    }];
}

// Dòng "Tác giả: tên" trong phần thông tin của trang chi tiết
function authorLine(name, followed) {
    return "Tác giả: " + name + (followed === true ? " ★ Đã theo dõi" : "");
}
