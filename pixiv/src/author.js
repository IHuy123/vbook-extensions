load("config.js");
// Truyện của một tác giả. input: ID hoặc link https://www.pixiv.net/users/ID
function execute(input, page) {
    var uid = userIdFrom(input);
    if (!uid) return Response.error("Không nhận ra ID tác giả");
    return authorPage(uid, page);
}
