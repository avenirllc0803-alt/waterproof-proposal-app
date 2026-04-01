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
      { name: "足場架設・解体", unit: "㎡", unitPrice: 800, note: "くさび式足場" },
      { name: "飛散防止ネット", unit: "㎡", unitPrice: 200, note: "メッシュシート" },
      { name: "養生（ビニール・テープ）", unit: "式", unitPrice: 30000, note: "" },
      { name: "仮設トイレ設置", unit: "式", unitPrice: 30000, note: "必要に応じて" },
    ],
  },
  {
    category: "防水工事 — ウレタン防水",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 300, note: "既存面洗浄" },
      { name: "下地処理・ケレン", unit: "㎡", unitPrice: 500, note: "既存防水層の目荒らし" },
      { name: "下地補修（クラック処理）", unit: "m", unitPrice: 800, note: "Uカットシーリング" },
      { name: "プライマー塗布", unit: "㎡", unitPrice: 400, note: "ウレタン用プライマー" },
      { name: "ウレタン防水 通気緩衝工法", unit: "㎡", unitPrice: 5500, note: "通気シート+ウレタン2層" },
      { name: "ウレタン防水 密着工法", unit: "㎡", unitPrice: 4500, note: "ウレタン2層塗り" },
      { name: "トップコート塗布", unit: "㎡", unitPrice: 800, note: "遮熱トップコート" },
      { name: "立上り防水", unit: "m", unitPrice: 3000, note: "ウレタン塗膜立上り" },
      { name: "ドレン改修", unit: "箇所", unitPrice: 8000, note: "改修ドレン取付" },
      { name: "脱気筒設置", unit: "箇所", unitPrice: 5000, note: "通気緩衝工法用" },
    ],
  },
  {
    category: "防水工事 — 塩ビシート防水",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 300, note: "既存面洗浄" },
      { name: "既存シート撤去", unit: "㎡", unitPrice: 800, note: "既存塩ビシート撤去" },
      { name: "下地処理・ケレン", unit: "㎡", unitPrice: 500, note: "" },
      { name: "塩ビシート防水 機械固定工法", unit: "㎡", unitPrice: 6500, note: "ディスク固定+塩ビシート" },
      { name: "塩ビシート防水 接着工法", unit: "㎡", unitPrice: 5800, note: "接着剤+塩ビシート" },
      { name: "ジョイント部パッチ処理", unit: "m", unitPrice: 1200, note: "溶着・部分パッチ" },
      { name: "立上りシート防水", unit: "m", unitPrice: 3500, note: "立上り塩ビシート" },
      { name: "笠木オーバーブリッジ", unit: "m", unitPrice: 2500, note: "シーリング処理" },
      { name: "ドレン改修", unit: "箇所", unitPrice: 8000, note: "改修ドレン取付" },
      { name: "ステンレスバンド", unit: "m", unitPrice: 600, note: "末端固定" },
    ],
  },
  {
    category: "防水工事 — FRP防水",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 300, note: "" },
      { name: "下地処理・ケレン", unit: "㎡", unitPrice: 500, note: "サンダー処理" },
      { name: "プライマー塗布", unit: "㎡", unitPrice: 500, note: "FRP用プライマー" },
      { name: "FRP防水（ガラスマット+ポリエステル樹脂）", unit: "㎡", unitPrice: 6000, note: "2プライ仕様" },
      { name: "トップコート塗布", unit: "㎡", unitPrice: 800, note: "FRP用トップコート" },
      { name: "立上り FRP防水", unit: "m", unitPrice: 3500, note: "" },
      { name: "ドレン周り処理", unit: "箇所", unitPrice: 5000, note: "" },
    ],
  },
  {
    category: "防水工事 — アスファルト防水",
    items: [
      { name: "既存防水撤去", unit: "㎡", unitPrice: 1000, note: "���スファルト防水撤去" },
      { name: "下地清掃・処理", unit: "㎡", unitPrice: 500, note: "" },
      { name: "アスファルト防水 トーチ工法", unit: "㎡", unitPrice: 7000, note: "改質アスファルトシート" },
      { name: "アスファルト防水 常温工法", unit: "㎡", unitPrice: 6500, note: "自着シート" },
      { name: "立上り防水", unit: "m", unitPrice: 4000, note: "" },
      { name: "ドレン改修", unit: "箇所", unitPrice: 10000, note: "" },
      { name: "保護コンクリート打設", unit: "㎡", unitPrice: 3000, note: "必要に応じて" },
    ],
  },
  {
    category: "塗装工事 — 外壁塗装",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 250, note: "外壁面洗浄" },
      { name: "下地補修（クラック処理）", unit: "m", unitPrice: 800, note: "Uカットシーリング" },
      { name: "下地補修（欠損部）", unit: "箇所", unitPrice: 2000, note: "モルタル充填" },
      { name: "シーリング打替え", unit: "m", unitPrice: 900, note: "変成シリコン" },
      { name: "シーリング増し打ち", unit: "m", unitPrice: 600, note: "" },
      { name: "下塗り（シーラー）", unit: "㎡", unitPrice: 600, note: "浸透性シーラー" },
      { name: "中塗り（シリコン塗料）", unit: "㎡", unitPrice: 900, note: "水性シリコン" },
      { name: "上塗り（シリコン塗料）", unit: "㎡", unitPrice: 900, note: "水性シリコン" },
      { name: "中塗り（フッ素塗料）", unit: "㎡", unitPrice: 1500, note: "フッ素樹脂塗料" },
      { name: "上塗り（フッ素塗料）", unit: "㎡", unitPrice: 1500, note: "フッ素樹脂塗料" },
      { name: "中塗り（無機塗料）", unit: "㎡", unitPrice: 2000, note: "無機ハイブリッド" },
      { name: "上塗り（無機塗料）", unit: "㎡", unitPrice: 2000, note: "無機ハイブリッド" },
    ],
  },
  {
    category: "塗装工事 — 屋根塗装",
    items: [
      { name: "高圧洗浄", unit: "㎡", unitPrice: 300, note: "屋根面洗浄" },
      { name: "タスペーサー設置", unit: "㎡", unitPrice: 400, note: "縁切り用（スレート屋根）" },
      { name: "下塗り（シーラー）", unit: "㎡", unitPrice: 700, note: "屋根用シーラー" },
      { name: "中塗り（シリコン塗料）", unit: "㎡", unitPrice: 1000, note: "遮熱シリコン" },
      { name: "上塗り（シリコン塗料）", unit: "㎡", unitPrice: 1000, note: "遮熱シリコン" },
      { name: "棟板金釘打ち・シーリング", unit: "m", unitPrice: 800, note: "" },
    ],
  },
  {
    category: "塗装工事 — 付帯部塗装",
    items: [
      { name: "軒天塗装", unit: "㎡", unitPrice: 1200, note: "ケンエース等" },
      { name: "雨樋塗装", unit: "m", unitPrice: 800, note: "" },
      { name: "破風板塗装", unit: "m", unitPrice: 900, note: "" },
      { name: "鼻隠し塗装", unit: "m", unitPrice: 900, note: "" },
      { name: "水切り塗装", unit: "m", unitPrice: 600, note: "" },
      { name: "幕板塗装", unit: "m", unitPrice: 900, note: "" },
      { name: "雨戸・戸袋塗装", unit: "枚", unitPrice: 2500, note: "" },
      { name: "庇塗装", unit: "箇所", unitPrice: 3000, note: "" },
      { name: "手すり・鉄部塗装", unit: "m", unitPrice: 1000, note: "ケレン+錆止め+仕上げ" },
      { name: "基礎塗装", unit: "m", unitPrice: 800, note: "基礎部分" },
    ],
  },
  {
    category: "共通・その他",
    items: [
      { name: "運搬費", unit: "式", unitPrice: 30000, note: "資材搬入出" },
      { name: "廃材処分費", unit: "式", unitPrice: 30000, note: "産業廃棄物処分" },
      { name: "散水試��", unit: "箇所", unitPrice: 15000, note: "雨漏り調査用" },
      { name: "現場管理費", unit: "式", unitPrice: 0, note: "工事金額の5〜10%" },
      { name: "諸経費", unit: "式", unitPrice: 0, note: "工事金額の5〜10%" },
    ],
  },
];

