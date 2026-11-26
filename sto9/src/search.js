load('config.js');

function norm(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, "");
}

function tryFetch(url, options) {
    try {
        let res = fetch(url, options);
        if (!res) return null;
        if (!res.ok) {
            Console.log("search " + url + " -> HTTP " + res.status);
            return null;
        }
        return res;
    } catch (e) {
        Console.log("search " + url + " failed: " + e);
        return null;
    }
}

// 1) the site's own search form (Jieqi-style endpoints; the first one that returns book links wins)
function siteSearch(query) {
    let enc = encodeURIComponent(query);
    let headers = { "Referer": BASE_URL + "/" };
    let post = { "Content-Type": "application/x-www-form-urlencoded", "Referer": BASE_URL + "/" };
    let attempts = [
        { url: BASE_URL + "/modules/article/search.php?searchkey=" + enc + "&searchtype=articlename", o: { headers: headers } },
        { url: BASE_URL + "/modules/article/search.php", o: { method: "POST", headers: post, body: "searchkey=" + enc + "&searchtype=articlename" } },
        { url: BASE_URL + "/modules/article/search.php", o: { method: "POST", headers: post, body: "searchkey=" + enc + "&searchtype=author" } },
        { url: BASE_URL + "/search.php?searchkey=" + enc, o: { headers: headers } },
        { url: BASE_URL + "/search?q=" + enc, o: { headers: headers } },
        { url: BASE_URL + "/search/" + enc + ".html", o: { headers: headers } }
    ];
    for (let i = 0; i < attempts.length; i++) {
        let res = tryFetch(attempts[i].url, attempts[i].o);
        if (!res) continue;
        let doc = res.html();

        // an exact match may redirect straight to the book page
        let finalUrl = String(res.url || "");
        let m = finalUrl.match(/\/book\/(\d+)\.html/);
        if (m) {
            let name = metaContent(doc, "og:novel:book_name") || metaContent(doc, "og:title");
            if (name) {
                return [{
                    name: name,
                    link: BASE_URL + "/book/" + m[1] + ".html",
                    cover: metaContent(doc, "og:image") || coverFromId(m[1]),
                    description: metaContent(doc, "og:novel:author")
                }];
            }
        }

        let items = parseBookList(doc, true);
        if (items.length > 0) {
            Console.log("search endpoint #" + i + " ok: " + items.length + " items");
            return items;
        }
        Console.log("search endpoint #" + i + " -> 0 items");
    }
    return [];
}

// 2) fallback: the site's search may be JS-only, so scan the full book listing (class 0, ~16 pages)
//    and keep the books whose title or author contains the query.
function scanSearch(query) {
    let q = norm(query);
    let found = [];
    let seen = {};
    let maxPages = 16;
    for (let p = 1; p <= maxPages; p++) {
        let result = null;
        try {
            result = listPage(BASE_URL + "/novels/class/0_" + p + ".html", p);
        } catch (e) {
            Console.log("scan page " + p + " failed: " + e);
        }
        if (!result) continue;
        result.items.forEach(function (it) {
            if (seen[it.link]) return;
            if (norm(it.name).indexOf(q) !== -1 || norm(it.description).indexOf(q) !== -1) {
                seen[it.link] = true;
                found.push(it);
            }
        });
        if (found.length >= 20 || !result.next) break;
    }
    Console.log("scan search found " + found.length);
    return found;
}

function execute(query, page) {
    query = String(query || "").trim();
    if (!query) return Response.success([], "");
    if (page && page !== "1") return Response.success([], "");

    let items = siteSearch(query);
    if (items.length === 0) items = scanSearch(query);
    return Response.success(items, "");
}
