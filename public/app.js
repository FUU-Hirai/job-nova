import { jobs, roles, cities, conditions } from './data.js';

const main = document.querySelector('#main');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const read = (storage, key, fallback) => { try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; } };
let saved = read(localStorage, 'jobnova:saved:v1', []);
if (!Array.isArray(saved)) saved = [];
let applications = read(sessionStorage, 'jobnova:applications:v1', []);
if (!Array.isArray(applications)) applications = [];
let draft = null;
let completed = null;
let toastTimer;

const roleIcons = { '介護職': '🤝', '看護師': '🩺', '保育士': '🌼', '理学療法士': '🚶', '生活支援員': '🏠' };
const conditionIcons = ['☀️', '🌱', '🏡', '📖'];

function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2500);
}
function persist(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); }
  catch { toast('保存が制限されているため、この画面内のみ保持します。'); }
}
const isSaved = id => saved.includes(id);
const place = job => `福岡県${job.city}${job.area || ''}`;
const pay = job => `${job.salary}〜${job.salaryMax}`;

function heartIcon(on) {
  return on
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-6.7-4.35-9.33-8.1C.7 10.2 1.2 6.5 4.1 5.2 6.2 4.3 8.4 5 12 8.2 15.6 5 17.8 4.3 19.9 5.2c2.9 1.3 3.4 5 1.43 7.7C18.7 16.65 12 21 12 21z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 20s-7-4.4-9.2-8C1 9.2 1.6 5.8 4.4 4.6 6.4 3.8 8.5 4.5 12 7.8c3.5-3.3 5.6-4 7.6-3.2 2.8 1.2 3.4 4.6 1.6 7.4C19 15.6 12 20 12 20z"/></svg>';
}
function favorite(job, extra = '') {
  const on = isSaved(job.id);
  return `<button type="button" class="favorite ${extra} ${on ? 'active' : ''}" data-save="${job.id}" aria-pressed="${on}" aria-label="${escape(job.facility)}をお気に入り${on ? 'から削除' : 'に保存'}">${heartIcon(on)}</button>`;
}
function tags(job) {
  return job.tags.map(tag => `<span>${escape(tag)}</span>`).join('');
}
function art(job, large = false) {
  const scene = large ? `<svg class="workplace-svg" viewBox="0 0 640 200" aria-hidden="true">
      <ellipse cx="320" cy="178" rx="250" ry="16" fill="rgba(255,255,255,.5)"/>
      <path d="M168 86 L280 40 L392 86" fill="#0e7a40"/>
      <rect x="186" y="84" width="196" height="92" rx="8" fill="#fff"/>
      <rect x="268" y="52" width="8" height="28" fill="#0e7a40"/>
      <rect x="260" y="60" width="24" height="8" fill="#0e7a40"/>
      <rect x="206" y="102" width="28" height="22" rx="3" fill="#d7efe2"/>
      <rect x="244" y="102" width="28" height="22" rx="3" fill="#d7efe2"/>
      <rect x="300" y="102" width="28" height="22" rx="3" fill="#d7efe2"/>
      <rect x="338" y="102" width="24" height="22" rx="3" fill="#d7efe2"/>
      <rect x="262" y="132" width="36" height="44" rx="4" fill="#0e7a40"/>
      <circle cx="112" cy="146" r="24" fill="#7dbe78"/>
      <rect x="107" y="146" width="10" height="30" rx="2" fill="#6b5344"/>
      <circle cx="470" cy="128" r="16" fill="#f3c7aa"/>
      <path d="M448 176c2-28 12-40 22-40s20 12 22 40" fill="#fff"/>
      <circle cx="528" cy="132" r="16" fill="#e0b394"/>
      <path d="M506 178c2-26 12-38 22-38s20 12 22 38" fill="#fff7ea"/>
    </svg>` : `<span class="art-orbit" aria-hidden="true"></span><span class="art-icon" aria-hidden="true">${job.icon}</span>`;
  const label = large ? 'サンプルイラスト · 実在の施設ではありません' : 'サンプル';
  return `<div class="job-art ${job.theme}${large ? ' large' : ''}" role="img" aria-label="${escape(job.facility)}のサンプルイラスト。実在の施設ではありません">${scene}<p class="sample-flag">${label}</p></div>`;
}
function card(job) {
  return `<article class="job-card">
    <a class="card-media" href="#/jobs/${job.id}" tabindex="-1" aria-hidden="true">${art(job)}</a>
    ${favorite(job)}
    <div class="card-body">
      <p class="card-role">${escape(job.role)} · ${escape(job.employment)}</p>
      <h3><a href="#/jobs/${job.id}">${escape(job.title)}</a></h3>
      <p class="facility">${escape(job.facility)}</p>
      <p class="card-place"><span aria-hidden="true">📍</span>${escape(place(job))}</p>
      <p class="card-pay">月給 <strong>${pay(job)}</strong> 万円</p>
      <div class="tags">${tags(job)}</div>
      <a class="card-link" href="#/jobs/${job.id}">詳しく見る <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}
function select(name, label, values, selected = '', anyLabel = '指定なし') {
  return `<label class="select-label">${label}<select name="${name}"><option value="">${anyLabel}</option>${values.map(value => `<option value="${escape(value)}"${value === selected ? ' selected' : ''}>${escape(value)}</option>`).join('')}</select></label>`;
}
function queryHref(params, updates) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(updates)) {
    next.delete(key);
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return `#/search${qs ? `?${qs}` : ''}`;
}
function roleChips(params) {
  const current = params.get('role') || '';
  const all = `<a class="role-chip${current ? '' : ' is-selected'}" href="${queryHref(params, { role: '' })}"${current ? '' : ' aria-current="true"'}>すべて</a>`;
  const rest = roles.map(role => {
    const on = current === role;
    return `<a class="role-chip${on ? ' is-selected' : ''}" href="${queryHref(params, { role })}"${on ? ' aria-current="true"' : ''}>${roleIcons[role] || ''} ${escape(role)}</a>`;
  }).join('');
  return all + rest;
}
function conditionChips(params) {
  const selected = params.getAll('tag');
  return conditions.map(condition => `<label class="chip"><input type="checkbox" name="tag" value="${escape(condition)}"${selected.includes(condition) ? ' checked' : ''}><span>${escape(condition)}</span></label>`).join('');
}
function searchForm(params = new URLSearchParams(), compact = false) {
  const fields = `${select('city', '勤務地', cities, params.get('city') || '', 'すべての勤務地')}${select('role', '職種', roles, params.get('role') || '', 'すべての職種')}`;
  if (!compact) {
    return `<form id="search-form" class="search-panel home-search">
      <div class="search-meta">
        <span class="badge-new">サンプル求人</span>
        <p>掲載中の求人 <strong>${jobs.length}</strong> 件</p>
      </div>
      <div class="search-fields">${fields}</div>
      <button class="search-go" type="submit">求人を検索</button>
      <p class="search-note">掲載している求人はすべて架空です。実在の施設ではありません。</p>
    </form>`;
  }
  return `<form id="search-form" class="search-panel compact">
    <div class="role-row">
      <p id="role-filter-label">職種ですぐ絞り込む</p>
      <div class="role-chips" role="group" aria-labelledby="role-filter-label">${roleChips(params)}</div>
    </div>
    <div class="search-fields">${fields}</div>
    <fieldset class="filter-options">
      <legend>希望条件（選んだ条件をすべて満たす求人）</legend>
      <div class="chip-list">${conditionChips(params)}</div>
    </fieldset>
    <div class="keyword-row">
      <label class="keyword-label">キーワード<input name="q" value="${escape(params.get('q') || '')}" placeholder="施設名・求人タイトル" maxlength="80"></label>
      <button class="primary" type="submit">この条件で検索</button>
    </div>
  </form>`;
}
function emptyState({ title, text, href = '', label = '', heading = 'h2' }) {
  return `<div class="empty"><p class="empty-mark" aria-hidden="true">🌱</p><${heading}>${title}</${heading}><p>${text}</p>${href ? `<a class="primary" href="${href}">${label}</a>` : ''}</div>`;
}
function steps(current) {
  return `<ol class="steps" aria-label="応募の進捗">${['入力', '確認', '完了'].map((label, index) => {
    const number = index + 1;
    const state = number === current ? 'is-current' : number < current ? 'is-done' : '';
    const mark = number < current ? '✓' : String(number);
    return `<li class="${state}"${number === current ? ' aria-current="step"' : ''}><span class="step-num">${mark}</span><span class="step-label">${label}</span></li>`;
  }).join('')}</ol>`;
}
function heroVisual() {
  return `<div class="hero-visual">
    <img src="/hero.jpg" width="1024" height="573" alt="医療・介護の仕事をする人たちのサンプル写真。実在の職場やスタッフではありません">
    <p class="hero-caption">サンプル写真 · 実在の職場ではありません</p>
  </div>`;
}
const wrapper = content => `<div class="container">${content}</div>`;

