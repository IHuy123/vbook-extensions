load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let idMatch = url.match(/\/book\/(\d+)/);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let name = metaContent(doc, "og:novel:book_name") || metaContent(doc, "og:title");
    if (!name) {
        let h1 = doc.select("h1");
        if (!h1.isEmpty()) name = String(h1.first().text()).trim();
    }
    if (!name) return Response.error("Không đọc được thông tin truyện");

    let author = metaContent(doc, "og:novel:author");
    if (!author) {
        let a = doc.select('a[href*="/author/"]');
        if (!a.isEmpty()) author = String(a.first().text()).trim();
    }

    let cover = metaContent(doc, "og:image");
    if (!cover && idMatch) cover = coverFromId(idMatch[1]);

    let category = metaContent(doc, "og:novel:category");
    let status = metaContent(doc, "og:novel:status");
    let updated = metaContent(doc, "og:novel:update_time");
    let description = metaContent(doc, "og:description");

    let info = [];
    if (author) info.push("作者: " + escapeHtml(author));
    if (category) info.push("分類: " + escapeHtml(category));
    if (status) info.push("狀態: " + escapeHtml(status));
    if (updated) info.push("更新: " + escapeHtml(updated));

    let tags = [];
    let catLink = doc.select('a[href*="/novels/class/"]');
    if (category && !catLink.isEmpty()) {
        tags.push({ title: category, input: String(catLink.first().attr("href")), script: "list.js" });
    }
    if (author) {
        tags.push({ title: author, input: "/author/" + encodeURIComponent(author) + ".html", script: "list.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: escapeHtml(description).replace(/\r?\n/g, "<br>"),
        detail: info.join("<br>"),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: !(status === "全本" || status.indexOf("完") !== -1),
        tags: tags
    });
}
