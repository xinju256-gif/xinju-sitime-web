(() => {
  const focusCopy = window.LOCAL_READING_DATA.focusCopy;
  const topics = window.LOCAL_READING_DATA.topics.map(t => [new RegExp(t.pattern,t.flags),t.title,t.body]);
  window.renderLocalReading = (body, item, kind) => {
    const lang = window.siteI18n.language; const choose = (pair) => pair[lang === 'en' ? 1 : 0];
    const section = document.createElement('section'); section.className = 'local-reading';
    const add = (tag, value) => { const n = document.createElement(tag); n.textContent = value; section.append(n); return n; };
    if (kind !== 'news') {
      add('h3', choose(['工程选型说明', 'Engineering selection notes']));
      for (let i = 0; i < (item.focus?.zh.length || 0); i++) {
        const key = item.focus.zh[i];
        add('h4', item.focus[lang][i]);
        add('p', choose(focusCopy[key] || focusCopy['接口配合']));
      }
      add('h3', choose(['从需求到验证', 'From requirements to validation']));
      const list = add('ol', '');
      for (const pair of [
        ['记录本应用所需的频率、稳定性、接口、供电、封装和温度范围。', 'Record frequency, stability, interface, supply, package and temperature requirements.'],
        ['在本站产品目录中筛选型号，并直接下载对应原厂规格书核对完整测试条件。', 'Filter models in this site’s catalog and download their manufacturer datasheets to check full test conditions.'],
        ['使用具体订货代码确认配置、资格等级及交期，再开展原理图、布局和样机验证。', 'Confirm configuration, qualification and lead time for the ordering code, then validate schematic, layout and prototype.']
      ]) { const li = document.createElement('li'); li.textContent = choose(pair); list.append(li); }
    } else {
      const topic = topics.find(([pattern]) => pattern.test(item.title.en)) || [null, ['计时产品阅读提示', 'Timing product context'], ['选型时请把资讯中的产品方向与实际应用需求区分开。具体频率、输出接口、供电、温度和测试条件，应查看本站对应型号的原厂 PDF。', 'Distinguish product announcements from application requirements. Consult the local manufacturer PDF for exact frequency, output, supply, temperature and test conditions.']];
      add('h3', choose(topic[1])); add('p', choose(topic[2]));
      add('p', choose(['以上为芯聚电子补充的原创阅读提示，不属于原厂文章的逐字转载。', 'These are original SIMACITY reading notes, not a verbatim reproduction of the manufacturer article.'])).className = 'local-reading-note';
    }
    body.append(section);
  };
})();
