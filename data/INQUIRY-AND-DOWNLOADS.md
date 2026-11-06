# 询价表单与集中下载中心

首页 `#downloads` 集中展示目录中的 137 个型号：117 份已验证原厂 PDF、20 个待补型号。支持中英文、型号/参数搜索、13 个类别、资料状态筛选、分页、查看参数与索取资料。下载动作复用产品目录的 `createDatasheetLink`；正式站读取本地 `assets/datasheets`，分享预览使用校验过的原厂 PDF 存储副本。

首页 `#contact` 参考 GXCAS 表单提供姓名、联系电话、公司、邮箱、型号、咨询类型、需求和信息使用同意字段；支持样品申请、选型、规格书和频率烧录咨询。姓名、电话、需求、同意项必填；邮箱选填且填写时校验格式。使用隐藏蜜罐字段降低机器人提交。不会在浏览器存储客户资料。

产品询价及缺失规格书入口会预填型号和咨询类型；仍保留邮件咨询及复制内容功能。提交失败保留填写内容。分享预览和本地开发不发送在线表单，不会显示在线提交成功。

## Netlify 启用

1. 部署完整 `dist`，确保 Netlify 项目已经启用 Forms 的表单检测。构建输出中的表单名为 `sitime-product-inquiry`，所有字段直接出现在 HTML 中，可供平台扫描。
2. 在 Netlify 构建时，环境变量 `NETLIFY=true` 会自动开启在线模式。GitHub 发布工作流通过 `SIMACITY_ENABLE_NETLIFY_FORMS=1` 开启在线模式；手动生成用于 Netlify Drop 的产物也可使用 `SIMACITY_ENABLE_NETLIFY_FORMS=1 python scripts/build_site.py --strict`。
3. 部署后到 Netlify 的 Forms 管理页面确认出现 `sitime-product-inquiry`，并在该表单的通知设置中将收件邮箱设为 `sales@simacity.com.cn`。邮箱通知是 Netlify 后台配置，代码无法代替该步骤；没有后台权限时不能宣称已经配置。
4. 使用自己的测试信息做一次真实提交，检查 Forms 后台记录和邮件通知。客户提交仅在平台返回成功后显示确认；平台返回失败或网络中断时保留输入，提示重试或邮件咨询。

开发构建 `python scripts/build_site.py --strict` 默认关闭在线模式。`inquiry-config.js` 不包含任何密钥。不要给 LiveCodes 等第三方静态分享预览开启在线收件模式，因为它不属于 Netlify 项目。

注意：无需在表单代码中写入收件邮箱作为隐藏 recipient 字段；Netlify 的实际通知邮箱需在后台设置。显示的联系邮箱及邮件备用收件人均为芯聚电子。
