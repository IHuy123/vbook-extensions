load('config.js');

function absUrl(href) {
    return href.indexOf("http") === 0 ? href : BASE_URL + href;
}

function parseChapterList(doc) {
    let list = [];
    doc.select(".list-group .list-group-item a").forEach(function (a) {
        let href = a.attr("href");
        if (!href) return;
        list.push({ name: a.text(), url: absUrl(href), host: BASE_URL });
    });
    return list;
}

// href of the "Next" pager link when it points past page `cur`, else "".
function nextPageHref(doc, cur) {
    let next = "";
    doc.select("a").forEach(function (a) {
        let text = a.text();
        if (text.indexOf("Next") === -1 && text.indexOf("\u00bb") === -1) return;
        let href = a.attr("href");
        let m = href.match(/[?&]page=(\d+)/);
        if (m && parseInt(m[1]) > cur) next = href;
    });
    return next;
}

// Every chapter of a book page (/chapters/<name>), following its pager if it has one.
function loadBook(bookUrl) {
    let all = [];
    let seen = {};
    let next = bookUrl;
    for (let i = 1; i <= 30 && next; i++) {
        let r = fetch(next);
        if (!r.ok) break;
        let d = r.html();
        let added = 0;
        parseChapterList(d).forEach(function (c) {
            if (seen[c.url]) return;
            seen[c.url] = true;
            all.push(c);
            added++;
        });
        if (added === 0) break;
        let href = nextPageHref(d, i);
        next = href ? absUrl(href) : "";
    }
    return all;
}

function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    // A chapter/part page links (breadcrumb) to its book page, which lists all parts
    // of the series, including the first ones.
    let bookUrl = "";
    doc.select("a").forEach(function (a) {
        if (bookUrl) return;
        let href = a.attr("href");
        if (/^(?:https?:\/\/[^\/]+)?\/chapters\//.test(href)) bookUrl = normalizeUrl(absUrl(href));
    });
    if (bookUrl && bookUrl !== url) {
        let all = loadBook(bookUrl);
        if (all.length > 0) return Response.success(all);
    }

    let data = parseChapterList(doc);
    if (data.length === 0) {
        let h = doc.select("h1").first();
        data.push({ name: (h ? h.text().trim() : "") || "Toàn văn", url: url, host: BASE_URL });
    }
    return Response.success(data);
}
