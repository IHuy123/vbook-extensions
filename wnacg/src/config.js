let BASE_URL = "https://www.wnacg.com";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    if (!url) return url;
    url = String(url);
    if (url.indexOf("//") === 0) {
        url = "https:" + url;
    }
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/i, BASE_URL);
}

function absUrl(path) {
    if (!path) return "";
    path = String(path).trim();
    path = path.replace(/^(?:https?:)?\/{2,}/, "//");
    if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) {
        return path;
    }
    if (path.indexOf("//") === 0) {
        return "https:" + path;
    }
    if (path.indexOf("/") === 0) {
        return BASE_URL + path;
    }
    return BASE_URL + "/" + path;
}

function extractAid(url) {
    let m = (url || "").match(/aid-(\d+)/);
    return m ? m[1] : "";
}

function parseListItems(doc) {
    let items = [];
    doc.select("li.gallary_item, .gallary_item").forEach(function (el) {
        let a = el.select(".pic_box a").first() || el.select("a").first();
        if (!a) return;
        let href = a.attr("href") || "";
        if (href.indexOf("photos-index") === -1 && href.indexOf("aid-") === -1) return;
        let img = el.select("img").first();
        let titleEl = el.select(".title a").first() || el.select(".title").first() || a;
        let infoEl = el.select(".info_col").first();
        let cover = "";
        if (img) {
            cover = img.attr("src") || img.attr("data-src") || "";
        }
        items.push({
            name: titleEl ? titleEl.text().trim() : "",
            cover: absUrl(cover),
            link: absUrl(href),
            description: infoEl ? infoEl.text().replace(/\s+/g, " ").trim() : "",
            host: BASE_URL
        });
    });
    return items;
}

function hasNextPage(doc, page) {
    let next = false;
    doc.select(".paginator a").forEach(function (a) {
        let t = a.text().trim();
        if (t === "»" || t === "›" || t === "下一頁" || t === "下一页") next = true;
        let href = a.attr("href") || "";
        let m = href.match(/page-(\d+)/);
        if (m && parseInt(m[1], 10) > parseInt(page || "1", 10)) next = true;
    });
    return next;
}
