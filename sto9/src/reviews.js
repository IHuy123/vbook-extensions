load('config.js');

// Latest book reviews from https://sto9.com/reviews/all  (paginated as /reviews/all/{n}.html)
// Each item shows the review text; tapping opens the linked book (detail).
function execute(input, page) {
    let n = parseInt(page || "1", 10);
    if (isNaN(n) || n < 1) n = 1;

    // Page 1 is either /reviews/all or /reviews/all/1.html
    let path = n <= 1 ? "/reviews/all" : "/reviews/all/" + n + ".html";
    let url = normalizeUrl(path);

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = [];

    doc.select(".review-item").forEach(function (el) {
        let bookA = el.select('a[href*="/book/"]');
        if (bookA.isEmpty()) return;

        let href = String(bookA.first().attr("href"));
        let idMatch = href.match(/\/book\/(\d+)/);
        if (!idMatch) return;
        let id = idMatch[1];

        // Prefer unique by review (book can appear multiple times with different comments)
        // but keep every review as its own row so comments stay visible.
        let bookName = String(bookA.first().text()).replace(/\s+/g, " ").trim();
        if (!bookName) return;

        let reviewText = "";
        let p = el.select("p.review-text");
        if (!p.isEmpty()) reviewText = String(p.first().text()).replace(/\s+/g, " ").trim();

        let user = "";
        let strong = el.select(".user strong");
        if (!strong.isEmpty()) user = String(strong.first().text()).trim();

        let time = "";
        let cVal = el.select(".c_tag .c_value");
        if (!cVal.isEmpty()) time = String(cVal.first().text()).trim();

        let descParts = [];
        if (reviewText) descParts.push(reviewText);
        if (user) descParts.push(user + (time ? " · " + time : ""));
        else if (time) descParts.push(time);

        items.push({
            name: bookName,
            link: normalizeUrl("/book/" + id + ".html"),
            cover: coverFromId(id),
            description: descParts.join("\n"),
            tag: user || ""
        });
    });

    // Next page from pagelink
    let next = "";
    let nextA = doc.select("a.next, .pagelink a.next");
    if (!nextA.isEmpty()) {
        next = String(n + 1);
    } else {
        // fallback: any link to a higher page number
        doc.select(".pagelink a").forEach(function (a) {
            let m = String(a.attr("href")).match(/\/reviews\/all\/(\d+)\.html/);
            if (m && parseInt(m[1], 10) > n) next = String(n + 1);
        });
    }

    return Response.success(items, next);
}
