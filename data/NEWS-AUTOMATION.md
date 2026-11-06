# 新闻采集、审核与发布

来源仅限 SiTime 原厂 `https://www.sitime.com` 的新闻稿与博客。每天北京时间 09:00 计划运行（GitHub 可能延迟），也可以在 Actions 中手动运行 **Collect SiTime news for review**。

采集读取英文 sitemap，并检查新闻首页的新入口。按规范化原文 URL 去重；已发布和已拒绝的项目不会重复进入队列。每次最多抓取 30 篇，积压留到下一次。网络或解析错误会使任务失败，在 Actions 日志中保留错误；不会清空旧新闻。采集页面仅用于提取标题、发布日期与原厂图片链接，不存放新闻全文。

## 每次审核

机器人更新同一个 `automation/sitime-news-review` 分支并创建审核 PR。打开 `data/news-review` 中新增的 JSON：

1. 对照 `source` 核对标题、日期、图片与相关型号；图片可留空。
2. 填写中文标题及中英文原创摘要。不要直接复制原文段落。
3. 将 `status` 设为 `approved`，填写 `reviewedBy`；不发布则设为 `rejected`。
4. 本地运行 `python scripts/build_site.py --strict`，然后 `python -m http.server 8080 --directory dist` 检查页面。
5. PR 的 **Editorial review** 检查通过后，由人工合并至 `main`。待审核条目不会进入构建；严格检查会阻止仍有 pending 的 PR 通过。不要开启自动合并。

普通构建 `python scripts/build_site.py` 会跳过 pending/rejected；网站只加载构建后的 `content-data.js`，审核文件和采集脚本不会上传到网站。构建过程保留所有已发布新闻、产品和解决方案。

## 首次启用（仓库所有者）

当前文件必须先提交并推送到 GitHub 的 `main`，定时任务才会运行。Actions 必须启用，并在 Settings → Actions → General 中允许 GitHub Actions 创建拉取请求。机器人只需要仓库 contents / pull-requests 写权限。

建议在 Settings → Rules → Rulesets 中保护 `main`：要求 PR、至少一次人工批准以及 **Editorial review** 状态检查，禁止绕过。PR 自动使用仓库内置 `GITHUB_TOKEN`，不需要存储个人 GitHub 密钥。机器人通过内置 token 创建的 PR 不会自动触发另一个 workflow；审核者编辑提交 JSON 后会触发检查，也可在 Actions 中手动运行检查并选择该分支。

自动部署任选一种，避免重复部署：

- 使用本仓库提供的 GitHub 发布流程：在 GitHub Settings → Secrets and variables → Actions 添加 `NETLIFY_AUTH_TOKEN` 与 `NETLIFY_SITE_ID`，合并后自动上传 `dist/`。请通过 Secrets 页面填写，不要提交到代码或聊天中。缺少凭据时只生成构建产物，日志明确提示未部署。
- 或在 Netlify 连接 GitHub 仓库，生产分支 `main`，构建命令 `python3 scripts/build_site.py`，发布目录 `dist`；关闭 GitHub 的 Netlify 上传步骤。`netlify.toml` 已提供该构建配置。

目前 LiveCodes 预览是静态快照，不接收 GitHub 后续自动更新。自动更新的正式网址以 Netlify 项目发布地址为准。仅将文件保存在云工作区不会开启 GitHub 定时任务。

2026-10-29 实际采集验证发现原厂在 2026-10-27 发布的新博客 “What Is Frequency Stability Over Temperature?”。提取结果保存在 `data/news-discovery-example.json`，仅用于检查采集效果，未发布，也未冒充已审核条目。首次启用采集时将正式进入审核 PR。

## 验证

运行 `python -m unittest discover -s tests -v` 检查：待审核内容不会发布，已审核内容可进入页面，缺少翻译/审核人及非原厂链接会被拦截，重复文章不会重复发布。
