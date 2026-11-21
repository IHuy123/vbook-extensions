load('config.js');
function execute(input, page) {
    input = input || "";
    page = page || "1";
    page = String(page);

    let url = input;
    if (url.indexOf("http") !== 0) {
        url = absUrl(url);
    }
    if (parseInt(page, 10) > 1) {
        return Response.success([], "");
    }

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = [];
    doc.select(".plItem").forEach(function (el) {
        let nameEl = el.select(".plName").first();
        let timeEl = el.select(".plTime").first();
        let textEl = el.select(".plText").first();
        let av = el.select("img.plAv, .plAv").first();

        let avatar = "";
        if (av) {
            avatar = av.attr("src") || "";
            if (avatar && avatar.indexOf("http") !== 0 && avatar.indexOf("//") !== 0) {
                avatar = absUrl("/" + avatar.replace(/^\//, ""));
            } else {
                avatar = absUrl(avatar);
            }
        }

        items.push({
            name: nameEl ? nameEl.text().trim() : "",
            avatar: avatar,
            content: textEl ? textEl.text().trim() : "",
            description: timeEl ? timeEl.text().trim() : "",
            replies: []
        });
    });

    return Response.success(items, "");
}
