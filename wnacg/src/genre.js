load('config.js');
function execute() {
    return Response.success([
		{ title: "全部最新", input: "/albums.html", script: "search.js" },
		{ title: "同人誌", input: "/albums-index-cate-5.html", script: "search.js" },
		{ title: "汉化", input: "/albums-index-cate-1.html", script: "search.js" },
		{ title: "日文", input: "/albums-index-cate-12.html", script: "search.js" },
		{ title: "English", input: "/albums-index-cate-16.html", script: "search.js" },
		{ title: "CG画集", input: "/albums-index-cate-2.html", script: "search.js" },
		{ title: "AI画集", input: "/albums-index-cate-37.html", script: "search.js" },
		{ title: "3D漫画", input: "/albums-index-cate-22.html", script: "search.js" },
		{ title: "Cosplay", input: "/albums-index-cate-3.html", script: "search.js" },
		{ title: "单行本", input: "/albums-index-cate-6.html", script: "search.js" },
		{ title: "单行本 - 汉化", input: "/albums-index-cate-9.html", script: "search.js" },
		{ title: "单行本 - 日文", input: "/albums-index-cate-13.html", script: "search.js" },
		{ title: "单行本 - English", input: "/albums-index-cate-17.html", script: "search.js" },
		{ title: "杂志&短篇", input: "/albums-index-cate-7.html", script: "search.js" },
		{ title: "杂志&短篇 - 汉化", input: "/albums-index-cate-10.html", script: "search.js" },
		{ title: "杂志&短篇 - 日文", input: "/albums-index-cate-14.html", script: "search.js" },
		{ title: "杂志&短篇 - English", input: "/albums-index-cate-18.html", script: "search.js" }		
    ]);
}
