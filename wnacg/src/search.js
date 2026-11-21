load('config.js');
function execute(query, page) {
    query = query || "";
    page = page || "1";
    page = String(page);
    let pageNum = parseInt(page, 10) || 1;

    let url;
    if (query.indexOf("http") === 0 || query.indexOf("/") === 0) {
        let path = query;
        if (path.indexOf("http") === 0) {
            path = path.replace(/^https?:\/\/[^\/]+/, "");
        }

        if (path.indexOf("favorite_ranking") !== -1) {
            let typeMatch = path.match(/type-(day|week|month|year)/);
            let rankType = typeMatch ? typeMatch[1] : "week";
            if (pageNum <= 1) {
                if (typeMatch) {
                    path = "/albums-favorite_ranking-type-" + rankType + ".html";
                } else {
                    path = "/albums-favorite_ranking.html";
                }
            } else {
                path = "/albums-favorite_ranking-page-" + pageNum + "-type-" + rankType + ".html";
            }
        } else if (path.indexOf("albums-index") !== -1) {
            if (path.match(/page-\d+/)) {
                path = path.replace(/page-\d+/, "page-" + page);
            } else if (path.indexOf("tag-") !== -1) {
                path = path.replace("albums-index-tag-", "albums-index-page-" + page + "-tag-");
            } else {
                path = path.replace("albums-index", "albums-index-page-" + page);
            }
        } else if (path.indexOf("albums.html") !== -1 || path === "/albums.html") {
            if (pageNum > 1) {
                path = "/albums-index-page-" + page + ".html";
            }
        } else {
            path = path + (path.indexOf("?") === -1 ? "?" : "&") + "p=" + page;
        }
        url = absUrl(path);
    } else {
        url = BASE_URL + "/search/?q=" + encodeURIComponent(query) + "&f=_all&s=create_time_DESC&p=" + page;
    }

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = parseListItems(doc);
    let nextPage = hasNextPage(doc, page) ? (pageNum + 1).toString() : "";

    return Response.success(items, nextPage);
}