function home() {
  const conditionCards = conditions.map((condition, index) => {
    const count = jobs.filter(job => job.tags.includes(condition)).length;
    return `<a href="#/search?tag=${encodeURIComponent(condition)}">
      <span class="cond-icon" aria-hidden="true">${conditionIcons[index]}</span>
      <span class="cond-text"><b>${escape(condition)}</b><small>${count}件</small></span>
      <span class="go" aria-hidden="true">→</span>
    </a>`;
  }).join('');
  return `<section class="hero">
    <div class="hero-inner">
      ${heroVisual()}
      <div class="hero-copy">
        <p class="hero-kicker">医療・介護・福祉の仕事</p>
        <h1>職場を知って、<br>安心して応募できる。</h1>
        <p class="hero-lead">条件だけではわからないことを、職場の紹介で確かめられます。</p>
        <ul class="hero-points">
          <li>職場の様子がわかる</li>
          <li>登録なしで求人を見られる</li>
        </ul>
      </div>
    </div>
  </section>
  <div class="search-wrap">${searchForm()}</div>
  ${wrapper(`<section class="hope">
      <div class="hope-lead">
        <span class="hope-face" aria-hidden="true">💬</span>
        <div>
          <p>働き方の希望から</p>
          <h2>希望条件から探す</h2>
        </div>
      </div>
      <div class="condition-grid">${conditionCards}</div>
    </section>
    <section class="section">
      <div class="section-heading">
        <h2>掲載中の求人</h2>
        <a class="text-link" href="#/search">すべての求人を見る</a>
      </div>
      <div class="job-grid">${jobs.slice(0, 3).map(card).join('')}</div>
    </section>
    <section class="values">
      <h2>応募する前に、職場をもっと知ろう。</h2>
      <div class="value-grid">
        <div><b>01</b><h3>働く一日が見える</h3><p>仕事内容や勤務時間を具体的に見て、入職後の暮らしをイメージできます。</p></div>
        <div><b>02</b><h3>学び直しも、応援</h3><p>未経験やブランクのある方も、研修の内容を確認してから選べます。</p></div>
        <div><b>03</b><h3>自分のペースで進める</h3><p>気になる求人は保存して、比べてから応募できます。</p></div>
      </div>
    </section>`)}`;
}
function search(params) {
  const query = (params.get('q') || '').trim().toLowerCase();
  let found = jobs.filter(job => (!params.get('city') || job.city === params.get('city')) && (!params.get('role') || job.role === params.get('role')) && params.getAll('tag').every(tag => job.tags.includes(tag)) && (!query || `${job.title} ${job.facility} ${job.role} ${job.city}`.toLowerCase().includes(query)));
  if (params.get('sort') === 'salary') found.sort((a, b) => b.salary - a.salary);
  const list = found.length
    ? `<div class="job-grid">${found.map(card).join('')}</div>`
    : emptyState({ title: '条件に合う求人が見つかりませんでした', text: '勤務地や職種、希望条件を少し広げてみてください。', href: '#/search', label: '条件をリセット' });
  return wrapper(`<div class="page-heading"><h1>求人を探す</h1><p>勤務地・職種・希望条件を組み合わせて、気になる職場を探せます。</p></div>
    ${searchForm(params, true)}
    <div class="result-bar">
      <p class="result-count"><strong>${found.length}</strong>件の求人 <small>架空データ</small></p>
      <label class="sort-label">並び替え<select id="sort"><option value="">掲載順</option><option value="salary"${params.get('sort') === 'salary' ? ' selected' : ''}>月給の下限が高い順</option></select></label>
    </div>
    ${list}`);
}
function details(job) {
  const schedule = job.schedule ? `<section class="detail-section"><h2>一日の流れ</h2><p class="note">サンプルのスケジュールです。実在の職場の実績ではありません。</p><ol class="timeline">${job.schedule.map(([time, task]) => `<li><strong>${escape(time)}</strong><span>${escape(task)}</span></li>`).join('')}</ol></section>` : '';
  return wrapper(`<div class="breadcrumb"><a href="#/search">求人を探す</a> / ${escape(job.role)} / ${escape(job.facility)}</div>
    <div class="detail-layout">
      <article>
        ${art(job, true)}
        <div class="detail-heading">
          <div>
            <p class="card-role">${escape(job.role)} · ${escape(job.employment)}</p>
            <h1>${escape(job.title)}</h1>
            <div class="tags">${tags(job)}</div>
          </div>
          ${favorite(job, 'detail-fav')}
        </div>
        <div class="place-card">
          <div class="avatar ${job.theme}" aria-hidden="true">${job.icon}</div>
          <div>
            <p class="place-kana">サンプルの職場</p>
            <p class="place-name">${escape(job.facility)}</p>
            <p class="place-address">${escape(place(job))}</p>
          </div>
        </div>
        <p class="updated">サンプル求人 · 実在の施設・スタッフではありません</p>
        <section class="pay-card">
          <div class="pay-card-top">
            <h2>${escape(job.role)}</h2>
            <span class="open-badge">募集中</span>
          </div>
          <p class="pay-line"><span class="yen" aria-hidden="true">¥</span>月給 <strong>${pay(job)}万円</strong></p>
          <p class="pay-note">※デモ用の参考表示です。給与内訳や手当は含まれていません。</p>
        </section>
        <section class="hours-panel">
          <h2>勤務時間</h2>
          <div class="hours-row"><span>時間</span><strong>${escape(job.hours)}</strong></div>
          <div class="hours-row"><span>休日</span><strong>${escape(job.holidays)}</strong></div>
        </section>
        <section class="detail-section">
          <h2>この職場で、大切にしていること</h2>
          <p>${escape(job.intro)}</p>
          <blockquote>「${escape(job.voice)}」<small>スタッフの声（架空のサンプル）</small></blockquote>
        </section>
        <section class="detail-section">
          <h2>仕事内容・サポート</h2>
          <h3>お任せする仕事</h3>
          <p>${escape(job.tasks)}</p>
          <h3>入職後のサポート</h3>
          <p>${escape(job.training)}</p>
        </section>
        ${schedule}
        <section class="detail-section">
          <h2>募集要項</h2>
          <dl class="requirements">${[['雇用形態', job.employment], ['給与', `月給${pay(job)}万円（デモ用の参考表示）`], ['勤務地', place(job)], ['勤務時間', job.hours], ['休日', job.holidays], ['資格', job.qualification], ['選考の流れ', '応募 → 連絡 → 面接 → 結果連絡（仮のフロー）']].map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
          <p class="note">※ 本番では給与内訳・契約期間・試用期間・保険・変更範囲など、求人掲載に必要な項目を事業者と確認して整備します。</p>
        </section>
      </article>
      <aside class="apply-aside">
        <div>
          <p class="aside-role">${escape(job.role)} · ${escape(job.employment)}</p>
          <p class="aside-facility">${escape(job.facility)}</p>
          <p class="aside-pay">月給 <strong>${pay(job)}</strong> 万円</p>
          <a class="primary" href="#/apply/${job.id}">この求人に応募する</a>
          <button type="button" class="secondary" data-save="${job.id}" aria-pressed="${isSaved(job.id)}">${isSaved(job.id) ? '♥ 保存済み' : '♡ お気に入りに保存'}</button>
          <small>会員登録なしで入力できます。デモのため企業には送信されません。</small>
        </div>
      </aside>
    </div>
    <div class="mobile-apply">
      ${favorite(job, 'bar-fav')}
      <p>月給 <strong>${pay(job)}万円</strong></p>
      <a class="primary" href="#/apply/${job.id}">応募する</a>
    </div>`);
}
function application(job) {
  const values = draft?.jobId === job.id ? draft : {};
  return wrapper(`<div class="form-page">
    <div class="form-top">
      <a class="back-link" href="#/jobs/${job.id}">← 戻る</a>
      <h1>応募フォーム</h1>
      <span></span>
    </div>
    ${steps(1)}
    <div class="application-job"><b>${escape(job.facility)}</b><p>${escape(job.title)}</p><p>${escape(job.role)} / 月給${pay(job)}万円 / ${escape(place(job))}</p></div>
    <p class="demo-note">デモです。実在する氏名・メール・電話番号は入力せず、サンプルをご利用ください。情報は企業へ送信されません。</p>
    <button class="secondary" id="fill-demo" type="button">サンプル情報を入力</button>
    <form id="apply-form" data-job="${job.id}" novalidate>
      <label class="field"><span class="field-name">氏名 <span class="required">必須</span></span><input name="name" autocomplete="off" required maxlength="80" value="${escape(values.name)}" placeholder="例）山田 花子（サンプル）"></label>
      <label class="field"><span class="field-name">メールアドレス <span class="required">必須</span></span><input type="email" name="email" autocomplete="off" required maxlength="254" value="${escape(values.email)}" placeholder="例）demo@example.com"></label>
      <label class="field"><span class="field-name">電話番号 <span class="optional">任意</span></span><input type="tel" name="phone" autocomplete="off" maxlength="20" pattern="[0-9+() -]{8,20}" value="${escape(values.phone)}" placeholder="例）090-0000-0000"></label>
      <label class="field"><span class="field-name">資格・経験 <span class="required">必須</span></span><input name="qualification" required maxlength="200" value="${escape(values.qualification)}" placeholder="例）介護福祉士 / 資格なし・未経験"></label>
      <label class="field"><span class="field-name">相談・希望事項 <span class="optional">任意</span></span><textarea name="message" rows="4" maxlength="1000" placeholder="勤務開始時期や勤務時間など">${escape(values.message)}</textarea></label>
      <label class="consent"><input type="checkbox" name="consent" required ${values.consent ? 'checked' : ''}><span>架空求人へのデモ応募であることを確認しました。</span></label>
      <button class="primary" type="submit">入力内容を確認する</button>
    </form>
  </div>`);
}
function confirmation(job) {
  const rows = [['氏名', draft.name], ['メール', draft.email], ['電話番号', draft.phone || '未入力'], ['資格・経験', draft.qualification], ['希望事項', draft.message || '未入力']];
  return wrapper(`<div class="form-page">
    <div class="form-top">
      <a class="back-link" href="#/apply/${job.id}">← 戻る</a>
      <h1>入力内容の確認</h1>
      <span></span>
    </div>
    ${steps(2)}
    <div class="application-job"><b>${escape(job.facility)}</b><p>${escape(job.role)} / 月給${pay(job)}万円</p></div>
    <dl class="requirements">${rows.map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
    <p class="demo-note">ボタンを押しても外部への送信はありません。応募履歴には求人と日時だけを残し、入力した個人情報は保存しません。</p>
    <div class="form-actions">
      <a class="secondary" href="#/apply/${job.id}">入力を修正</a>
      <button class="primary" id="submit-demo" type="button" data-job="${job.id}">デモ応募を完了する</button>
    </div>
  </div>`);
}
function success(job) {
  return wrapper(`<div class="success">
    <div class="success-icon" aria-hidden="true">✓</div>
    <div class="form-top success-top"><span></span><h1>応募完了</h1><span></span></div>
    ${steps(3)}
    <p>${escape(job.facility)}の応募操作を体験しました。<br>実際の応募や通知は行われていません。</p>
    <a class="primary" href="#/mypage">応募履歴を見る</a>
    <a class="text-link" href="#/search">ほかの求人を探す</a>
  </div>`);
}
function mypage() {
  const history = applications.length
    ? `<div class="history">${applications.map(item => {
      const job = jobs.find(entry => entry.id === item.jobId);
      return job ? `<article><div><p class="card-role">${escape(job.role)}</p><h3><a href="#/jobs/${job.id}">${escape(job.facility)}</a></h3><small>${escape(item.date)}</small></div><div class="history-status"><span class="status-pill">デモ応募完了</span><small>企業の確認・選考は行われません</small></div></article>` : '';
    }).join('')}</div>`
    : emptyState({ title: 'まだ応募履歴がありません', text: '求人を探して、応募の流れを体験してみましょう。', href: '#/search', label: '求人を探す' });
  return wrapper(`<div class="page-heading"><h1>マイページ</h1><p>アカウント認証のないデモ画面です。応募履歴はこのタブのあいだだけ残り、氏名などの入力内容は保存しません。</p></div>
    <div class="stats"><div><strong>${applications.length}</strong><span>デモ応募</span></div><a href="#/saved"><strong>${saved.length}</strong><span>お気に入り →</span></a></div>
    <h2>応募履歴 <small>${applications.length}件</small></h2>
    ${history}
    <div class="info-box"><h3>本番で想定する進捗管理</h3><p>応募済み → 企業確認中 → 選考中 → 終了</p><p>企業管理画面・APIと接続した段階で実装します。現在のデモには企業側の更新機能や通知機能はありません。</p></div>`);
}
function render(focus = true) {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  const [, section, id] = path.split('/');
  const job = jobs.find(entry => entry.id === id);
  if (section !== 'apply' && section !== 'confirm') draft = null;
  if (path === '/') main.innerHTML = home();
  else if (section === 'search') main.innerHTML = search(params);
  else if (section === 'saved') main.innerHTML = wrapper(`<div class="page-heading"><h1>保存した求人</h1><p>このブラウザに保存した求人です。${saved.length}件。会員登録は不要です。</p></div>${saved.length ? `<div class="job-grid">${jobs.filter(entry => isSaved(entry.id)).map(card).join('')}</div>` : emptyState({ title: 'お気に入りはまだありません', text: '求人カードのハートから保存できます。', href: '#/search', label: '求人を探す' })}`);
  else if (section === 'mypage') main.innerHTML = mypage();
  else if (job && section === 'jobs') main.innerHTML = details(job);
  else if (job && section === 'apply') main.innerHTML = application(job);
  else if (job && section === 'confirm' && draft?.jobId === job.id) main.innerHTML = confirmation(job);
  else if (job && section === 'complete' && completed === job.id) main.innerHTML = success(job);
  else main.innerHTML = wrapper(emptyState({ title: 'この画面を表示できません', text: '求人を探す画面から、もう一度お進みください。', href: '#/search', label: '求人を探す', heading: 'h1' }));
  document.querySelector('#saved-count').textContent = saved.length;
  document.querySelectorAll('nav a').forEach(anchor => {
    const current = anchor.hash.split('?')[0] === `#/${section}`;
    if (current) anchor.setAttribute('aria-current', 'page');
    else anchor.removeAttribute('aria-current');
  });
  if (focus) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}
