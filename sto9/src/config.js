let BASE_URL = "https://sto9.com";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}
BASE_URL = String(BASE_URL).replace(/\/+$/, "");

function normalizeUrl(url) {
    url = String(url || "");
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (url.indexOf("http") !== 0) {
        return BASE_URL + (url.indexOf("/") === 0 ? "" : "/") + url;
    }
    return url.replace(/^https?:\/\/[^\/?#]+/i, BASE_URL);
}

function metaContent(doc, key) {
    let el = doc.select('meta[property="' + key + '"]');
    if (el.isEmpty()) el = doc.select('meta[name="' + key + '"]');
    return el.isEmpty() ? "" : String(el.first().attr("content")).trim();
}

// Cover path on this site is derived from the book id: /files/article/image/{id/1000}/{id}/{id}s.jpg
function coverFromId(id) {
    id = String(id);
    return BASE_URL + "/files/article/image/" + Math.floor(parseInt(id, 10) / 1000) + "/" + id + "/" + id + "s.jpg";
}

function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

var NAMED_ENTITIES = {
    nbsp: " ", ensp: " ", emsp: " ", thinsp: " ", emsp13: " ", emsp14: " ", numsp: " ", puncsp: " ", hairsp: " ",
    lt: "<", gt: ">", quot: '"', apos: "'", amp: "&",
    hellip: "\u2026", mdash: "\u2014", ndash: "\u2013", lsquo: "\u2018", rsquo: "\u2019",
    ldquo: "\u201C", rdquo: "\u201D", middot: "\u00B7", ldquor: "\u201C", rdquor: "\u201D"
};

function decodeOnce(s) {
    return s
        .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
        .replace(/&#x([0-9a-f]+);/gi, function (m, n) { return String.fromCharCode(parseInt(n, 16)); })
        .replace(/&([a-z][a-z0-9]*);/gi, function (m, name) {
            let v = NAMED_ENTITIES[name.toLowerCase()];
            return v === undefined ? "" : v;   // unknown named entity: drop it rather than show "&xxx;"
        });
}

// Run twice: some pages double-encode ("&amp;emsp;").
function decodeEntities(s) {
    s = decodeOnce(String(s));
    return decodeOnce(s);
}


// Detect obfuscated domain (emoji / special chars inserted into "sto9.com" / "to9.com").
// Strips everything except a-z0-9 then looks for the core token.
function hasObfuscatedDomain(s) {
    let cleaned = String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned.indexOf("sto9com") !== -1 || cleaned.indexOf("to9com") !== -1;
}

// Traditional + simplified Chinese ad phrases
var AD_PHRASES = [
    "本章節來源於", "本章节来源于",
    "觀看最新章節訪問", "观看最新章节访问",
    "獲取最新章節更新", "获取最新章节更新",
    "想獲取本書最新更新", "想获取本书最新更新",
    "看本書最新章節", "看本书最新章节",
    "想看更多精彩章節", "想看更多精彩章节",
    "提醒你可以閱讀最新章節", "提醒你可以阅读最新章节",
    "請記住本站", "请记住本站",
    "手機用戶請瀏覽", "手机用户请浏览",
    "為您提供最快的小說更新", "为您提供最快的小说更新",
    "提醒您查看最新內容", "提醒您查看最新内容",
    "最新最快的章節更新", "最新最快的章节更新",
    "實時更新", "实时更新",
    "閱讀更多內容", "阅读更多内容",
    "最新小說章節盡在", "最新小说章节尽在",
    "請訪問", "请访问"
];

// Remove common sto9 / source ads from chapter or description text.
// Handles emoji-inserted domains (sto🎶9.com, s🍓to9.com, sto9.co🎊m …)
// and both traditional + simplified Chinese ad lines.
// Safe to call on any string; does not throw.
function stripAds(text) {
    text = String(text || "");

    // 1) Whole lines containing any known ad phrase
    let phraseRe = new RegExp(
        "^.*(?:" + AD_PHRASES.join("|") + ").*\\r?\\n?",
        "gim"
    );
    text = text.replace(phraseRe, "");

    // 2) Drop short lines that still contain an obfuscated domain
    let lines = text.split(/\r?\n/);
    let kept = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (hasObfuscatedDomain(line) && line.length < 100) continue;
        kept.push(line);
    }
    text = kept.join("\n");

    // 3) Inline: scrub any remaining obfuscated domain token
    //    Match runs that become "sto9com" / "to9com" after stripping noise
    text = text.replace(/[sSｓＳ][\s\S]{0,6}[tTｔＴ][\s\S]{0,6}[oOｏＯ][\s\S]{0,6}9[\s\S]{0,6}[cCｃＣ][\s\S]{0,6}[oOｏＯ][\s\S]{0,6}[mMｍＭ]/g, "");
    text = text.replace(/(?:sto9\.com|to9\.com|思兔|思兔)/gi, "");

    return text;
}


// Listing pages (ranking / category / search) have no stable item class, so the list is read
// from anchors in document order: book link -> author link -> latest chapter link.
// A real list entry always has a separate /author/ link; sidebar "recommend" blocks do not.
function parseBookList(doc, requireAuthor, noDesc) {
    let map = {};
    let order = [];
    let current = null;

    doc.select("a").forEach(function (el) {
        let href = String(el.attr("href"));
        if (!href) return;
        let text = String(el.text()).replace(/\s+/g, " ").trim();

        let bm = href.match(/\/book\/(\d+)\.html/);
        if (bm) {
            let id = bm[1];
            if (!map[id]) {
                map[id] = { id: id, name: "", cover: "", author: "", latest: "" };
                order.push(id);
            }
            current = map[id];
            let img = el.select("img");
            if (!img.isEmpty() && !current.cover) {
                let first = img.first();
                current.cover = String(first.attr("data-original") || first.attr("data-src") || first.attr("src") || "");
            }
            if (text && !current.name && text !== "點擊閱讀" && text !== "加入書架") {
                let half = text.split(" ");
                current.name = (half.length === 2 && half[0] === half[1]) ? half[0] : text;
            }
            return;
        }
        if (!current) return;

        if (href.indexOf("/author/") !== -1) {
            if (!current.author && text) current.author = text;
            return;
        }
        if (/\/txt\/\d+\//.test(href) && !current.latest && text) {
            current.latest = text;
        }
    });

    let items = [];
    order.forEach(function (id) {
        let b = map[id];
        if (!b.name) return;
        if (requireAuthor && !b.author) return;
        let cover = b.cover;
        if (!cover || cover.indexOf("nocover") !== -1) {
            cover = coverFromId(id);
        } else if (cover.indexOf("http") !== 0) {
            cover = normalizeUrl(cover);
        }
        items.push({
            name: b.name,
            link: BASE_URL + "/book/" + id + ".html",
            cover: cover,
            description: noDesc ? "" : [b.author, b.latest].filter(Boolean).join(" · ")
        });
    });
    return items;
}

// Pager: "<<  1 2 3 (...)  >  >>" where hrefs end with _{page}.html
function hasNextPage(doc, page) {
    let last = 0;
    let next = false;
    doc.select("a").forEach(function (el) {
        let t = String(el.text()).trim();
        if (t !== ">" && t !== ">>") return;
        let m = String(el.attr("href")).match(/_(\d+)\.html/);
        if (!m) return;
        let n = parseInt(m[1], 10);
        if (t === ">>") last = n;
        else if (n > page) next = true;
    });
    if (last) return page < last;
    return next;
}

function listPage(url, page, noDesc) {
    let response = fetch(url);
    if (!response.ok) return null;
    let doc = response.html();
    let items = parseBookList(doc, true, noDesc);
    if (items.length === 0) items = parseBookList(doc, false, noDesc);
    return { items: items, next: hasNextPage(doc, page) ? String(page + 1) : "" };
}
