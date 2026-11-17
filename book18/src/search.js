load('config.js');
function execute(key, page) {
    page = page || "1";
    let response = fetch(BASE_URL + "/node/index?q=" + encodeURIComponent(key) + "&page=" + page);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let items = dedupeSeries(parseBooks(response.html(), ".list-group .list-group-item"), "q:" + key, page);
    return Response.success(items, String(parseInt(page) + 1));
}
