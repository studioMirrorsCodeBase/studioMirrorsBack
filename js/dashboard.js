/**
 * dashboard.js
 * UI logic for the dashboard. Talks only to Auth and DashDB (dashboard-db.js).
 * All values are inserted with textContent (no innerHTML) to avoid XSS.
 */
console.log('[DASH INIT] Dashboard UI script loaded.');

const $ = (id) => document.getElementById(id);

function showView(loggedIn) {
  $('loginWin').classList.toggle('hidden', loggedIn);
  $('dashboard').classList.toggle('hidden', !loggedIn);
  console.log('[DASH VIEW]', loggedIn ? 'Dashboard' : 'Login');
}

/** Small DOM helper: <tag class>text</tag> appended to parent. */
function add(parent, tag, text, cls) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (cls) el.className = cls;
  parent.appendChild(el);
  return el;
}

// ---- LOGIN / LOGOUT ----
$('loginBtn').addEventListener('click', () => {
  console.log('[LOGIN CLICKED]');
  Auth.login($('userInput').value.trim(), $('passInput').value)
    .then(() => { $('passInput').value = ''; start(); })
    .catch((err) => { console.error('[LOGIN FAILED]', err); $('loginMsg').textContent = err.message; });
});

$('logoutBtn').addEventListener('click', async () => {
  console.log('[LOGOUT CLICKED]');
  await Auth.logout().catch((err) => console.error('[LOGOUT FAILED]', err));
  showView(false);
});

// ---- PAYMENT MODAL (opens from the "Mode of Payment" button) ----
function togglePayment(open) {
  $('payModal').classList.toggle('hidden', !open);
  console.log('[PAYMENT MODAL]', open ? 'OPEN' : 'CLOSED');
}
$('payBtn').addEventListener('click', () => togglePayment(true));
$('payOk').addEventListener('click', () => togglePayment(false));
$('payClose').addEventListener('click', () => togglePayment(false));
$('payModal').addEventListener('click', (e) => { if (e.target === $('payModal')) togglePayment(false); }); // backdrop click
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') togglePayment(false); });

// ---- START: session check, then load data ----
async function start() {
  const session = await Auth.getSession().catch((err) => {
    console.error('[DASH] Session check failed:', err);
    return null;
  });
  if (!session) return showView(false);

  DashDB.getDashboard(session.user)
    .then((data) => { render(data); showView(true); })
    .catch((err) => console.error('[DASH FAILED]', err));
}

// ---- RENDER ----
const NOT_STARTED_MSG = 'Work has not started yet. Your information will appear here once work begins.';

/** Controller: decides what to show; each helper below has one job. */
function render(d) {
  console.log('[RENDER] Start for user:', d.user, '| workStarted:', d.workStarted);
  $('welcome').textContent = 'Welcome, ' + d.user;
  $('notStarted').classList.toggle('hidden', d.workStarted);

  renderPayment(d.payment);
  if (d.workStarted) renderSummary(d); else renderSummaryNotStarted();
  renderVideos(d.videos);
  renderMilestones(d.milestones, d.payment.currency);
  console.log('[RENDER] Done.');
}

function renderPayment(p) {
  $('payName').textContent = p.name;
  $('payCurrency').textContent = `${p.currency} (${p.currencyName})`;
  console.log('[RENDER] Payment mode:', p.name, p.currency);
}

/** Top cards when work is running. */
function renderSummary(d) {
  const pct = d.total ? Math.round((d.scheduled / d.total) * 100) : 0; // guard: no divide-by-zero
  $('ring').style.setProperty('--pct', pct);
  $('pct').textContent = pct + '%';
  $('scheduledText').textContent = `${d.scheduled} of ${d.total} videos scheduled`;
  console.log('[RENDER] Progress %:', pct);

  $('weekCount').textContent = `${d.week.count} / ${d.week.goal}`;
  $('weekStatus').textContent = d.week.count >= d.week.goal ? '✔ On Track' : '⚠ Behind';

  const done = d.milestones.filter((m) => m.state === 'COMPLETED').length;
  $('milestoneTitle').textContent = `Milestone ${done} of ${d.milestones.length}`;
  $('milestoneBar').value = d.milestones.length ? (done / d.milestones.length) * 100 : 0;
  $('weekTarget').textContent = `Week ${d.target.week} Target Progress`;
  $('earned').textContent = `${d.target.earned} / ${d.target.goal} ${d.payment.currency} earned`;
}

/** Top cards before work starts: same cards, placeholder values. */
function renderSummaryNotStarted() {
  $('ring').style.setProperty('--pct', 0);
  $('pct').textContent = '—';
  $('scheduledText').textContent = 'No videos scheduled yet';
  $('weekCount').textContent = '—';
  $('weekStatus').textContent = 'Not started';
  $('milestoneTitle').textContent = 'Milestones';
  $('milestoneBar').value = 0;
  $('weekTarget').textContent = 'No target yet';
  $('earned').textContent = '—';
  console.log('[RENDER] Summary: not-started placeholders.');
}

function renderVideos(videos) {
  const body = $('videoRows');
  body.innerHTML = '';

  if (!videos.length) {
    add(add(body, 'tr', ''), 'td', NOT_STARTED_MSG, 'empty').colSpan = 9; // one full-width message row
    console.log('[RENDER] Videos table: empty state.');
    return;
  }

  videos.forEach((v) => {
    const tr = document.createElement('tr');
    if (v.status === 'Verified') tr.className = 'verified';
    add(tr, 'td', v.id);
    add(tr, 'td', v.title);
    add(tr, 'td', v.platform);
    add(tr, 'td', v.date);
    add(tr, 'td', v.status, 'st-' + v.status.toLowerCase().replace(/ /g, '-'));
    add(tr, 'td', v.caption);
    add(tr, 'td', v.tags);

    const linkTd = add(tr, 'td', '');
    const a = add(linkTd, 'a', '↗');
    a.href = v.link; a.target = '_blank'; a.rel = 'noopener noreferrer';

    add(tr, 'td', v.issue ? '⚠' : '—', v.issue ? 'issue' : '');
    body.appendChild(tr);
  });
  console.log('[RENDER] Video rows:', videos.length);
}

function renderMilestones(list, currency) {
  const ul = $('milestoneList');
  ul.innerHTML = '';

  if (!list.length) {
    add(ul, 'li', NOT_STARTED_MSG, 'empty');
    console.log('[RENDER] Milestones: empty state.');
    return;
  }

  list.forEach((m) => {
    const li = add(ul, 'li', '');
    add(li, 'div', m.title);
    add(li, 'div', m.state, m.state === 'COMPLETED' ? 'done' : m.state === 'IN PROGRESS' ? 'prog' : '');
    if (m.earned) add(li, 'div', `Earned: +${m.earned} ${currency}`, 'done');
    if (m.date) add(li, 'div', m.date);
  });
  console.log('[RENDER] Milestones:', list.length);
}

// Auto-load if a session already exists (page refresh)
start();