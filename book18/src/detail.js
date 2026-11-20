load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    // Book pages have an info block (div.item); short-story pages (/<id>) do not.
    let hasInfo = !doc.select("div.item").isEmpty();
    let img = doc.select("div.item img").first();
    let cover = img ? img.attr("src") : "";
    if (cover.indexOf("//") === 0) cover = "https:" + cover;
    else if (cover.indexOf("/") === 0) cover = BASE_URL + cover;

    let author = "", detail = "", description = "";
    if (hasInfo) {
        author = doc.select("div.item > div > p:nth-child(3) > a").text().replace(/作\s*者：/g, "");
        let status = doc.select("div.item > div > p:nth-child(2) > span:nth-child(1)").text();
        let novelType = doc.select("div.item > div > p:nth-child(2) > span:nth-child(2)").text();
        let charCount = doc.select("div.item > div > p:nth-child(2) > span:nth-child(3)").text();
        detail = "作者: " + author;
        description = "Thể loại: " + novelType + "<br>Tình trạng: " + status + "<br>" + charCount +
                      "<br>Văn án: <br>" + doc.select("div.des.bb").html();
    }

    return Response.success({
        name: pageTitle(doc),
        cover: cover,
        author: author,
        detail: detail,
        description: description,
        url: url,
        type: "novel",
        format: "novel",
        host: BASE_URL
    });
}

function pageTitle(doc) {
    let h = doc.select("h1").first();
    return h ? h.text().trim() : "";
}
