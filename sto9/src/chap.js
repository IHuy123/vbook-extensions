load('config.js');

function isJunk(line) {
    if (!line) return true;

    // Domain ads — works even when emoji/special chars are inserted
    // (sto🎶9.com, s🍓to9.com, sto9.co🎊m, …)
    if (hasObfuscatedDomain(line)) return true;
    if (line.indexOf("思兔") !== -1) return true;

    // Chinese ad phrases (traditional + simplified) from config AD_PHRASES
    for (let i = 0; i < AD_PHRASES.length; i++) {
        if (line.indexOf(AD_PHRASES[i]) !== -1) return true;
    }

    if (line.indexOf("還有更新") !== -1 && line.length < 20) return true;
    if (line.indexOf("还有更新") !== -1 && line.length < 20) return true;
    if ((line.indexOf("最新章節") !== -1 || line.indexOf("最新章节") !== -1) && line.length < 40) return true;
    if ((line.indexOf("溫馨提示") !== -1 || line.indexOf("温馨提示") !== -1) && line.length < 50) return true;

    return false;
}

// Remove anything that still looks like an HTML entity (&emsp; &EmSP; &amp;emsp; &#8195; ...) and
// invisible/indent characters. Self-contained so it works even if config.js is an older copy.
function cleanLine(line) {
    for (let i = 0; i < 3; i++) {
        line = line.replace(/&(?:amp;)*#?[a-z0-9]+;/gi, " ");
    }
    return line.replace(/^[\s\u3000\u2000-\u200B\uFEFF]+|[\s\u3000\u2000-\u200B\uFEFF]+$/g, "");
}

function toLines(fragment) {
    let s = fragment
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<a[\s>][\s\S]*?<\/a>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
        .replace(/<[^>]+>/g, "");
    s = decodeEntities(s);
    s = stripAds(s);

    let out = [];
    s.split(/\r?\n/).forEach(function (line) {
        line = cleanLine(line);
        if (!line || isJunk(line)) return;
        out.push(line);
    });
    return out;
}

// True when the occurrence at idx sits inside an unclosed <a> (i.e. it is nav-link text, not story text)
function insideAnchor(raw, idx, start) {
    let from = Math.max(start, idx - 200);
    let ctx = raw.substring(from, idx);
    let open = ctx.lastIndexOf("<a");
    if (open === -1 || open < ctx.lastIndexOf("</a")) return -1;
    return from + open;
}

function findNavStart(raw, start) {
    let marks = ["上一章", "下一章"];
    for (let k = 0; k < marks.length; k++) {
        let pos = start;
        while (true) {
            let idx = raw.indexOf(marks[k], pos);
            if (idx === -1) break;
            let a = insideAnchor(raw, idx, start);
            if (a !== -1) return a;
            pos = idx + marks[k].length;
        }
    }
    return raw.length;
}

// Everything between the chapter <h1> and the "上一章" button is the story text.
function sliceAfterTitle(raw) {
    let open = /<h1[\s>]/i.exec(raw);
    if (!open) return "";
    let close = /<\/h1\s*>/ig;
    close.lastIndex = open.index;
    let m = close.exec(raw);
    if (!m) return "";
    let start = m.index + m[0].length;
    return raw.substring(start, findNavStart(raw, start));
}

function fromSelectors(doc) {
    let sels = ["#content", "#chaptercontent", "#chapter-content", "#chapterContent", "#nr1", "#nr", "#txt",
        "#TextContent", "#htmlContent", ".txtnav", ".content", ".chapter-content", ".read-content",
        ".readcontent", ".article-content", "article"];
    let bestHtml = "";
    let bestLen = 0;
    sels.forEach(function (sel) {
        let els = doc.select(sel);
        if (els.isEmpty()) return;
        let el = els.first();
        let text = String(el.text());
        if (text.length < 80 || text.indexOf("上一章") !== -1 || text.indexOf("下一章") !== -1) return;
        if (text.length > bestLen) {
            bestLen = text.length;
            bestHtml = String(el.html());
        }
    });
    return bestHtml ? toLines(bestHtml) : [];
}

function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let raw = String(response.text());
    let doc = Html.parse(raw);

    let title = "";
    let h1 = doc.select("h1");
    if (!h1.isEmpty()) title = String(h1.first().text()).trim();

    let lines = toLines(sliceAfterTitle(raw));
    if (lines.length < 3) {
        lines = fromSelectors(doc);
        if (lines.length > 0 && lines[0] === title) lines.shift();
    }
    if (lines.length === 0) return Response.error("Không đọc được nội dung chương");

    return Response.success(escapeHtml(lines.join("\n")).replace(/\n/g, "<br>"), title);
}
