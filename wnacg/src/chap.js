load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    let aid = extractAid(url);
    if (!aid) return Response.error("Cannot extract aid");

    // photos-item-aid is the clean data source used by the modern slide reader.
    // Much smaller and cleaner than photos-gallery (no document.writeln escaping).
    let itemUrl = absUrl("/photos-item-aid-" + aid + ".html");
    let response = fetch(itemUrl);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let html = response.text();

    let images = [];

    // Primary: mReader.initData({"page_url":[...], ...}) — may contain trailing commas
    let startMark = '"page_url"';
    let idx = html.indexOf(startMark);
    if (idx !== -1) {
        let bracket = html.indexOf("[", idx);
        if (bracket !== -1) {
            let depth = 0;
            let end = -1;
            for (let j = bracket; j < html.length; j++) {
                let c = html.charAt(j);
                if (c === "[") depth++;
                else if (c === "]") {
                    depth--;
                    if (depth === 0) {
                        end = j + 1;
                        break;
                    }
                }
            }
            if (end > bracket) {
                let arrStr = html.substring(bracket, end);
                // strip trailing commas before ] so it is valid JSON
                arrStr = arrStr.replace(/,\s*]/g, "]");
                try {
                    let arr = JSON.parse(arrStr);
                    for (let i = 0; i < arr.length; i++) {
                        let u = arr[i];
                        if (!u) continue;
                        if (u.indexOf("/themes/") !== -1 || u.indexOf("shoucang") !== -1) continue;
                        // Prefer https for mixed-content safety
                        if (u.indexOf("http://") === 0) u = "https://" + u.substring(7);
                        images.push(u);
                    }
                } catch (e) {
                    // fall through to regex
                }
            }
        }
    }

    // Fallback: gallery page with escaped writeln
    if (images.length === 0) {
        let galleryUrl = absUrl("/photos-gallery-aid-" + aid + ".html");
        let gRes = fetch(galleryUrl);
        if (gRes.ok) {
            let gHtml = gRes.text();
            let re = /url:\s*fast_img_host\s*\+\s*\\"([^\\"]+)\\"/g;
            let m;
            while ((m = re.exec(gHtml)) !== null) {
                let u = m[1];
                if (u.indexOf("/themes/") !== -1 || u.indexOf("shoucang") !== -1) continue;
                images.push(absUrl(u));
            }
            if (images.length === 0) {
                re = /url:\s*fast_img_host\s*\+\s*"([^"]+)"/g;
                while ((m = re.exec(gHtml)) !== null) {
                    let u = m[1];
                    if (u.indexOf("/themes/") !== -1 || u.indexOf("shoucang") !== -1) continue;
                    images.push(absUrl(u));
                }
            }
        }
    }

    if (images.length === 0) {
        return Response.error("No images found");
    }

    // CDN blocks hotlink with default Referer (chapter URL).
    // Use no-referrer for reliable load. Fragment form is also accepted by the engine.
    let out = [];
    for (let i = 0; i < images.length; i++) {
        out.push({
            link: images[i],
            referrerpolicy: "no-referrer"
        });
    }
    return Response.success(out);
}
