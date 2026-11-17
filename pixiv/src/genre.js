// Thể loại = tag Pixiv (nội dung R-18). Mỗi tag mở bằng homer18.js (tìm chế độ r18, khớp đúng tag).
//
// Có 2 nguồn tag:
//   1. Danh sách có sẵn (BUILTIN bên dưới) — hiện để trống; có thể điền sẵn các tag đi kèm bản cài.
//   2. Tag của bạn, thêm trong Cài đặt extension:
//        - "Tag của bạn": thêm/sửa/xóa từng tag (lưu trong localDatabase, khóa = tag nên không thể trùng).
//        - "Thêm hàng loạt tag": dán nhiều tag cách nhau bằng dấu phẩy hoặc xuống dòng.
//          Chỉ nhập khi nội dung ô này THAY ĐỔI; tag đã có (kể cả trùng chữ hoa/thường hay trùng danh sách
//          có sẵn) được bỏ qua và đếm là "trùng". Xóa một tag khỏi "Tag của bạn" thì nó không tự quay lại.
// Danh sách hiển thị luôn được bỏ trùng; tag của bạn xếp trước.
load("config.js");

var BUILTIN = [];

var TABLE = "custom_tags";

// Khóa so sánh để bỏ trùng: bỏ khoảng trắng thừa, không phân biệt hoa/thường (chữ Latin)
function normKey(t) {
    return String(t).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").toLowerCase();
}

// Tách chuỗi dán vào thành danh sách tag (phẩy, phẩy Trung Quốc, 、, chấm phẩy, |, tab, xuống dòng)
function parseTags(text) {
    var out = [];
    String(text || "").split(/[\n\r,，、;；|\t]+/).forEach(function (s) {
        var t = s.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        if (t && t.length <= 60) out.push(t);
    });
    return out;
}

// Tag trong database. Trả null nếu database không dùng được (ví dụ lỗi cầu nối trên iOS).
function dbTags() {
    try {
        var rows = localDatabase.list("", TABLE);
        if (rows === null || rows === undefined) return null;
        var out = [];
        for (var i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i].key) out.push(String(rows[i].key));
        }
        return out;
    } catch (error) {
        return null;
    }
}

function readStore(key) {
    try {
        var v = localStorage.getItem(key);
        return v === null || v === undefined ? "" : String(v);
    } catch (error) {
        return "";
    }
}
function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (error) {}
}

// Nhập hàng loạt khi nội dung ô "Thêm hàng loạt tag" thay đổi. Trả về báo cáo lần nhập gần nhất (hoặc null).
function importBulk(existingKeys) {
    var text = "";
    try { text = String(bulk_tags); } catch (error) { text = ""; }
    if (text === "undefined" || !text.replace(/\s+/g, "")) return readReport();
    if (text === readStore("bulk_last")) return readReport();

    var added = [], dups = [], seen = {};
    parseTags(text).forEach(function (t) {
        var k = normKey(t);
        if (existingKeys[k] || seen[k]) { dups.push(t); return; }
        seen[k] = 1;
        var ok = false;
        try { ok = localDatabase.upsert("", TABLE, t, "1"); } catch (error) { ok = false; }
        if (ok) { added.push(t); existingKeys[k] = 1; } else { dups.push(t + " (không lưu được)"); }
    });

    var report = { added: added.length, dups: dups };
    writeStore("bulk_last", text);
    writeStore("bulk_report", JSON.stringify(report));
    return report;
}

function readReport() {
    var raw = readStore("bulk_report");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (error) { return null; }
}

function execute() {
    var builtinKeys = {};
    BUILTIN.forEach(function (t) { builtinKeys[normKey(t)] = 1; });

    // Tag của bạn đang có trong database
    var custom = dbTags();
    var existing = {};
    for (var k in builtinKeys) existing[k] = 1;
    (custom || []).forEach(function (t) { existing[normKey(t)] = 1; });

    var report = importBulk(existing);
    if (report) custom = dbTags() || custom;

    // Database không dùng được: vẫn hiển thị các tag trong ô nhập hàng loạt (không lưu lâu dài)
    if (custom === null) {
        try { custom = parseTags(String(bulk_tags)); } catch (error) { custom = []; }
    }

    var list = [], seen = {};
    function add(t) {
        var key = normKey(t);
        if (!key || seen[key]) return;
        seen[key] = 1;
        list.push({ title: t, input: t, script: "homer18.js" });
    }
    custom.forEach(add);
    BUILTIN.forEach(add);

    // Dòng tóm tắt lần nhập gần nhất; bấm vào để xem danh sách tag bị bỏ vì trùng
    if (report && (report.added > 0 || report.dups.length > 0)) {
        var detail = "Lần nhập gần nhất: thêm mới " + report.added + " tag, bỏ " + report.dups.length + " tag trùng." +
            (report.dups.length ? "\nTag trùng: " + report.dups.slice(0, 40).join(", ") + (report.dups.length > 40 ? " ..." : "") : "");
        list.unshift({
            title: "ℹ Nhập gần nhất: +" + report.added + " mới, " + report.dups.length + " trùng",
            input: detail,
            script: "info.js"
        });
    }

    return Response.success(list);
}
