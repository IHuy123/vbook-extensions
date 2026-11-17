load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);

    let htm = response.html().select("#content > p").html();
    htm = cleanHtml(htm)
        .replace(/<span[^>]*>[^<]*<\/span>/g, "")
        .replace(/book18\.org/g, "")
        .replace(/<\/?p>/g, "")
        .replace(/&(nbsp|amp|quot|lt|gt);/g, "");
    if (!htm) return Response.error("Không lấy được nội dung chương");
    return Response.success(htm);
}

function cleanHtml(html) {
    html = html.replace(/\n/g, '<br>');
    // remove duplicate br tags
    html = html.replace(/(<br>\s*){2,}/gm, '<br>');
    // strip html comments
    html = html.replace(/<!--[^>]*-->/gm, '');
    // html decode
    html = html.replace(/&nbsp;/g, '');
    // trim br tags
    html = html.replace(/(^(\s*<br>\s*)+|(<br>\s*)+$)/gm, '');

    return html.trim();
}
