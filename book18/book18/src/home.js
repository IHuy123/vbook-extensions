function execute() {
    return Response.success([
        { title: "主页", input: "/", script: "up.js" },
        { title: "最多", input: "/?sort=hits", script: "up.js" },
        { title: "最火", input: "/?sort=views", script: "up.js" },
        { title: "推薦", input: "/?sort=score", script: "up.js" },
        { title: "最好", input: "/?sort=likes", script: "up.js" }
    ]);
}