document.addEventListener('click', event => {
  const save = event.target.closest('[data-save]');
  if (save) {
    const id = save.dataset.save;
    const buttons = [...document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`)];
    const index = buttons.indexOf(save);
    saved = isSaved(id) ? saved.filter(item => item !== id) : [...saved, id];
    persist(localStorage, 'jobnova:saved:v1', saved);
    render(false);
    const next = document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`);
    (next[index] || next[0])?.focus({ preventScroll: true });
    toast(isSaved(id) ? 'お気に入りに保存しました' : 'お気に入りから削除しました');
  }
  if (event.target.closest('#fill-demo')) {
    const form = document.querySelector('#apply-form');
    Object.entries({ name: '山田 花子（サンプル）', email: 'demo@example.com', phone: '090-0000-0000', qualification: '初任者研修修了（サンプル）', message: '日勤を希望しています（サンプル）。' }).forEach(([name, value]) => { form.elements[name].value = value; form.elements[name].setCustomValidity(''); });
  }
  const submit = event.target.closest('#submit-demo');
  if (submit && draft?.jobId === submit.dataset.job) {
    applications.unshift({ jobId: draft.jobId, date: new Date().toLocaleString('ja-JP') });
    persist(sessionStorage, 'jobnova:applications:v1', applications);
    completed = draft.jobId;
    draft = null;
    location.hash = `/complete/${completed}`;
  }
  if (event.target.closest('#reset') && confirm('お気に入りとデモ応募履歴を削除しますか？')) {
    saved = [];
    applications = [];
    draft = null;
    completed = null;
    persist(localStorage, 'jobnova:saved:v1', saved);
    persist(sessionStorage, 'jobnova:applications:v1', applications);
    if (location.hash === '#/' || location.hash === '' || location.hash === '#') render();
    else location.hash = '/';
    toast('デモデータをリセットしました');
  }
});
document.addEventListener('submit', event => {
  if (event.target.id === 'search-form') {
    event.preventDefault();
    const params = new URLSearchParams(new FormData(event.target));
    for (const key of [...params.keys()]) if (!params.get(key)) params.delete(key);
    const next = `#/search?${params.toString()}`;
    if (location.hash === next) render();
    else location.hash = next;
  }
  if (event.target.id === 'apply-form') {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    for (const name of ['name', 'qualification']) {
      if (!form.elements[name].value.trim()) {
        form.elements[name].setCustomValidity('空白のみでは入力できません。');
        form.reportValidity();
        return;
      }
    }
    draft = { ...Object.fromEntries(new FormData(form)), jobId: form.dataset.job };
    location.hash = `/confirm/${form.dataset.job}`;
  }
});
document.addEventListener('input', event => { if (event.target.matches('#apply-form input, #apply-form textarea')) event.target.setCustomValidity(''); });
document.addEventListener('change', event => {
  if (event.target.id === 'sort') {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    if (event.target.value) params.set('sort', event.target.value);
    else params.delete('sort');
    location.hash = `/search?${params}`;
  }
});
window.addEventListener('hashchange', () => render());
render(false);
