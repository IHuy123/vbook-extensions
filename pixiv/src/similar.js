load("config.js");
// Truyện liên quan (đề xuất của Pixiv theo một truyện). input: ID truyện
function execute(input, page) {
    var m = String(input || "").match(/\d+/);
    if (!m) return Response.error("Thiếu ID truyện");
    var body = api("/ajax/novel/" + m[0] + "/recommend/init?limit=18&lang=zh");
    if (!body) return Response.error("Không tải được truyện liên quan");
    var list = body.novels || (body.thumbnails && body.thumbnails.novel) || [];
    var items = toList(list);
    console.log("truyện liên quan " + m[0] + ": " + items.length + " mục");
    return Response.success(items, "");
}
