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
function render(d) {
  console.log('[RENDER] Start for user:', d.user);

  $('welcome').textContent = 'Welcome, ' + d.user;

  const pct = Math.round((d.scheduled / d.total) * 100);
  $('ring').style.setProperty('--pct', pct);
  $('pct').textContent = pct + '%';
  $('scheduledText').textContent = `${d.scheduled} of ${d.total} videos scheduled`;
  console.log('[RENDER] Progress %:', pct);

  $('weekCount').textContent = `${d.week.count} / ${d.week.goal}`;
  $('weekStatus').textContent = d.week.count >= d.week.goal ? '✔ On Track' : '⚠ Behind';

  const done = d.milestones.filter((m) => m.state === 'COMPLETED').length;
  $('milestoneTitle').textContent = `Milestone ${done} of ${d.milestones.length}`;
  $('milestoneBar').value = (done / d.milestones.length) * 100;
  $('weekTarget').textContent = `Week ${d.target.week} Target Progress`;
  $('earned').textContent = `$${d.target.earned} / $${d.target.goal} earned`;

  renderVideos(d.videos);
  renderMilestones(d.milestones);
  console.log('[RENDER] Done.');
}

function renderVideos(videos) {
  const body = $('videoRows');
  body.innerHTML = '';
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

function renderMilestones(list) {
  const ul = $('milestoneList');
  ul.innerHTML = '';
  list.forEach((m) => {
    const li = add(ul, 'li', '');
    add(li, 'div', m.title);
    add(li, 'div', m.state, m.state === 'COMPLETED' ? 'done' : m.state === 'IN PROGRESS' ? 'prog' : '');
    if (m.earned) add(li, 'div', 'Earned: +$' + m.earned, 'done');
    if (m.date) add(li, 'div', m.date);
  });
  console.log('[RENDER] Milestones:', list.length);
}

// Auto-load if a session already exists (page refresh)
start();