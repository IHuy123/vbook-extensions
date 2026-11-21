load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let aid = extractAid(url);
    if (!aid) return Response.error("Cannot extract aid from URL");

    // Point chap at photos-item (clean JSON data). Slide page is UI-only.
    let itemUrl = absUrl("/photos-item-aid-" + aid + ".html");

    return Response.success([
        {
            name: "閱讀",
            url: itemUrl,
            description: "",
            lock: false,
            pay: false
        }
    ]);
}
