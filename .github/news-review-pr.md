每天从 SiTime 原厂官网发现的新文章进入此队列，尚未发布。

请逐个检查 `data/news-review/*.json`：

- 对照 `source` 核对英文标题、发布日期、图片及型号。
- 撰写 `title.zh` 和 `summary.zh` / `summary.en`。摘要应为自行整理的简短导读，避免复制原文段落；保留原文入口。
- 通过的条目填入 `reviewedBy`，把 `status` 改为 `approved`。
- 不发布的条目把 `status` 改为 `rejected`，仍保留以防重复采集。
- 运行 `python scripts/build_site.py --strict`。浏览本地 `dist/` 后合并。

合并至默认分支触发网站构建；配置好 Netlify 凭据后自动部署。请勿启用自动合并。
