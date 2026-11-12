/* ブラウザで動く Python（Pyodide）。外部の CDN には接続せず、assets/vendor/ に同梱したファイルだけを使う。
   ブラウザでは window.ParkPy、Node（試験）では module.exports。 */
(function (root) {
  "use strict";
  const PYODIDE_DIR = "assets/vendor/pyodide-0.29.5/";
  const PLOTLY_WHEEL = "plotly-7.1.0-py3-none-any.whl";
  const PACKAGES = ["pandas", "micropip", "narwhals", "packaging"];
  const CSVS = ["wait_times_raw", "wait_times_clean", "survey_raw", "survey_clean", "daily_ops"];

  // Python 側の準備：作業フォルダを data の親にし、fig.show() で図を JavaScript へ渡す
  const SETUP_PY = `
import os, json
os.chdir("/home/pyodide")
import plotly.io as pio
import plotly.basedatatypes as _bdt
_park_figs = []
def _park_show(self, *args, **kwargs):
    _park_figs.append(self.to_json())
_bdt.BaseFigure.show = _park_show
pio.templates.default = "plotly_white"
`;

  /** pyodide に CSV と plotly を入れる。getBytes(path) は Uint8Array を返す関数。 */
  async function prepare(pyodide, getBytes, base, onStatus) {
    const status = onStatus || (() => {});
    status("pandas などを読み込んでいます…");
    await pyodide.loadPackage(PACKAGES);
    status("データを用意しています…");
    pyodide.FS.mkdirTree("/home/pyodide/data");
    for (const n of CSVS) {
      pyodide.FS.writeFile(`/home/pyodide/data/${n}.csv`, await getBytes(`${base}data/${n}.csv`));
    }
    status("plotly を入れています…");
    pyodide.FS.writeFile(`/tmp/${PLOTLY_WHEEL}`, await getBytes(`${base}${PYODIDE_DIR}${PLOTLY_WHEEL}`));
    const micropip = pyodide.pyimport("micropip");
    await micropip.install(`emfs:/tmp/${PLOTLY_WHEEL}`, { deps: false });
    pyodide.runPython(SETUP_PY);
    status("準備ができました");
    return pyodide;
  }

  /** コードを実行し、print の出力・図（JSON 文字列）・エラーを返す */
  async function run(pyodide, code) {
    let out = "";
    pyodide.runPython("_park_figs.clear()");
    try {
      // 部品の読み込みメッセージは受講者の出力に混ぜない
      await pyodide.loadPackagesFromImports(code, { messageCallback: () => {}, errorCallback: () => {} });
      pyodide.setStdout({ batched: (s) => { out += s + "\n"; } });
      pyodide.setStderr({ batched: (s) => { out += s + "\n"; } });
      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined && result !== null && out === "") out = String(result);
      const figs = pyodide.globals.get("_park_figs").toJs();
      return { ok: true, out, figs: Array.from(figs) };
    } catch (e) {
      const msg = String(e.message || e);
      const last = msg.trim().split("\n").filter(Boolean).pop() || msg;
      return { ok: false, out, figs: [], error: last, hint: hint(last) };
    }
  }

  function hint(line) {
    let m;
    if ((m = line.match(/KeyError: '?([^']*)'?/))) return `列「${m[1]}」が見つかりません。df.columns で列名を確かめてください。`;
    if ((m = line.match(/NameError: name '([^']*)' is not defined/))) return `「${m[1]}」がまだ作られていません。上のセルから順に実行するか、つづりを確かめてください。`;
    if (/SyntaxError|IndentationError/.test(line)) return "書き方（かっこ・引用符・字下げ）を確かめてください。";
    if (/FileNotFoundError/.test(line)) return "ファイルの場所を確かめてください。使えるのは data/wait_times_raw.csv などです。";
    if (/ModuleNotFoundError/.test(line)) return "このページで使えるのは pandas・numpy・plotly だけです。";
    return "エラーの最後の行を読んで、どこで止まったかを確かめましょう。";
  }

  let loading = null;
  /** ブラウザ用：Pyodide 一式を読み込んで準備する（1回だけ） */
  function load(onStatus) {
    if (loading) return loading;
    loading = (async () => {
      onStatus && onStatus("Python（約30MB）を読み込んでいます…初回は数十秒かかります");
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${PYODIDE_DIR}pyodide.js`;
        s.onload = resolve;
        s.onerror = () => reject(new Error("pyodide.js を読み込めませんでした"));
        document.head.appendChild(s);
      });
      const indexURL = new URL(PYODIDE_DIR, location.href).href;
      const pyodide = await root.loadPyodide({ indexURL });
      const getBytes = async (path) => {
        const r = await fetch(path);
        if (!r.ok) throw new Error(`${path} を読み込めませんでした（HTTP ${r.status}）`);
        return new Uint8Array(await r.arrayBuffer());
      };
      return prepare(pyodide, getBytes, "", onStatus);
    })();
    loading.catch(() => { loading = null; });
    return loading;
  }

  const api = { PYODIDE_DIR, PLOTLY_WHEEL, PACKAGES, CSVS, SETUP_PY, prepare, run, hint, load };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ParkPy = api;
})(this);
