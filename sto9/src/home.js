// Home tabs: reviews first, then rankings + one tab per genre.
// Ranking / genre tabs are served by list.js; reviews by reviews.js.
function execute() {
    return Response.success([
        { title: "書評", input: "/reviews/all", script: "reviews.js" },
        { title: "人氣榜", input: "/novels/weekvisit_0_0_1.html", script: "list.js" },
        { title: "推薦榜", input: "/novels/allvote_0_0_1.html", script: "list.js" },
        { title: "新書榜", input: "/novels/newhot_0_0_1.html", script: "list.js" },
        { title: "最近更新", input: "/novels/class/0_1.html", script: "list.js" },
        { title: "玄幻奇幻", input: "/novels/class/1_1.html", script: "list.js" },
        { title: "武俠仙俠", input: "/novels/class/2_1.html", script: "list.js" },
        { title: "現代都市", input: "/novels/class/3_1.html", script: "list.js" },
        { title: "歷史軍事", input: "/novels/class/4_1.html", script: "list.js" },
        { title: "科幻小說", input: "/novels/class/5_1.html", script: "list.js" },
        { title: "遊戲競技", input: "/novels/class/6_1.html", script: "list.js" },
        { title: "恐怖靈異", input: "/novels/class/7_1.html", script: "list.js" },
        { title: "言情小說", input: "/novels/class/8_1.html", script: "list.js" },
        { title: "動漫同人", input: "/novels/class/9_1.html", script: "list.js" },
        { title: "其他類型", input: "/novels/class/10_1.html", script: "list.js" }
    ]);
}
