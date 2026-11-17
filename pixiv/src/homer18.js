load("config.js");
// Danh sách truyện theo tag ở chế độ R-18 (cần cookie đăng nhập đã lưu ở cài đặt extension).
function execute(input, page) {
    return searchTag(input, page, "r18", "s_tag_full");
}
