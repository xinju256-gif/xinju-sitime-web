(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const field = (id) => document.getElementById(id);
  const text = (zh, en) => window.siteI18n.language === 'en' ? en : zh;
  const submit = field('inquiry-submit');
  const status = field('inquiry-status');
  const config = window.SIMACITY_INQUIRY || { enabled: false };
  let busy = false;
  let lastStatus = null;
  function announce(zh, en, error = false) {
    lastStatus = [zh, en]; status.textContent = text(zh, en);
    status.classList.toggle('is-error', error);
  }
  status.setAttribute('data-i18n-skip', '');
  field('inquiry-note').setAttribute('data-i18n-skip', '');
  function renderNote() {
    field('inquiry-note').textContent = config.enabled
      ? text('咨询由芯聚电子受理。信息仅用于本次业务咨询；也可致电 021-62271972 或发送邮件。', 'SIMACITY handles your inquiry. Information is used to respond to this request. You can also call +86 21 6227 1972 or email us.')
      : text('当前预览支持生成咨询邮件，在线收件尚未启用。也可致电 021-62271972。', 'This preview prepares an inquiry email. Online collection is not enabled yet. You can also call +86 21 6227 1972.');
    field('contact-language').value = window.siteI18n.language;
    if (lastStatus) status.textContent = text(...lastStatus);
  }
  function validate() {
    // Browsers treat whitespace as a valid required value; inquiry fields should not.
    for (const control of [field('contact-name'), field('contact-phone'), field('contact-needs')]) {
      control.setCustomValidity(control.value.trim() ? '' : text('请填写此字段。', 'Please complete this field.'));
    }
    return form.reportValidity();
  }
  form.addEventListener('input', (event) => event.target.setCustomValidity?.(''));
  function emailInquiry() {
    document.dispatchEvent(new CustomEvent('site:detailopen', { detail: { kind: 'inquiry' } }));
    const data = new FormData(form);
    const subject = text('SiTime 产品询价与技术咨询', 'SiTime product inquiry and technical support');
    const labels = text(
      ['姓名', '联系电话', '公司名称', '工作邮箱', '产品 / 型号', '咨询类型', '咨询内容'],
      ['Name', 'Phone', 'Company', 'Work email', 'Product / model', 'Request type', 'Requirements']
    );
    const values = ['name', 'phone', 'company', 'email', 'product'].map((key) => data.get(key) || '—');
    values.push(field('contact-type').selectedOptions[0].textContent, data.get('needs'));
    const body = labels.map((label, i) => `${label}: ${values[i]}`).join('\n\n');
    const container = field('dialog-content'); container.replaceChildren();
    const wrapper = document.createElement('div'); wrapper.setAttribute('data-i18n-skip', '');
    const title = document.createElement('h2'); title.textContent = text('发给芯聚电子的咨询邮件', 'Email your inquiry to SIMACITY');
    const note = document.createElement('p'); note.textContent = text('收件人：sales@simacity.com.cn。请打开邮件客户端检查后发送，或复制以下内容；此时尚未发送。', 'Recipient: sales@simacity.com.cn. Review and send through your email app, or copy the text below. Nothing has been sent yet.');
    const area = document.createElement('textarea'); area.value = body; area.readOnly = true; area.rows = 10; area.setAttribute('aria-label', text('咨询邮件内容', 'Inquiry email text'));
    const send = document.createElement('a'); send.className = 'button mail-action'; send.textContent = text('打开邮件客户端 ↗', 'Open email app ↗'); send.href = `mailto:sales@simacity.com.cn?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'button'; copy.textContent = text('复制需求内容', 'Copy inquiry');
    const feedback = document.createElement('p'); feedback.setAttribute('role', 'status');
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(body); feedback.textContent = text('已复制，可粘贴至邮件。', 'Copied. Paste it into your email.'); }
      catch { area.focus(); area.select(); feedback.textContent = text('请使用系统复制命令复制已选中的内容。', 'Use your system copy command to copy the selected text.'); }
    });
    wrapper.append(title, note, area, send, copy, feedback); container.append(wrapper);
    field('content-dialog').showModal();
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !validate()) return;
    if (form.elements['bot-field'].value) return;
    if (!config.enabled) {
      announce('在线收件尚未启用，已为您整理咨询邮件，请检查后发送。', 'Online collection is not enabled. Please review and send the prepared email.');
      emailInquiry(); return;
    }
    busy = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
    announce('正在提交咨询，请稍候…', 'Submitting your inquiry…');
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const data = new URLSearchParams(new FormData(form));
      const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString(), signal: controller.signal });
      if (!response.ok) throw new Error('Submission rejected');
      announce('咨询已提交。您可继续通过电话或邮件联系芯聚电子。', 'Your inquiry has been submitted. You can also contact SIMACITY by phone or email.');
      form.reset(); field('contact-language').value = window.siteI18n.language;
    } catch {
      announce('未能确认提交成功，填写内容已保留。请重试，或点击“邮件咨询”发送。', 'We could not confirm submission. Your entries are preserved. Please retry or use the email option.', true);
    } finally {
      clearTimeout(timer); busy = false; submit.disabled = false; form.removeAttribute('aria-busy');
    }
  });
  field('inquiry-email').addEventListener('click', () => { if (validate()) emailInquiry(); });
  window.prepareProductInquiry = (model, type = 'inquiry') => {
    field('contact-product').value = model;
    field('contact-type').value = type;
    const needs = field('contact-needs');
    if (!needs.value.includes(model)) needs.value = text(`咨询型号：${model}`, `Product inquiry: ${model}`) + (needs.value ? '\n' + needs.value : '');
  };
  const query = new URLSearchParams(location.search);
  if (query.get('product')) window.prepareProductInquiry(query.get('product').slice(0, 300));
  if (query.get('subject') === 'sample') field('contact-type').value = 'sample';
  if ([...field('contact-type').options].some(option => option.value === query.get('type'))) field('contact-type').value = query.get('type');
  if (query.get('application')) field('contact-needs').value = text('应用咨询：', 'Application inquiry: ') + query.get('application').slice(0, 1000);
  document.addEventListener('site:languagechange', renderNote);
  renderNote();
})();
