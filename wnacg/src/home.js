load('config.js');
function execute() {
    return Response.success([
        { title: "最新", input: "/albums.html", script: "search.js" },
        { title: "同人誌·漢化", input: "/albums-index-cate-1.html", script: "search.js" },
        { title: "單行本·漢化", input: "/albums-index-cate-9.html", script: "search.js" },
        { title: "雜誌·漢化", input: "/albums-index-cate-10.html", script: "search.js" },
        { title: "Cosplay", input: "/albums-index-cate-3.html", script: "search.js" },
        { title: "排行榜", input: "/albums-favorite_ranking.html", script: "search.js" }
    ]);
}
