# 共有ボタン修正 申し送り書 — 2026/04/05

## 修正したこと

### 対象ファイル
- `src/components/SharePdfModal.tsx`（コミット: `1cfabdd`）

### 修正内容（3点）

#### 1. PDF再生成ループの解消（最重要の修正）
- **問題**: `generatePdfBlob`関数が親コンポーネント（estimate/invoice/preview）で`useCallback`に囲まれておらず、毎レンダリングで新しい関数参照が作られていた。SharePdfModal内の`preGeneratePdf`がこれに依存していたため、モーダルが開いている間ずっとPDFが再生成され続けた。
- **症状**: モーダル内のボタンが「PDF準備中...」と「送信方法を選んでください」を行き来する。ボタンがdisabled/enabledを繰り返し、タップしても反応しないように見える。
- **修正**: `generatePdfBlobRef`（useRef）で最新の関数を参照し、`preGeneratePdf`のuseCallback依存を空にした。これでモーダルを開いたときに1回だけPDFを生成する。

#### 2. shareNative/shareViaMailの二重実行防止
- **問題**: 「LINE・アプリで共有」「メールで送る」を押したとき、`sharing`状態が設定されなかった。連打すると同じ処理が複数回走る。
- **修正**: 両関数の冒頭に`if (sharing) return; setSharing(true);`を追加。try/finallyで確実にfalseに戻す。

#### 3. PDF事前生成の二重実行防止
- **問題**: `preGeneratePdf`が複数回呼ばれると、最初に`cachedBlobRef.current = null`にするため、進行中のキャッシュが消える。
- **修正**: `generatingRef`で生成中かどうかをチェックし、二重実行をブロック。

## 未修正・残課題

### 実機テストが必要
- 今回の修正はコードの静的分析で発見した問題。実機（特にiOS Safari、Android Chrome）での確認がまだ。
- テスト手順:
  1. 見積書をデモデータで作成 → プレビュー → 「共有・送信」をタップ
  2. モーダルが開いて「PDF準備中...」→「送信方法を選んでください」に1回だけ遷移することを確認
  3. 「LINE・アプリで共有」をタップ → 共有シートが表示されることを確認
  4. 連打しても二重に処理が走らないことを確認

### ~~親コンポーネント側のgeneratePdfBlobのメモ化~~ → **対応済み（2026-04-05）**
- estimate/invoice/previewの3ファイルで`generatePdfBlob`を`useCallback(fn, [])`でメモ化済み。
- invoice/page.tsxには`useCallback`のimportも追加済み。
- これによりSharePdfModal側のref回避策と合わせて、PDF再生成ループの根本原因を完全に解消。

### ~~downloadPdfの連打防止~~ → **対応済み（2026-04-05）**
- `downloadPdf`関数に`if (sharing) return;`ガードを追加済み。

### Web Share APIのブラウザ互換性
- `navigator.canShare({ files: [...] })` はiOS 15+, Android Chrome 76+で対応。
- PC Chrome（Windows/Mac）ではWeb Share APIがファイル共有に非対応の場合あり → フォールバックでダウンロードのみになる（現在の実装で正しく動作する）。

### mailto:の制約
- `mailto:`スキームではPDFファイルを添付できない（全OS共通の仕様）。
- 「メールで送る」は「PDFをダウンロード」+「メール作成画面を開く」の2ステップになる。ユーザーが手動で添付する必要あり。

## 追加修正（2026-04-05 AI-Managementセッションから）

### 修正4: downloadPdfに二重実行防止ガード追加
- **ファイル**: `src/components/SharePdfModal.tsx`
- **修正**: `downloadPdf`関数の冒頭に`if (sharing) return;`を追加。shareNative/shareViaMailと同じパターン。

### 修正5-7: 親3ファイルのgeneratePdfBlobをuseCallback化
- **ファイル**: `estimate/page.tsx`, `invoice/page.tsx`, `preview/page.tsx`
- **修正**: `const generatePdfBlob = async () => ...` → `const generatePdfBlob = useCallback(async () => ..., [])`
- **理由**: previewRefはref（安定参照）なので依存配列は空でOK。これにより毎レンダリングで新しい関数参照が作られる根本原因を解消。
- **invoice/page.tsx**: `useCallback`のimportも追加（estimate/previewは既にimport済みだった）。

## MCPレジストリ調査結果（2026-04-05）

見積書・請求書・PDF生成に特化したMCPコネクタは現時点でレジストリに未登録。
検索キーワード: invoice, estimate, PDF, document generation, proposal, construction, waterproof, puppeteer, html render, screenshot, print → すべて結果なし。

**現在のhtml2canvas + jsPDF方式が現実的なベストプラクティス**。将来的に以下が出てきたら検討：
- Puppeteer/Playwright系のPDF生成MCP（ヘッドレスブラウザでHTML→PDF）
- テンプレートエンジン系（Docxtemplater等）のMCP

## 関連ファイル
| ファイル | 役割 |
|---------|------|
| `src/components/SharePdfModal.tsx` | 共有モーダルUI + 共有ロジック |
| `src/app/estimate/page.tsx` | 見積書（generatePdfBlob定義あり・useCallback化済み） |
| `src/app/invoice/page.tsx` | 請求書（generatePdfBlob定義あり・useCallback化済み） |
| `src/app/preview/page.tsx` | 提案書プレビュー（generatePdfBlob定義あり・useCallback化済み） |
