export interface EstimateTemplate {
  category: string;
  items: {
    name: string;
    unit: string;
    unitPrice: number;
    note: string;
  }[];
}

export const estimateTemplates: EstimateTemplate[] = [
  {
    category: "仮設工事",
    items: [
      { name: "足場架設・解体（くさび式）", unit: "㎡", unitPrice: 850, note: "架面積" },
      { name: "飛散防止ネット", unit: "㎡", unitPrice: 180, note: "メッシュシート" },
      { name: "養生費", unit: "式", unitPrice: 35000, note: "ビニール・テープ等" },
      { name: "足場運搬費", unit: "式", unitPrice: 35000, note: "搬入搬出" },
      { name: "荷揚げ費", unit: "式", unitPrice: 20000, note: "屋上等への材料荷揚げ" },
    ],
  },
  {
    category: "防水工事 — ウレタン防水",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 250, note: "既存面洗浄" },
      { name: "ケレン（3種）", unit: "㎡", unitPrice: 400, note: "手工具による目荒らし" },
      { name: "ケレン（2種）", unit: "㎡", unitPrice: 1200, note: "電動工具による除去" },
      { name: "既存防水層撤去", unit: "㎡", unitPrice: 1000, note: "" },
      { name: "下地補修（クラック処理）", unit: "m", unitPrice: 800, note: "Uカットシーリング" },
      { name: "下地調整（不陸調整）", unit: "㎡", unitPrice: 400, note: "モルタル等" },
      { name: "プライマー塗布", unit: "㎡", unitPrice: 450, note: "ウレタン用プライマー" },
      { name: "ウレタン防水 密着工法", unit: "㎡", unitPrice: 5500, note: "ウレタン2層塗り（材工共）" },
      { name: "ウレタン防水 通気緩衝工法", unit: "㎡", unitPrice: 8000, note: "通気シート+ウレタン2層（材工共）" },
      { name: "トップコート塗布", unit: "㎡", unitPrice: 1500, note: "遮熱トップコート" },
      { name: "立上りウレタン防水", unit: "㎡", unitPrice: 6000, note: "立上り部（材工共）" },
      { name: "改修用ドレン設置", unit: "箇所", unitPrice: 12000, note: "ドレン金具+施工" },
      { name: "脱気筒設置", unit: "箇所", unitPrice: 12000, note: "通気緩衝工法用" },
      { name: "入隅シーリング処理", unit: "m", unitPrice: 700, note: "" },
      { name: "端末押え金物設置", unit: "m", unitPrice: 1500, note: "" },
    ],
  },
  {
    category: "防水工事 — 塩ビシート防水",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 250, note: "既存面洗浄" },
      { name: "既存シート撤去", unit: "㎡", unitPrice: 1000, note: "既存塩ビシート撤去" },
      { name: "ケレン（3種）", unit: "㎡", unitPrice: 400, note: "" },
      { name: "下地調整（不陸調整）", unit: "㎡", unitPrice: 400, note: "" },
      { name: "塩ビシート防水 機械固定工法", unit: "㎡", unitPrice: 6000, note: "ディスク固定+塩ビシート（材工共）" },
      { name: "塩ビシート防水 接着工法", unit: "㎡", unitPrice: 5500, note: "接着剤+塩ビシート（材工共）" },
      { name: "立上り塩ビシート防水", unit: "㎡", unitPrice: 6500, note: "立上り部（材工共）" },
      { name: "ジョイント部パッチ処理", unit: "m", unitPrice: 1200, note: "溶着・部分パッチ" },
      { name: "笠木オーバーブリッジ", unit: "m", unitPrice: 3500, note: "シーリング処理" },
      { name: "改修用ドレン設置", unit: "箇所", unitPrice: 12000, note: "ドレン金具+施工" },
      { name: "ステンレスバンド", unit: "m", unitPrice: 600, note: "末端固定" },
      { name: "端末押え金物設置", unit: "m", unitPrice: 1500, note: "" },
    ],
  },
  {
    category: "防水工事 — FRP防水",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 250, note: "" },
      { name: "ケレン（3種）", unit: "㎡", unitPrice: 400, note: "サンダー処理" },
      { name: "プライマー塗布", unit: "㎡", unitPrice: 500, note: "FRP用プライマー" },
      { name: "FRP防水（ガラスマット+ポリエステル樹脂）", unit: "㎡", unitPrice: 7000, note: "2プライ仕様（材工共）" },
      { name: "トップコート塗布", unit: "㎡", unitPrice: 1500, note: "FRP用トップコート" },
      { name: "立上りFRP防水", unit: "㎡", unitPrice: 7000, note: "（材工共）" },
      { name: "ドレン周り処理", unit: "箇所", unitPrice: 8000, note: "" },
    ],
  },
  {
    category: "防水工事 — アスファルト防水",
    items: [
      { name: "既存防水層撤去", unit: "㎡", unitPrice: 1200, note: "アスファルト防水撤去" },
      { name: "下地清掃・処理", unit: "㎡", unitPrice: 400, note: "" },
      { name: "アスファルト防水 トーチ工法", unit: "㎡", unitPrice: 7000, note: "改質アスファルトシート（材工共）" },
      { name: "アスファルト防水 常温工法", unit: "㎡", unitPrice: 6000, note: "自着シート（材工共）" },
      { name: "立上りアスファルト防水", unit: "㎡", unitPrice: 7000, note: "（材工共）" },
      { name: "改修用ドレン設置", unit: "箇所", unitPrice: 12000, note: "" },
      { name: "保護コンクリート打設", unit: "㎡", unitPrice: 3000, note: "必要に応じて" },
    ],
  },
  {
    category: "塗装工事 — 外壁塗装",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 250, note: "外壁面洗浄" },
      { name: "養生", unit: "㎡", unitPrice: 300, note: "窓・設備等" },
      { name: "ケレン（3種）", unit: "㎡", unitPrice: 400, note: "手工具" },
      { name: "下地補修（クラック処理）", unit: "m", unitPrice: 800, note: "Uカットシーリング" },
      { name: "下地補修（欠損部）", unit: "箇所", unitPrice: 2500, note: "モルタル充填" },
      { name: "シーリング撤去", unit: "m", unitPrice: 300, note: "既存シーリング撤去" },
      { name: "シーリング打替え", unit: "m", unitPrice: 950, note: "変成シリコン" },
      { name: "シーリング増し打ち", unit: "m", unitPrice: 650, note: "" },
      { name: "下塗り（シーラー）", unit: "㎡", unitPrice: 700, note: "浸透性シーラー" },
      { name: "下塗り（微弾性フィラー）", unit: "㎡", unitPrice: 900, note: "" },
      { name: "中塗り+上塗り（シリコン塗料）", unit: "㎡", unitPrice: 2800, note: "水性シリコン 耐用10〜15年" },
      { name: "中塗り+上塗り（フッ素塗料）", unit: "㎡", unitPrice: 4200, note: "フッ素樹脂 耐用15〜20年" },
      { name: "中塗り+上塗り（無機塗料）", unit: "㎡", unitPrice: 5000, note: "無機ハイブリッド 耐用20年〜" },
      { name: "中塗り+上塗り（ウレタン塗料）", unit: "㎡", unitPrice: 2000, note: "ウレタン樹脂 耐用8〜10年" },
    ],
  },
  {
    category: "塗装工事 — 屋根塗装",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 300, note: "屋根面洗浄" },
      { name: "タスペーサー設置", unit: "㎡", unitPrice: 400, note: "縁切り用（スレート屋根）" },
      { name: "下塗り（シーラー）", unit: "㎡", unitPrice: 700, note: "屋根用シーラー" },
      { name: "中塗り+上塗り（遮熱シリコン）", unit: "㎡", unitPrice: 3000, note: "遮熱シリコン" },
      { name: "中塗り+上塗り（遮熱フッ素）", unit: "㎡", unitPrice: 4500, note: "遮熱フッ素" },
      { name: "棟板金釘打ち・シーリング", unit: "m", unitPrice: 800, note: "" },
      { name: "棟板金交換", unit: "m", unitPrice: 4000, note: "下地含む" },
    ],
  },
  {
    category: "塗装工事 — 付帯部塗装",
    items: [
      { name: "軒天塗装", unit: "㎡", unitPrice: 1200, note: "ケンエース等" },
      { name: "雨樋塗装", unit: "m", unitPrice: 800, note: "" },
      { name: "破風板塗装", unit: "m", unitPrice: 1000, note: "" },
      { name: "鼻隠し塗装", unit: "m", unitPrice: 1000, note: "" },
      { name: "水切り塗装", unit: "m", unitPrice: 400, note: "" },
      { name: "幕板塗装", unit: "m", unitPrice: 1000, note: "" },
      { name: "雨戸・戸袋塗装", unit: "枚", unitPrice: 2800, note: "" },
      { name: "庇塗装", unit: "箇所", unitPrice: 2500, note: "" },
      { name: "手すり・鉄部塗装", unit: "m", unitPrice: 1000, note: "ケレン+錆止め+仕上げ" },
      { name: "基礎塗装", unit: "m", unitPrice: 800, note: "基礎部分" },
    ],
  },
  {
    category: "共通・その他",
    items: [
      { name: "材料運搬費", unit: "式", unitPrice: 25000, note: "資材搬入出" },
      { name: "廃材処分費（産廃）", unit: "式", unitPrice: 35000, note: "産業廃棄物処分" },
      { name: "散水試験", unit: "箇所", unitPrice: 15000, note: "雨漏り調査用" },
      { name: "現場管理費", unit: "式", unitPrice: 0, note: "工事金額の5〜10%" },
      { name: "諸経費", unit: "式", unitPrice: 0, note: "工事金額の5〜15%" },
      { name: "安全対策費", unit: "式", unitPrice: 0, note: "工事金額の1〜3%" },
    ],
  },
];

