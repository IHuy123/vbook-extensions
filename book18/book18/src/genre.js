load('config.js');
function execute() {
    let genres = [
        { title: "都市激情", input: "/category/15", script: "cate.js" },
        { title: "家庭亂倫", input: "/category/6", script: "cate.js" },
        { title: "人妻交換", input: "/category/18", script: "cate.js" },
        { title: "另類小說", input: "/category/17", script: "cate.js" },
        { title: "校園春色", input: "/category/16", script: "cate.js" },
        { title: "亂倫文學", input: "/category/23", script: "cate.js" },
        { title: "學生校園", input: "/category/4", script: "cate.js" },
        { title: "人妻熟女", input: "/category/11", script: "cate.js" },
        { title: "都市生活", input: "/category/5", script: "cate.js" },
        { title: "人妻文學", input: "/category/25", script: "cate.js" },
        { title: "另類文學", input: "/category/21", script: "cate.js" },
        { title: "強暴虐待", input: "/category/7", script: "cate.js" },
        { title: "動漫改編", input: "/category/13", script: "cate.js" },
        { title: "武俠科幻", input: "/category/9", script: "cate.js" },
        { title: "名人明星", input: "/category/12", script: "cate.js" },
		{ title: "變身系列", input: "/category/8", script: "cate.js" },
		{ title: "經驗故事", input: "/category/10", script: "cate.js" },
		{ title: "另類其它", input: "/category/14", script: "cate.js" },
		{ title: "學園文學", input: "/category/22", script: "cate.js" },
		{ title: "短篇文學", input: "/category/24", script: "cate.js" },
		{ title: "性知識", input: "/category/31", script: "cate.js" },
		{ title: "制服文學", input: "/category/27", script: "cate.js" },
		{ title: "正妹文學", input: "/category/28", script: "cate.js" },
		{ title: "武俠文學", input: "/category/26", script: "cate.js" },
		{ title: "異國文學", input: "/category/30", script: "cate.js" },
		{ title: "未分類文章", input: "/category/20", script: "cate.js" },
		{ title: "3P文學", input: "/category/29", script: "cate.js" },
		{ title: "亂倫文章", input: "/category/19", script: "cate.js" }
    ];

    // Keywords: appended after the categories, prefixed with "# ".
    let response = fetch(BASE_URL + "/node/keywords");
    if (response.ok) {
        let seen = {};
        response.html().select('a[href*="/node/index?q="]').forEach(function (a) {
            let title = a.text().trim();
            let href = a.attr("href");
            if (!title || !href || seen[href]) return;
            seen[href] = true;
            genres.push({
                title: title,
                input: href.replace(/^https?:\/\/[^\/]+/, ""),
                script: "keyword.js"
            });
        });
    }
    return Response.success(genres);
}
