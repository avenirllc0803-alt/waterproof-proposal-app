// ヘルスチェック用
export const onRequestGet: PagesFunction = async () => {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
};
