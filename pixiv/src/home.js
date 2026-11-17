function execute() {
    return Response.success([
        { title: "中文", input: "中文", script: "homecontent.js" },
        { title: "原创", input: "原创", script: "homecontent.js" },
        { title: "小说", input: "小说", script: "homecontent.js" },
        { title: "百合", input: "百合", script: "homecontent.js" },
        { title: "言情", input: "言情", script: "homecontent.js" },
        { title: "关注的作品", input: "r18", script: "follow.js" },
        { title: "推荐作品", input: "r18", script: "discovery.js" }
    ]);
}