// デモ用の見積書データ（サンプルマンション 屋上防水工事）
export const demoEstimateItems = [
  { category: "仮設工事", name: "足場架設・解体（くさび式）", unit: "㎡", quantity: 250, unitPrice: 850, note: "架面積" },
  { category: "仮設工事", name: "飛散防止ネット", unit: "㎡", quantity: 250, unitPrice: 180, note: "メッシュシート" },
  { category: "仮設工事", name: "養生費", unit: "式", quantity: 1, unitPrice: 35000, note: "" },
  { category: "防水工事", name: "高圧洗浄", unit: "㎡", quantity: 120, unitPrice: 250, note: "屋上面洗浄" },
  { category: "防水工事", name: "既存シート撤去", unit: "㎡", quantity: 120, unitPrice: 1000, note: "既存塩ビシート撤去" },
  { category: "防水工事", name: "ケレン（3種）", unit: "㎡", quantity: 120, unitPrice: 400, note: "目荒らし" },
  { category: "防水工事", name: "下地調整（不陸調整）", unit: "㎡", quantity: 120, unitPrice: 400, note: "" },
  { category: "防水工事", name: "塩ビシート防水 機械固定工法", unit: "㎡", quantity: 120, unitPrice: 6000, note: "ディスク固定+塩ビシート（材工共）" },
  { category: "防水工事", name: "立上り塩ビシート防水", unit: "㎡", quantity: 30, unitPrice: 6500, note: "立上り部（材工共）" },
  { category: "防水工事", name: "笠木オーバーブリッジ", unit: "m", quantity: 60, unitPrice: 3500, note: "シーリング処理" },
  { category: "防水工事", name: "改修用ドレン設置", unit: "箇所", quantity: 4, unitPrice: 12000, note: "ドレン金具+施工" },
  { category: "防水工事", name: "脱気筒設置", unit: "箇所", quantity: 3, unitPrice: 12000, note: "" },
  { category: "防水工事", name: "端末押え金物設置", unit: "m", quantity: 60, unitPrice: 1500, note: "" },
  { category: "共通", name: "材料運搬費", unit: "式", quantity: 1, unitPrice: 25000, note: "資材搬入出" },
  { category: "共通", name: "廃材処分費（産廃）", unit: "式", quantity: 1, unitPrice: 50000, note: "既存防水材処分" },
  { category: "共通", name: "諸経費", unit: "式", quantity: 1, unitPrice: 150000, note: "" },
];
