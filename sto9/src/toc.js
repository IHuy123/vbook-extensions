load('config.js');

var UA_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"
};

// fetch with retry: ECONNRESET / timeouts are transient on this site, so never give up on the first try.
function safeFetch(url, referer, tries) {
    tries = tries || 3;
    for (let i = 0; i < tries; i++) {
        try {
            let headers = {};
            for (let k in UA_HEADERS) headers[k] = UA_HEADERS[k];
            if (referer) headers["Referer"] = referer;
            let res = fetch(url, { headers: headers });
            if (res && res.ok) return res;
        } catch (e) {
            Console.log("fetch error (" + (i + 1) + "/" + tries + ") " + url + ": " + e);
        }
        try { sleep(600 * (i + 1)); } catch (e2) {}
    }
    return null;
}

function collectChapters(doc, bookId, seen, list) {
    doc.select("a").forEach(function (el) {
        let m = String(el.attr("href")).match(/\/txt\/(\d+)\/(\d+)\.html/);
        if (!m || m[1] !== bookId || seen[m[2]]) return;
        let name = String(el.text()).replace(/\s*\d{4}-\d{2}-\d{2}\s*$/, "").trim();
        if (!name) return;
        seen[m[2]] = true;
        list.push({
            id: parseInt(m[2], 10),
            name: name,
            url: BASE_URL + "/txt/" + bookId + "/" + m[2] + ".html"
        });
    });
}

// The static index page only carries the first ~15 and last ~20 chapters; the full list is loaded
// by the "點擊展開全部N章節目錄" control from a separate ajax endpoint. Fetch that over plain HTTP
// (fast and stable) instead of launching a headless browser.
function loadFullList(bookId, total, seen, list, referer) {
    let candidates = [
        BASE_URL + "/ajax_novels/chapterlist/" + bookId + ".html",
        BASE_URL + "/ajax_novels/chapterlist/" + bookId,
        BASE_URL + "/book/" + bookId + "/",
        BASE_URL + "/book/" + bookId + ".html",
        BASE_URL + "/book/" + bookId + "/index_2.html",
        BASE_URL + "/book/" + bookId + "/index_3.html",
        BASE_URL + "/book/" + bookId + "/index_1.html"
    ];
    for (let i = 0; i < candidates.length; i++) {
        if (total > 0 && list.length >= total) break;
        let res = safeFetch(candidates[i], referer, 2);
        if (!res) { Console.log("toc source MISS " + candidates[i]); continue; }
        let before = list.length;
        try {
            collectChapters(Html.parse(String(res.text())), bookId, seen, list);
        } catch (e) {
            Console.log("parse failed " + candidates[i] + ": " + e);
        }
        Console.log("toc source " + candidates[i] + " +" + (list.length - before) + " => " + list.length);
    }
}

// Last resort only. Launching a headless browser inside the desktop test server can kill the whole
// server process (ECONNRESET followed by ECONNREFUSED), so it is used only when plain HTTP found
// nothing more than the partial static list.
function expandWithBrowser(tocUrl, bookId, total, seen, list) {
    let script = "(function(){var all=document.getElementsByTagName('*'),best=null,len=1e9;" +
        "for(var i=0;i<all.length;i++){var e=all[i],t=e.tagName;" +
        "if(t==='SCRIPT'||t==='STYLE'||t==='NOSCRIPT'||t==='HTML'||t==='BODY')continue;" +
        "var x=e.textContent||'';if(x.indexOf('展開全部')!==-1&&x.length<len){best=e;len=x.length;}}" +
        "if(best){best.click();}return best?best.tagName:'none';})()";

    let browser = Engine.newBrowser();
    try {
        browser.setUserAgent(UserAgent.android());
        browser.launch(tocUrl, 20000);
        let clicked = browser.callJs(script, 4000);
        Console.log("toc expand click: " + clicked);
        collectChapters(browser.html(1500), bookId, seen, list);
        if (list.length < total) {
            collectChapters(browser.html(4000), bookId, seen, list);
        }
    } finally {
        try { browser.close(); } catch (e) {}
    }
}

function execute(url) {
    url = normalizeUrl(url);
    let m = url.match(/\/book\/(\d+)/);
    if (!m) return Response.error("URL truyện không hợp lệ");
    let bookId = m[1];
    let bookUrl = BASE_URL + "/book/" + bookId + ".html";
    let tocUrl = BASE_URL + "/book/" + bookId + "/index.html";

    let seen = {};
    let list = [];
    let html = "";

    // 1) static index page (fall back to the book page if the index page keeps resetting)
    let response = safeFetch(tocUrl, bookUrl, 3) || safeFetch(bookUrl, BASE_URL + "/", 3);
    if (!response) return Response.error("Không kết nối được tới " + BASE_URL + " (ECONNRESET). Thử lại sau hoặc đổi DOMAIN.");
    html = String(response.text());
    collectChapters(Html.parse(html), bookId, seen, list);

    let tm = html.match(/展開全部\s*(\d+)/) || html.match(/(\d+)\s*章節目錄/);
    let total = tm ? parseInt(tm[1], 10) : 0;

    // 2) full list over HTTP
    if (total === 0 || list.length < total) {
        loadFullList(bookId, total, seen, list, tocUrl);
    }

    Console.log("toc total declared=" + total + ", collected=" + list.length);

    // 3) headless browser, only if still incomplete
    if (total > list.length) {
        try {
            expandWithBrowser(tocUrl, bookId, total, seen, list);
        } catch (e) {
            Console.log("toc expand failed: " + e);
        }
    }
    if (list.length === 0) return Response.error("Không đọc được mục lục");

    list.sort(function (a, b) { return a.id - b.id; });
    Console.log("toc final: " + list.length + " chapters, id " + list[0].id + " .. " + list[list.length - 1].id);
    let chapters = list.map(function (c) {
        return { name: c.name, url: c.url, description: "", lock: false, pay: false };
    });
    return Response.success(chapters);
}
