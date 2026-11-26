load('config.js');
function execute(input, page) {
    input = input || "";
    let n = parseInt(page || "1", 10);
    if (isNaN(n) || n < 1) n = 1;

    let url = normalizeUrl(input);
    if (/_\d+\.html/.test(url)) {
        url = url.replace(/_(\d+)\.html/, "_" + n + ".html");
    } else if (n > 1) {
        return Response.success([], "");
    }

    let result = listPage(url, n);
    if (!result) return Response.error("Không tải được danh sách: " + url);
    return Response.success(result.items, result.next);
}
