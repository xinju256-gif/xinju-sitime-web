# 独立详情页与 SEO 构建

`python scripts/build_site.py --strict` 输出完整静态站到 `dist/`，不需要服务端框架。详情正文、参数、相关型号和 PDF 链接均直接写入 HTML；关闭 JavaScript 也能阅读。首页保留品牌、技术资源和咨询内容；产品、方案、资料下载和新闻通过独立页面访问。

## 地址

- 产品：`/products/sit8008/`
- 方案：`/solutions/microwave-outdoor-units-odu-timing-solutions/`
- 行业：`/industries/automotive/`
- 新闻：`/news/<id>/`
- 英文：在上述路径前添加 `/en`。
- 资料下载：`/downloads/` 和 `/en/downloads/`，支持型号、参数、类别与资料状态筛选。
- 对应目录：`/products/`、`/solutions/`、`/industries/`、`/news/`，英文目录同样使用 `/en` 前缀。

当前数据生成 554 个中文详情和 554 个英文详情，共 1,108 个详情页，加上 10 个双语目录页（包括中英文下载中心）及首页，sitemap 共 1,119 个网址。未来审核通过的新闻在同一次构建中自动生成页面并加入 sitemap。

## 正式域名

在 `data/site-config.json` 中填写 `site_url`，或使用 `SITE_URL=https://你的正式域名` 覆盖后构建。必须使用完整 HTTPS 主域名，不带路径、查询或片段；协议及输入格式会校验。尚未确认自定义域名时的 Netlify 地址仅用于开发校验，不应当作最终自定义域名包发布。

已确认正式域名为 `https://sitime-cn.com`，配置中的 `site_url` 已填写，`require_custom_domain` 保持开启。构建统一生成该域名下的 canonical、hreflang、结构化数据和 sitemap。若使用环境变量 `SITE_URL` 覆盖，请保持与正式域名一致。

构建会统一生成：

- 首页及每个详情、目录页的自引用 canonical。
- 独立 Title、Description、Open Graph 元数据；同名历史新闻附加日期，避免重复。
- 中英文双向 hreflang 与 x-default。
- Organization、WebSite、BreadcrumbList，以及 Product、TechArticle、NewsArticle/BlogPosting、CollectionPage 结构化数据。
- `robots.txt` 和 `sitemap.xml`。确认页不进入 sitemap 并设置 noindex。

产品结构化数据不编造价格、库存、评论或评分。新闻采用本站原创导读，不提供原厂全文转载。已知原始资讯日期在页面中明确标注，不把构建日期伪装为新闻发布日期。

## 验证与部署

```bash
python -m unittest discover -s tests -v
python scripts/build_site.py --strict
python scripts/check_static_seo.py
python -m http.server 8080 --directory dist
```

SEO 检查覆盖 sitemap 中全部页面、唯一标题和描述、H1、canonical、JSON-LD、双向语言链接与本地资源路径。GitHub 发布工作流已加入该检查。

Netlify 发布目录必须是 `dist`，不需要把所有路径重写到首页；应直接返回各目录的 `index.html`。手动部署时上传完整 `dist` 文件夹。首页旧的 `#read/...`、`#products`、`#applications`、`#downloads` 和 `#news` 链接自动转到对应独立页面；技术资源与邮件咨询弹窗保留。

LiveCodes 单页分享不提供多文件 HTTP 路由，保留原有弹窗预览。独立页面应在静态服务器或 Netlify 部署后检查，不能拿 LiveCodes 的单页网址替代正式独立路径。
