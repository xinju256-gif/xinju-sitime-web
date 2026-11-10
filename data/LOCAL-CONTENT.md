# 站内阅读与路径审计

产品、行业、方案和新闻采用独立 HTML 详情页；旧 `#read/<kind>/<id>` 链接会自动跳转至对应页面。详情中不再提供原厂网站、参数来源网页或原图的跳转按钮。来源原地址继续保留在数据中用于内部溯源，不作为网页导航入口。

`reading-guide.js` 提供本站原创工程选型说明与新闻阅读提示，`site-assets.js` 只使用本站图片。原厂新闻并未全文转载；新闻导读和补充技术提示应在审核时核对。

运行 `python scripts/audit-local-paths.py` 生成 `data/link-migration-audit.csv` 和数量摘要，核对本地资产与首页锚点。目录、详情、下载中心及首页搜索跳转还需浏览器测试覆盖。

本地图片映射和校验记录：`data/local-assets.json`。分享预览的图片副本：`data/preview-images.json`，PDF 副本：`data/preview-documents.json`。正式构建不上传这类审计数据，只上传本地页面和 assets。
