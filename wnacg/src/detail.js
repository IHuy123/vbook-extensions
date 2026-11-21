load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let name = "";
    let titleEl = doc.select("title").first();
    if (titleEl) {
        name = titleEl.text().replace(/\s*-\s*紳士漫畫.*$/, "").trim();
    }
    if (!name) {
        let h = doc.select("h2, .uwuinfo h2, .ar_title").first();
        if (h) name = h.text().trim();
    }

    let cover = "";
    let coverImg = doc.select(".uwthumb img, .asTBcell.uwthumb img, .ar_cover img, .cover img").first();
    if (coverImg) {
        cover = coverImg.attr("src") || coverImg.attr("data-src") || "";
    }
    if (!cover) {
        let firstThumb = doc.select(".gallary_item img").first();
        if (firstThumb) cover = firstThumb.attr("src") || firstThumb.attr("data-src") || "";
    }

    let pages = "";
    let category = "";
    doc.select(".uwconn label, .asTBcell.uwconn label").forEach(function (lab) {
        let t = lab.text().trim();
        if (t.indexOf("分類") === 0 || t.indexOf("分类") === 0) {
            category = t.replace(/^分類[：:]\s*/, "").replace(/^分类[：:]\s*/, "");
        } else if (t.indexOf("頁數") === 0 || t.indexOf("页数") === 0) {
            pages = t;
        }
    });

    // Tag chips via genres (same as user v2 — app shows these and opens search)
    let genres = [];
    doc.select(".addtags a.tagshow, .addtags a[href*='tag-']").forEach(function (a) {
        let title = a.text().trim();
        if (!title || title.indexOf("+TAG") !== -1) return;
        genres.push({
            title: title,
            input: a.attr("href") || "",
            script: "search.js"
        });
    });
    if (category) {
        genres.unshift({ title: category, input: "", script: "search.js" });
    }

    let description = pages ? pages : "";
    let descEl = doc.select(".uwconn p, .asTBcell.uwconn p").first();
    if (descEl) {
        let d = descEl.text().trim();
        if (d) description = (description ? description + "\n" : "") + d;
    }

    let aid = extractAid(url);

    let suggests = [];
    if (doc.select(".ar_item, .ar_grid .ar_item").size() > 0) {
        suggests.push({
            title: "相似標籤推薦",
            input: url,
            script: "similar.js"
        });
    }

    let comments = [];
    if (aid) {
        comments.push({
            title: "評論",
            input: absUrl("/comment-index-aid-" + aid + ".html"),
            script: "comments.js"
        });
    }

    return Response.success({
        name: name,
        author: "",
        cover: absUrl(cover),
        description: description,
        detail: pages + (category ? " · " + category : ""),
        url: url,
        host: BASE_URL,
        type: "comic",
        format: "comic",
        ongoing: false,
        nsfw: true,
        genres: genres,
        suggests: suggests,
        comments: comments
    });
}
