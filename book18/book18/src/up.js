load('config.js');
function execute(input, page) {
    page = page || "1";
    let response = fetchList(input, page, 100);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let items = parseBooks(response.html(), ".list-group .list-group-item");
    return Response.success(items, String(parseInt(page) + 1));
}
