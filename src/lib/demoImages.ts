// デモ用の画像パスを返す

const demoImagePaths = [
  "/demo/1.jpg", // 屋上防水劣化
  "/demo/2.jpg", // 鉄部錆・塗膜剥離
  "/demo/3.jpg", // バルコニー防水劣化
  "/demo/4.jpg", // コンクリートひび割れ
];

export function createDemoImage(index: number): string {
  return demoImagePaths[index % demoImagePaths.length];
}
