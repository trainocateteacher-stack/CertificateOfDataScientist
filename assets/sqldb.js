/* ブラウザで動く本物の SQL（sql.js = SQLite）。SQL Lab ページとトップページ M11 で共通に使う。
   ブラウザでは window.ParkSQL、Node（試験）では module.exports。sql.js 本体は assets/vendor/ に同梱。 */
(function (root) {
  "use strict";
  const VENDOR = "assets/vendor/sql.js-1.14.2/";
  // テーブル名 → 読み込む CSV（data.js の loadTables の名前）
  const PARK_TABLES = { wait_times: "wait_times_clean", survey: "survey_clean", daily_ops: "daily_ops" };
  const KEYS = { students: "student_id", club: "club_id", wait_times: "record_id", survey: "response_id" };

  // スライド p.153 の students テーブルと club テーブル
  const STUDENTS = [
    { student_id: 101, l_name: "Suzuki", f_name: "Ichiro", birth_date: "2001/10/03", pref: "Osaka", height: 172.5, club_id: 30 },
    { student_id: 102, l_name: "Takahashi", f_name: "Jiro", birth_date: "1995/06/10", pref: "Hyogo", height: 181.7, club_id: 20 },
    { student_id: 103, l_name: "Tanaka", f_name: "Akiko", birth_date: "1997/02/19", pref: "Osaka", height: 161.8, club_id: 20 },
    { student_id: 104, l_name: "Yamamoto", f_name: "Hikari", birth_date: "1996/05/08", pref: "Nara", height: 148.2, club_id: 10 },
    { student_id: 105, l_name: "Ito", f_name: "Hiroshi", birth_date: "1995/09/10", pref: "Kyoto", height: 165.1, club_id: 20 },
    { student_id: 106, l_name: "Suzuki", f_name: "Akiko", birth_date: "1996/05/01", pref: "Hyogo", height: 171.8, club_id: 30 },
    { student_id: 107, l_name: "Tanaka", f_name: "Tsubasa", birth_date: "1997/03/31", pref: "Nara", height: 183.7, club_id: 10 },
    { student_id: 108, l_name: "Kitajima", f_name: "Kota", birth_date: "1995/12/20", pref: "Osaka", height: 176.3, club_id: 20 },
    { student_id: 109, l_name: "Suzuki", f_name: "Haruka", birth_date: "1996/10/10", pref: "Kyoto", height: 163.0, club_id: 10 },
  ];
  const CLUB = [
    { club_id: 10, club_name: "Tennis" },
    { club_id: 20, club_name: "Baseball" },
    { club_id: 30, club_name: "Swimming" },
    { club_id: 40, club_name: "Judo" },
  ];

  function colType(values) {
    const v = values.filter((x) => x !== null && x !== undefined);
    if (v.length && v.every((x) => typeof x === "number")) return v.every(Number.isInteger) ? "INTEGER" : "REAL";
    return "TEXT";
  }

  function loadTable(db, name, rows) {
    const cols = Object.keys(rows[0]);
    const defs = cols.map((c) => `"${c}" ${colType(rows.map((r) => r[c]))}${KEYS[name] === c ? " PRIMARY KEY" : ""}`);
    db.run(`CREATE TABLE "${name}" (${defs.join(", ")})`);
    const stmt = db.prepare(`INSERT INTO "${name}" VALUES (${cols.map(() => "?").join(", ")})`);
    db.run("BEGIN");
    rows.forEach((r) => stmt.run(cols.map((c) => (r[c] === undefined ? null : r[c]))));
    db.run("COMMIT");
    stmt.free();
  }

  /** park: { wait_times_clean: rows, survey_clean: rows, daily_ops: rows } */
  function build(SQL, park) {
    const db = new SQL.Database();
    Object.entries(PARK_TABLES).forEach(([table, src]) => loadTable(db, table, park[src]));
    loadTable(db, "students", STUDENTS);
    loadTable(db, "club", CLUB);
    return db;
  }

  function hint(msg) {
    let m;
    if ((m = msg.match(/no such column: (\S+)/))) return `列「${m[1]}」はありません。テーブルの列名（SQL Lab の一覧やデータ辞書）を確かめてください。`;
    if ((m = msg.match(/no such table: (\S+)/))) return `テーブル「${m[1]}」はありません。使えるのは wait_times / survey / daily_ops / students / club です。`;
    if (/UNIQUE constraint failed/.test(msg)) return "同じキー（ID）の行がすでにあります。別の値にするか、UPDATE を使ってください。";
    if ((m = msg.match(/near "([^"]*)": syntax error/))) return `「${m[1]}」のあたりの書き方を確かめてください（つづり、カンマ、引用符 ' ' の閉じ忘れなど）。`;
    if (/incomplete input/.test(msg)) return "SQL が途中で終わっています。書き方（かっこや引用符の閉じ忘れ）を確かめてください。";
    if (/misuse of aggregate/.test(msg)) return "集計関数（AVG・COUNT など）の使い方を確かめてください。WHERE ではなく HAVING を使う場面かもしれません。";
    return "SQL の書き方を確かめてください。";
  }

  /** 1つ以上の SQL 文を実行する。結果のある文（SELECT）は results に順に入る。 */
  function run(db, sql) {
    const text = String(sql || "").trim();
    if (!text) return { ok: false, error: "empty", hint: "SQL を入力してください。" };
    try {
      const results = db.exec(text);
      const changes = db.getRowsModified();
      const m = text.match(/(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+"?(\w+)"?/i);
      return { ok: true, results, changes, touched: m ? m[1].toLowerCase() : null };
    } catch (e) {
      return { ok: false, error: e.message, hint: hint(e.message) };
    }
  }

  let sqlPromise = null;
  /** ブラウザ用：sql.js と CSV を読み込み、データベースを作って返す。読み込み済みの表（park）を渡すと再利用する。 */
  async function open(parkGiven) {
    if (!sqlPromise) {
      sqlPromise = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${VENDOR}sql-wasm.js`;
        s.onload = () => root.initSqlJs({ locateFile: (f) => `${VENDOR}${f}` }).then(resolve, reject);
        s.onerror = () => reject(new Error("sql.js を読み込めませんでした"));
        document.head.appendChild(s);
      });
    }
    const [SQL, park] = await Promise.all([sqlPromise, parkGiven || root.ParkData.loadTables(Object.values(PARK_TABLES))]);
    return { SQL, park, db: build(SQL, park) };
  }

  /** 結果を表の HTML にする（最大 maxRows 行） */
  function toTableHTML(res, maxRows = 200) {
    const esc = (v) => (v === null ? '<span class="sql-null">NULL</span>' : String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;"));
    const head = `<thead><tr>${res.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>`;
    const body = res.values.slice(0, maxRows).map((row) => `<tr>${row.map((v) => `<td>${esc(typeof v === "number" && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v)}</td>`).join("")}</tr>`).join("");
    return head + `<tbody>${body}</tbody>`;
  }

  const api = { PARK_TABLES, STUDENTS, CLUB, build, run, hint, open, toTableHTML };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ParkSQL = api;
})(this);
