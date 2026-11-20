let BASE_URL = "https://www.book18.org";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

// Parse a list of books. Skips pagination links (Next/Previous/page numbers)
// and de-duplicates by link.
function parseBooks(doc, selector) {
    let items = [];
    let seen = {};
    doc.select(selector).forEach(function (el) {
        let a = el.select("a").first();
        if (!a) return;
        let name = a.text().trim();
        let href = a.attr("href");
        if (!name || !href) return;
        if (/[?&]page=/.test(href)) return;
        let link = href.indexOf("http") === 0 ? href : BASE_URL + href;
        if (seen[link]) return;
        seen[link] = true;
        items.push({ name: name, link: link, description: name, host: BASE_URL });
    });
    return items;
}

// Build a paged list URL; picks "?" or "&" depending on the input.
function listUrl(input, page, perPage) {
    let base = input.indexOf("http") === 0 ? normalizeUrl(input) : BASE_URL + input;
    let url = base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + page;
    return perPage ? url + "&per-page=" + perPage : url;
}

// Fetch one list page; if the site answers 400, retry without per-page.
function fetchList(input, page, perPage) {
    let r = fetch(listUrl(input, page, perPage));
    if (r.ok || r.status !== 400 || !perPage) return r;
    return fetch(listUrl(input, page, 0));
}

// Split a title like "催眠神瞳(286-290)作者：世間" into a series key and a volume number.
function parseSeries(name) {
    let author = "";
    let base = name;
    let m = name.match(/作\s*者\s*[：:]\s*(.*)$/);
    if (m) {
        author = m[1].replace(/\s+/g, "");
        base = name.substring(0, name.indexOf(m[0]));
    }
    let num = -1;
    (base.match(/[（(][^）)]*[）)]/g) || []).forEach(function (p) {
        if (/^[（(]\s*\d+(?:\s*[-~－～至]\s*\d+)?\s*[）)]$/.test(p)) {
            (p.match(/\d+/g) || []).forEach(function (x) { num = Math.max(num, parseInt(x)); });
        }
    });
    let t = base.match(/[-－]\s*(\d+)\s*$/);
    if (t) num = Math.max(num, parseInt(t[1]));
    let title = base.replace(/[（(][^）)]*[）)]/g, "").replace(/[-－]\s*\d+\s*$/, "")
        .replace(/[\[\]【】《》]/g, "").replace(/\s+/g, "").toLowerCase();
    return { key: (title || name) + "|" + author, num: num };
}

// Keep one entry per series: the one with the largest volume number (ties: newest id).
// Series already shown on earlier pages of the same list are dropped too.
function dedupeSeries(items, scope, page) {
    let seen = {};
    let cacheKey = "series:" + scope;
    try {
        if (page !== "1") {
            let raw = cacheStorage.getItem(cacheKey);
            if (raw) seen = JSON.parse(raw);
        }
    } catch (e) {
        seen = {};
    }

    let result = [];
    let index = {};
    items.forEach(function (it) {
        let s = parseSeries(it.name);
        if (seen[s.key]) return;
        let idm = it.link.match(/(\d+)\/?$/);
        let cur = { item: it, key: s.key, num: s.num, id: idm ? parseInt(idm[1]) : 0 };
        let at = index[s.key];
        if (at === undefined) {
            index[s.key] = result.length;
            result.push(cur);
        } else {
            let old = result[at];
            if (cur.num > old.num || (cur.num === old.num && cur.id > old.id)) result[at] = cur;
        }
    });

    result.forEach(function (r) { seen[r.key] = 1; });
    try {
        cacheStorage.setItem(cacheKey, JSON.stringify(seen));
    } catch (e) {
    }
    return result.map(function (r) { return r.item; });
}
