load('config.js');
function execute(input) {
    input = input || "";
    let url = normalizeUrl(input);
    if (!url) return Response.error("Missing url");

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = [];
    doc.select(".ar_grid .ar_item, .ar_item").forEach(function (el) {
        let a = el;
        let href = a.attr("href") || "";
        if (!href || href.indexOf("aid-") === -1) {
            let inner = el.select("a").first();
            if (inner) {
                a = inner;
                href = a.attr("href") || "";
            }
        }
        if (!href || href.indexOf("aid-") === -1) return;

        let title = a.attr("title") || "";
        if (!title) {
            let te = el.select(".ar_title").first();
            if (te) title = te.text().trim();
        }
        if (!title) title = a.text().trim();

        let img = el.select("img").first();
        let cover = "";
        if (img) cover = img.attr("src") || img.attr("data-src") || "";

        items.push({
            name: title,
            cover: absUrl(cover),
            link: absUrl(href),
            host: BASE_URL
        });
    });

    return Response.success(items, "");
}
