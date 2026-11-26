load('config.js');

// Genre list of https://sto9.com/novels/class  ->  /novels/class/{id}_{page}.html
var VI_NAMES = {
    "0": "Tất cả", "1": "Huyền huyễn", "2": "Tiên hiệp / Võ hiệp", "3": "Đô thị",
    "4": "Lịch sử / Quân sự", "5": "Khoa học viễn tưởng", "6": "Game / Thi đấu",
    "7": "Kinh dị / Linh dị", "8": "Ngôn tình", "9": "Đồng nhân / Anime", "10": "Thể loại khác"
};
var FALLBACK = ["全部分類", "玄幻奇幻", "武俠仙俠", "現代都市", "歷史軍事", "科幻小說", "遊戲競技", "恐怖靈異", "言情小說", "動漫同人", "其他類型"];

function label(id, zh) {
    return VI_NAMES[id] ? zh + " · " + VI_NAMES[id] : zh;
}

function execute() {
    let genres = [];
    let seen = {};

    // read the live list so new/renamed categories on the site show up automatically
    try {
        let response = fetch(BASE_URL + "/novels/class");
        if (response && response.ok) {
            response.html().select("a").forEach(function (el) {
                let m = String(el.attr("href")).match(/\/novels\/class\/(\d+)_1\.html/);
                let zh = String(el.text()).replace(/\s+/g, " ").trim();
                if (!m || !zh || seen[m[1]]) return;
                seen[m[1]] = true;
                genres.push({ id: parseInt(m[1], 10), title: label(m[1], zh), input: "/novels/class/" + m[1] + "_1.html", script: "list.js" });
            });
        }
    } catch (e) {
        Console.log("genre fetch failed: " + e);
    }

    if (genres.length === 0) {
        genres = FALLBACK.map(function (zh, i) {
            return { id: i, title: label(String(i), zh), input: "/novels/class/" + i + "_1.html", script: "list.js" };
        });
    }

    genres.sort(function (a, b) { return a.id - b.id; });
    return Response.success(genres.map(function (g) {
        return { title: g.title, input: g.input, script: g.script };
    }));
}
