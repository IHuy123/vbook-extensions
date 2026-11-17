load("config.js");
// "Khám phá" (novel/discovery?mode=r18). Cần đăng nhập: dùng cookie đã lưu ở cài đặt extension.
// Pixiv trả một đợt ngẫu nhiên (24 truyện) mỗi lần gọi và không có số trang, nên mỗi lần kéo thêm
// ta gọi lại để lấy đợt mới, lọc bỏ truyện đã hiện (nhớ trong cacheStorage). Dừng sau 20 trang
// hoặc khi không còn truyện mới.
// input: "r18" hoặc "all"
function execute(input, page) {
    var mode = input || "r18";
    page = page ? parseInt(page) : 1;

    var seen = {};
    if (page > 1) {
        try { seen = JSON.parse(cacheStorage.getItem("disc_seen") || "{}") || {}; } catch (e) { seen = {}; }
    }

    var fresh = [];
    for (var t = 0; t < 3 && !fresh.length; t++) {
        var body = api("/ajax/discovery/novels?mode=" + mode + "&limit=24&lang=zh");
        if (!body) {
            if (page === 1 && t === 0) return Response.error("Không tải được danh sách (kiểm tra Cookie trong cài đặt extension còn hạn / đã đăng nhập chưa)");
            break;
        }
        var data = (body.thumbnails && body.thumbnails.novel) || (body.novel && body.novel.data) || [];
        toList(data).forEach(function (it) {
            if (!seen[it.link]) { seen[it.link] = 1; fresh.push(it); }
        });
    }

    try { cacheStorage.setItem("disc_seen", JSON.stringify(seen)); } catch (e2) {}
    console.log("discovery trang " + page + ": " + fresh.length + " truyện mới");
    return Response.success(fresh, fresh.length > 0 && page < 20 ? String(page + 1) : "");
}
