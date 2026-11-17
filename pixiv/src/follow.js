load("config.js");
// "Mới từ người theo dõi" (bookmark_new_r18.php). Cần đăng nhập: dùng cookie đã lưu ở cài đặt extension.
// input: "r18" hoặc "all"
function execute(input, page) {
    page = page ? parseInt(page) : 1;
    var mode = input || "r18";
    var body = api("/ajax/follow_latest/novel?p=" + page + "&mode=" + mode + "&lang=zh");
    if (!body) return Response.error("Không tải được danh sách (kiểm tra Cookie trong cài đặt extension còn hạn / đã đăng nhập chưa)");
    var data = (body.thumbnails && body.thumbnails.novel) || (body.novel && body.novel.data) || [];
    return Response.success(toList(data), data.length > 0 ? String(page + 1) : "");
}
