load("config.js");
function execute(key, page) {
    // Dán link tác giả (…/users/ID) vào ô tìm kiếm để xem truyện của tác giả đó
    if (/users\/\d+/.test(String(key || ""))) return authorPage(userIdFrom(key), page);
    return searchTag(key, page, "all", "s_tag");
}
