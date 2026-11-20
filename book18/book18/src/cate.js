load('config.js');
function execute(input, page) {
    page = page || "1";
    let response = fetchList(input, page, 100);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let items = parseBooks(response.html(), ".col-md-6 ul li");
    return Response.success(items, String(parseInt(page) + 1));
}
