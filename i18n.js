(() => {
  const translations = new Map([
    ['查找选型', 'Find a product'], ['下载规格书', 'Find a datasheet'],
    ['首页', 'Home'], ['产品中心', 'Products'],
    ["资料下载", "Downloads"],
    ["产品询价与技术咨询", "Product inquiries & technical support"],
    ["带 * 的项目为必填项。", "Fields marked * are required."],
    ["姓名 *", "Name *"],
    ["联系电话 *", "Phone *"],
    ["手机或座机号码", "Mobile or landline number"],
    ["公司名称", "Company"],
    ["您的公司名称", "Your company name"],
    ["产品 / 型号", "Product / model"],
    ["例如：SiT8008", "For example: SiT8008"],
    ["咨询类型", "Request type"],
    ["产品询价", "Product inquiry"],
    ["样品申请", "Sample request"],
    ["技术选型", "Technical selection"],
    ["索取规格书", "Request a datasheet"],
    ["频率烧录咨询", "Frequency programming"],
    ["咨询内容 *", "Requirements *"],
    ["请填写应用场景、频率、封装、预计数量及交期等需求", "Describe your application, frequency, package, quantity and required delivery date"],
    ["我同意芯聚电子为处理本次咨询使用上述信息。", "I agree that SIMACITY may use the information above to respond to this inquiry."],
    ["提交咨询", "Submit inquiry"],
    ["邮件咨询", "Email inquiry"],
    ["请勿填写此字段", "Leave this field empty"],
    ["如无法提交，请致电 021-62271972，或发送邮件至 sales@simacity.com.cn。", "If you cannot submit, call +86 21 6227 1972 or email sales@simacity.com.cn."],

    ['解决方案', 'Solutions'], ['新闻动态', 'News'],
    ['上海芯聚电子提供SiTime MEMS硅晶振、可编程振荡器、差分晶振、TCXO、OCXO等频率控制产品，支持型号查询、技术选型、规格书下载、替代型号推荐、现货询价及按需频率烧录服务。', 'Shanghai SIMACITY provides SiTime MEMS oscillators, programmable and differential oscillators, TCXOs and OCXOs, with model lookup, technical selection support, datasheet downloads, alternative model recommendations, stock inquiries and on-demand frequency programming.'],
    ['SiTime中国官方代理商 | MEMS硅晶振、振荡器、TCXO、OCXO | 上海芯聚电子', 'SiTime Authorized Distributor in China | MEMS Oscillators, TCXO, OCXO | Shanghai SIMACITY'],
    ['以精密计时，释放 AI 基础设施的无限潜能', 'Unlock the potential of AI infrastructure with precision timing'],
    ['探索应用', 'Explore applications'], ['芯聚电子 SIMACITY', 'SIMACITY'], ['芯聚电子 SIMACITY Logo', 'SIMACITY logo'], ['SiTime 首页', 'SiTime home'],
    ['打开导航', 'Open navigation'], ['关闭导航', 'Close navigation'], ['主导航', 'Main navigation'], ['产品', 'Products'], ['应用', 'Applications'], ['技术与创新', 'Technology'], ['资源中心', 'Resources'], ['关于我们', 'About us'], ['搜索产品', 'Search products'], ['联系我们', 'Contact us'],
    ['让每一刻，', 'Every moment,'], ['更', 'more '], ['精准。', 'precise.'], ['从微小的芯片，到改变世界的创新。', 'From tiny chips to world-changing innovation.'], ['以 MEMS 精密计时技术，驱动每一个关键时刻。', 'MEMS precision timing powers every critical moment.'], ['探索计时产品', 'Explore timing products'], ['了解我们的技术', 'Our technology'], ['为互联世界提供稳定的心跳', 'A reliable heartbeat for a connected world'], ['MEMS 精密计时芯片示意', 'MEMS precision timing chip illustration'], ['微小尺寸 · 卓越性能', 'Small footprint. Exceptional performance.'], ['时刻，保持领先', 'Stay ahead, every moment'], ['向下探索', 'Explore below'],
    ['小小芯片，', 'Small chips. '], ['连接无限可能。', 'Limitless possibilities.'], ['创新硅基计时技术', 'Innovative silicon timing'], ['精密 · 稳定', 'Precise. Stable.'], ['应对复杂应用环境', 'Built for demanding applications'], ['端到端', 'End to end'], ['全面的计时解决方案', 'Comprehensive timing solutions'], ['面向未来', 'Future ready'], ['赋能下一代电子系统', 'Enabling next-generation systems'],
    ['OUR PRODUCTS / 产品中心', 'OUR PRODUCTS'], ['为每一种创新，', 'The right rhythm'], ['找到精准的节拍。', 'for every innovation.'], ['从振荡器到时钟芯片，我们以灵活、可靠的计时解决方案，', 'From oscillators to clock ICs, our flexible, reliable timing solutions'], ['帮助您解决设计挑战，加速产品上市。', 'help solve design challenges and accelerate time to market.'], ['产品分类', 'Product categories'], ['全部产品', 'All products'], ['振荡器', 'Oscillators'], ['时钟芯片', 'Clock ICs'], ['谐振器', 'Resonators'],
    ['MEMS 振荡器', 'MEMS oscillators'], ['高稳定性、低抖动，为您的系统提供可靠的频率基准。', 'High stability and low jitter provide a reliable frequency reference for your system.'], ['探索振荡器', 'Explore oscillators'], ['灵活的时钟生成与分配，让复杂系统保持精准同步。', 'Flexible clock generation and distribution keep complex systems in sync.'], ['探索时钟芯片', 'Explore clock ICs'], ['MEMS 谐振器', 'MEMS resonators'], ['以先进硅基技术，为紧凑型设计带来更多可能。', 'Advanced silicon technology opens up new possibilities for compact designs.'], ['探索谐振器', 'Explore resonators'],
    ['TIMING EVERYWHERE / 应用领域', 'TIMING EVERYWHERE'], ['在每一个关键领域，', 'Empowering innovation'], ['让创新先行一步。', 'where it matters most.'], ['越是复杂的挑战，越需要精准的计时。', 'The greater the challenge, the more precision matters.'], ['探索精密计时如何连接当下，驱动未来。', 'Discover timing that connects today and powers tomorrow.'], ['AI 与数据中心', 'AI & data centers'], ['为高速计算与数据传输提供稳定节拍', 'Reliable timing for high-speed computing and data transfer'], ['汽车电子', 'Automotive'], ['为智能驾驶与车载互联提供可靠计时', 'Reliable timing for intelligent driving and connected vehicles'], ['通信与物联网', 'Communications & IoT'], ['让每一次连接，都实现精准同步', 'Precise synchronization for every connection'], ['工业与自动化', 'Industrial & automation'], ['从严苛环境到精密控制，始终稳定运行', 'Dependable operation, from harsh environments to precision control'],
    ['THE MEMS ADVANTAGE / 技术创新', 'THE MEMS ADVANTAGE'], ['重新定义计时。', 'Redefining timing.'], ['从一片硅开始。', 'Starting with silicon.'], ['将 MEMS、模拟电路与系统设计相结合，突破传统计时技术的边界。以更小的尺寸、更高的可靠性和更灵活的配置，满足不断演进的电子系统需求。', 'Combining MEMS, analog circuits and system design pushes the boundaries of traditional timing. Smaller footprints, greater reliability and flexible configuration meet the needs of evolving electronic systems.'], ['硅基 MEMS 技术', 'Silicon MEMS technology'], ['出色的环境适应能力', 'Resilience in demanding environments'], ['灵活的可编程架构', 'Flexible, programmable architecture'], ['探索技术资源', 'Explore technical resources'],
    ['KNOWLEDGE & INSIGHTS / 资源中心', 'KNOWLEDGE & INSIGHTS'], ['灵感、知识与下一步。', 'Ideas, insights and what comes next.'], ['设计指南', 'Design guide'], ['如何选择适合您应用的', 'How do you choose the right'], ['计时解决方案？', 'timing solution?'], ['从频率、稳定性到环境要求，了解选型关键。', 'Understand key selection criteria, from frequency and stability to environmental requirements.'], ['阅读指南 →', 'Read the guide →'], ['技术洞察', 'Technology insights'], ['认识 MEMS：', 'Meet MEMS:'], ['精密计时背后的创新', 'innovation behind precision timing'], ['探索微机电系统如何为电子设计带来新可能。', 'Explore how microelectromechanical systems enable new possibilities in electronics.'], ['了解更多 →', 'Learn more →'], ['工程支持', 'Engineering support'], ['让您的下一个设计，', 'Start your next design'], ['从容起步。', 'with confidence.'], ['整理设计需求，开启计时方案评估。', 'Define your requirements and begin evaluating timing solutions.'], ['查看设计清单 →', 'View the checklist →'],
    ['下一次突破，', 'Your next breakthrough'], ['从精准的起点开始。', 'starts with precision.'], ['告诉芯聚电子您的应用需求，一起探索合适的计时方案。', 'Tell SIMACITY about your application and explore the right timing solution.'], ['芯聚电子 · SIMACITY', 'SIMACITY'], ['上海市长宁区延安西路华敏翰尊国际 726 栋 22 楼 I 座', 'Suite I, 22/F, Building 726, Huamin Hanzun International, West Yan’an Road, Changning District, Shanghai, China'], ['您的称呼', 'Your name'], ['如何称呼您', 'How should we address you?'], ['工作邮箱', 'Work email'], ['应用需求', 'Application requirements'], ['例如：数据中心应用，需要低抖动时钟方案…', 'For example: a low-jitter clock solution for a data center…'], ['生成发给芯聚电子的邮件', 'Create email to SIMACITY'], ['收件人：芯聚电子 sales@simacity.com.cn。生成后可打开邮件客户端或复制内容；网页不会自动发送或保存您的信息。', 'To: SIMACITY, sales@simacity.com.cn. Open your email app or copy the draft. This page does not automatically send or store your information.'],
    ['SIMACITY / 芯聚电子', 'SIMACITY'], ['与芯聚电子一起，', 'Find your timing solution'], ['找到适合您的计时方案。', 'with SIMACITY.'], ['欢迎就 SiTime 计时产品、应用需求与选型问题联系芯聚电子。通过电话、邮件或企业二维码，开启您的方案沟通。', 'Contact SIMACITY to discuss SiTime products, application requirements and product selection. Start a conversation by phone, email or our company QR code.'], ['联系地址', 'Our address'], ['上海市长宁区延安西路华敏翰尊国际', 'Huamin Hanzun International, West Yan’an Road,'], ['726 栋 22 楼 I 座', 'Suite I, 22/F, Building 726, Changning, Shanghai, China'], ['芯聚电子企业二维码，扫码联系芯聚电子', 'SIMACITY company QR code — scan to contact us'], ['扫码联系芯聚电子', 'Scan to contact SIMACITY'], ['企业二维码', 'Company QR code'], ['芯聚电子 · 精密计时，驱动无限可能。', 'SIMACITY · Precision timing. Limitless possibilities.'], ['产品与技术', 'Products & technology'], ['计时产品', 'Timing products'], ['MEMS 技术', 'MEMS technology'], ['探索更多', 'Explore more'], ['应用领域', 'Applications'], ['设计资源', 'Design resources'], ['保持联系', 'Get in touch'], ['咨询方案', 'Discuss your application'], ['© 2026 芯聚电子 SIMACITY', '© 2026 SIMACITY'], ['SiTime 产品信息以官方资料为准 · 本站非 SiTime 官方网站', 'Refer to official SiTime documentation for product specifications. This is not the official SiTime website.'], ['返回顶部 ↑', 'Back to top ↑'],
    ['关闭弹窗', 'Close dialog'], ['关闭搜索', 'Close search'], ['寻找您的计时方案', 'Find your timing solution'], ['搜索产品或应用', 'Search products or applications'], ['试试“振荡器”或“汽车”', 'Try “oscillators” or “automotive”'], ['关闭联系方式', 'Close contact details'], ['产品咨询与选型沟通，欢迎联系芯聚电子。', 'Contact SIMACITY for product inquiries and selection support.'], ['联系电话', 'Telephone'], ['电子邮箱', 'Email'], ['芯聚电子企业二维码，扫码联系', 'SIMACITY company QR code — scan to contact us'],
    ['为系统提供稳定的频率基准，适用于通信、汽车、工业和消费电子等领域。', 'A stable frequency reference for communications, automotive, industrial and consumer electronics.'], ['选型关注：输出频率、频率稳定性、抖动与相位噪声。', 'Selection criteria: output frequency, frequency stability, jitter and phase noise.'], ['系统接口：确认供电电压、输出类型、封装尺寸和工作温度。', 'System interfaces: check supply voltage, output type, package size and operating temperature.'], ['具体型号和性能参数请以 SiTime 官方最新数据手册为准。', 'Refer to the latest official SiTime data sheets for specific models and performance specifications.'], ['通过时钟生成、分配和同步，为复杂系统提供协调一致的时序。', 'Clock generation, distribution and synchronization deliver coordinated timing for complex systems.'], ['明确输入参考时钟、输出通道数和所需频率。', 'Define the input reference clock, output channel count and required frequencies.'], ['评估系统抖动预算、同步需求和接口标准。', 'Evaluate the system jitter budget, synchronization needs and interface standards.'], ['利用硅基微机电结构产生稳定谐振，为计时系统提供基础。', 'Silicon microelectromechanical structures generate stable resonance as a foundation for timing systems.'], ['结合芯片架构和集成方式评估适用性。', 'Assess suitability for your chip architecture and integration approach.'], ['关注封装、环境条件和系统可靠性需求。', 'Consider packaging, environmental conditions and system reliability requirements.'], ['具体产品供应及技术规格请联系官方渠道确认。', 'Confirm product availability and technical specifications with official channels.'],
    ['计时产品选型指南', 'Timing product selection guide'], ['从系统需求出发，逐步缩小计时方案的选择范围。', 'Start with system requirements to narrow down your timing options.'], ['定义应用场景及工作温度范围。', 'Define the application and operating temperature range.'], ['列出频率、精度、抖动和相位噪声要求。', 'List frequency, accuracy, jitter and phase noise requirements.'], ['确认电源、逻辑接口、封装和功耗限制。', 'Check supply voltage, logic interfaces, package and power limits.'], ['对照官方数据手册，并在实际板卡上验证。', 'Consult official data sheets and validate on your actual board.'], ['认识 MEMS 精密计时', 'Understanding MEMS precision timing'], ['MEMS 即微机电系统。通过在硅片上制造微型机械结构，可以将机械谐振与电子电路相结合。', 'MEMS stands for microelectromechanical systems. Tiny mechanical structures fabricated on silicon combine mechanical resonance with electronic circuits.'], ['谐振器产生稳定的机械振动。', 'A resonator produces stable mechanical oscillation.'], ['配套电路维持振荡，并完成温度补偿与输出处理。', 'Supporting circuits sustain oscillation, compensate for temperature and process the output.'], ['不同系列适用于不同环境，实际性能应以对应数据手册为依据。', 'Different families suit different environments. Refer to the relevant data sheet for actual performance.'], ['开始设计前的需求清单', 'Pre-design requirements checklist'], ['整理以下信息，有助于与技术团队高效讨论。', 'Prepare the following information for an effective discussion with the technical team.'], ['应用场景、系统框图及产品开发阶段。', 'Application, system block diagram and development stage.'], ['输入与输出频率、接口类型和供电电压。', 'Input and output frequencies, interface types and supply voltage.'], ['精度、抖动、功耗与工作温度要求。', 'Accuracy, jitter, power and operating temperature requirements.'], ['目标封装尺寸、预计用量和项目时间表。', 'Target package size, estimated volume and project timeline.'], ['整理您的应用需求 ↗', 'Discuss your requirements ↗'], ['暂无匹配结果，请尝试“振荡器”“汽车”或“技术”。', 'No matching results. Try “oscillators”, “automotive” or “technology”.'],
    ['发给芯聚电子的咨询邮件', 'Your inquiry to SIMACITY'], ['收件人：芯聚电子 sales@simacity.com.cn。您可以打开邮件客户端，检查内容后发送，也可以复制以下内容。网页不会自动发送邮件。', 'To: SIMACITY, sales@simacity.com.cn. Open your email app to review and send, or copy the draft below. This page will not send email automatically.'], ['整理后的需求内容', 'Prepared inquiry'], ['复制需求内容', 'Copy inquiry'], ['已复制，可粘贴至邮件。', 'Copied. You can paste it into your email.'], ['请使用系统复制命令复制已选中的内容。', 'Use your system copy command to copy the selected text.'], ['打开邮件客户端 ↗', 'Open email app ↗']
  ]);
  const cleanHeadingText = (value) => value.split('\n').map(line => line.replace(/[。．.!！?？…]+(?=["'”’»）)\]】]*\s*$)/u, '')).join('\n');
  const headingTranslations = new Map([...translations].map(([key, value]) => [cleanHeadingText(key).trim(), value]));
  function endsHeadingLine(node, root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    walker.currentNode = node;
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.ELEMENT_NODE && walker.currentNode.tagName === 'BR') return true;
      if (walker.currentNode.nodeType === Node.TEXT_NODE && walker.currentNode.nodeValue.trim()) return false;
    }
    return true;
  }
  let language = 'zh';
  try { if (localStorage.getItem('simacity-language') === 'en') language = 'en'; } catch { /* Storage can be unavailable in embedded previews. */ }
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const translate = (text, target = language) => {
    if (target !== 'en') return text;
    const trimmed = text.trim();
    const count = trimmed.match(/^(\d+) 款产品系列$/);
    const arrow = trimmed.match(/^(.*) (↗|→)$/);
    const arrowTranslation = arrow && translations.has(arrow[1]) ? translations.get(arrow[1]) + ' ' + arrow[2] : undefined;
    const result = count ? `${count[1]} product ${Number(count[1]) === 1 ? 'family' : 'families'}` : (translations.get(trimmed) ?? arrowTranslation);
    return result === undefined ? text : text.replace(trimmed, result);
  };
  const ignored = (node) => node.parentElement?.closest('script, style, [data-language-toggle], [data-i18n-skip], textarea, input');
  function localizeText(node) {
    if (ignored(node)) return;
    let record = textSources.get(node);
    if (!record || node.nodeValue !== record.rendered) record = { source: node.nodeValue };
    let rendered = translate(record.source);
    const heading = node.parentElement?.closest('h1,h2,h3,h4,h5,h6,[data-heading-lines]');
    if (heading) {
      const key = record.source.trim();
      if (language === 'en' && !translations.has(key) && headingTranslations.has(key)) rendered = record.source.replace(key, headingTranslations.get(key));
      if (endsHeadingLine(node, heading)) rendered = cleanHeadingText(rendered);
    }
    textSources.set(node, { source: record.source, rendered });
    if (node.nodeValue !== rendered) node.nodeValue = rendered;
  }
  function localizeElement(element) {
    if (element.closest('script, style, [data-language-toggle], [data-i18n-skip]')) return;
    let records = attributeSources.get(element);
    if (!records) { records = {}; attributeSources.set(element, records); }
    for (const name of ['aria-label', 'alt', 'placeholder', ...(element.matches('meta[name="description"]') ? ['content'] : [])]) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      let record = records[name];
      if (!record || current !== record.rendered) record = { source: current };
      const rendered = translate(record.source);
      records[name] = { source: record.source, rendered };
      if (current !== rendered) element.setAttribute(name, rendered);
    }
  }
  function localize(root) {
    if (root.nodeType === Node.TEXT_NODE) { localizeText(root); return; }
    if (root.nodeType === Node.ELEMENT_NODE) localizeElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) localizeText(walker.currentNode);
      else localizeElement(walker.currentNode);
    }
  }
  const toggle = document.querySelector('[data-language-toggle]');
  function setLanguage(next) {
    language = next;
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    localize(document.documentElement);
    toggle.querySelector('[data-language-zh]').classList.toggle('active', language === 'zh');
    toggle.querySelector('[data-language-en]').classList.toggle('active', language === 'en');
    toggle.setAttribute('aria-label', language === 'zh' ? '切换到英文版 / Switch to English' : 'Switch to Chinese / 切换到中文版');
    toggle.setAttribute('title', language === 'zh' ? 'Switch to English' : '切换到中文版');
    document.dispatchEvent(new CustomEvent('site:languagechange', { detail: { language } }));
    try { localStorage.setItem('simacity-language', language); } catch { /* The toggle works without storage. */ }
  }
  toggle.addEventListener('click', () => setLanguage(language === 'zh' ? 'en' : 'zh'));
  window.siteI18n = { get language() { return language; }, translate };
  setLanguage(language);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') mutation.addedNodes.forEach(localize);
      else if (mutation.type === 'characterData') localizeText(mutation.target);
      else if (mutation.type === 'attributes') localizeElement(mutation.target);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'alt', 'placeholder', 'content'] });
})();