// デモ用の見積書データ
export const demoEstimateItems = [
  { category: "仮設工事", name: "足場架設・解体", unit: "㎡", quantity: 250, unitPrice: 800, note: "くさび式足場" },
  { category: "仮設工事", name: "飛散防止ネット", unit: "㎡", quantity: 250, unitPrice: 200, note: "メッシュシート" },
  { category: "仮設工事", name: "養生（ビニール・テープ）", unit: "式", quantity: 1, unitPrice: 30000, note: "" },
  { category: "防水工事", name: "高圧洗浄", unit: "㎡", quantity: 120, unitPrice: 300, note: "屋上面洗浄" },
  { category: "防水工事", name: "下地処理・ケレン", unit: "㎡", quantity: 120, unitPrice: 500, note: "既存防水層の目荒らし" },
  { category: "防水工事", name: "既存シート撤去", unit: "㎡", quantity: 120, unitPrice: 800, note: "既存塩ビシート撤去" },
  { category: "防水工事", name: "塩ビシート防水 機械固定工法", unit: "㎡", quantity: 120, unitPrice: 6500, note: "ディスク固定+塩ビシート" },
  { category: "防水工事", name: "立上りシート防水", unit: "m", quantity: 60, unitPrice: 3500, note: "立上り塩ビシート" },
  { category: "防水工事", name: "笠木オーバーブリッジ", unit: "m", quantity: 60, unitPrice: 2500, note: "シーリング処理" },
  { category: "防水工事", name: "ドレン改修", unit: "箇所", quantity: 4, unitPrice: 8000, note: "改修ドレン取付" },
  { category: "防水工事", name: "脱気筒設置", unit: "箇所", quantity: 3, unitPrice: 5000, note: "" },
  { category: "共通", name: "運搬費", unit: "式", quantity: 1, unitPrice: 30000, note: "資材搬入出" },
  { category: "共通", name: "廃材処分費", unit: "式", quantity: 1, unitPrice: 50000, note: "産業廃棄物処分" },
  { category: "共通", name: "諸経費", unit: "式", quantity: 1, unitPrice: 100000, note: "" },
];
