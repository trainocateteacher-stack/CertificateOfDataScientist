# CertificateOfDataScientist 受講者演習サイト

**Version: V4**

このフォルダーは「ビジネスパーソンのためのデータリテラシー入門」の受講者向け演習サイト V4 です。

## V3 の主な変更点
- 1ページ構成から複数ページ構成へ変更
- Excel風データ操作画面を追加
- テキストの章・ページに対応した確認問題を追加
- SQL Labを追加
- GROUP BYの処理を「並べ替え → 色分け → 集計」の順に可視化
- Python補助演習ページを追加

## ページ構成
- `index.html` : 章別ポータル
- `workbook.html` : Excel風データ操作
- `quiz.html` : 章別確認問題
- `sql.html` : SQL Lab
- `python.html` : Python補助演習

## データ
`data/` のファイルはすべて、研修用に生成した架空の合成データです（実在の施設・顧客ではありません）。

| ファイル | 内容 |
|---|---|
| `wait_times_raw.csv` / `wait_times_clean.csv` | アトラクション×時間帯の待ち時間（2026年4〜6月、3,600行）。raw は欠損と記録ミスを含む |
| `survey_raw.csv` / `survey_clean.csv` | 退園時アンケート（2025年・2026年の4〜6月、1人1行）。raw は架空の個人情報を含む |
| `daily_ops.csv` | 日別の運営記録（180行） |
| `theme_park_training_data.xlsx` | 上の5つの表、データ辞書、演習ガイド |

## SQL
`sql.html` とトップページ Module 11 では、[sql.js](https://github.com/sql-js/sql.js)（SQLite を WebAssembly でブラウザ上に動かすライブラリ、MIT ライセンス）を使って、入力した SQL をそのまま実行します。
sql.js 1.14.2 の本体は `assets/vendor/sql.js-1.14.2/` に同梱しているため、外部の CDN には接続しません。
テーブル：`wait_times`（= wait_times_clean）、`survey`（= survey_clean）、`daily_ops`、`students`・`club`（テキスト p.153）。

## Python
`python.html` の5つのグラフは、同梱の Plotly.js 4.1.1（MIT）で描くため、Python を動かさなくても全員が操作できます。
「Python で実行してみる」を押した人だけ、同梱の Pyodide 0.29.5（MPL-2.0、ブラウザで動く Python）と pandas・numpy・plotly 7.1.0 を読み込みます（初回 約30MB）。
外部の CDN には接続しません。同梱した部品とライセンスの一覧は `assets/vendor/pyodide-0.29.5/NOTICE.txt` にあります。

サイトは CSV を読み込むため、ファイルを直接開く（file://）と動きません。公開サイトか、`python3 -m http.server` などのローカルサーバーで開いてください。

## Cloudflare Pages
静的サイトとして公開できます。
- Framework preset: None
- Build command: 空欄
- Build output directory: `/`

## Version History
| Version | 内容 |
|---|---|
| V1 | 初期版。1ページ型の受講者サイト |
| V2 | 複数ページ化、Excel風UI、テキスト連動問題、SQL Labを追加 |
| V3 | 上の「V3 の主な変更点」を参照 |
| **V4** | **データを1本化（待ち時間・アンケート・日別運営）し、「満足度低下の調査」という案件の物語で12モジュールを再構成。SQL を sql.js（本物の SQLite）に置き換え。Python ページを Plotly.js のグラフ＋ブラウザで動く Python（Pyodide）に** |
