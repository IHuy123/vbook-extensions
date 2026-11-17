load('config.js');
function execute(input, page) {
    page = page || "1";
    let response = fetch(listUrl(input, page));
    if (!response.ok) return Response.error("HTTP " + response.status);
    let items = dedupeSeries(parseBooks(response.html(), ".list-group .list-group-item"), input, page);
    return Response.success(items, String(parseInt(page) + 1));
}
