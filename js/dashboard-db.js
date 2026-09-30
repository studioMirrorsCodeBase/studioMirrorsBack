/**
 * dashboard-db.js
 * Auth = real server-side login via /.netlify/functions/auth.
 * DashDB = still mock data. FUTURE: swap for a function that checks the session.
 */

const Auth = (() => {
  const ENDPOINT = '/.netlify/functions/auth';
  console.log('[AUTH INIT] Server-side auth (Netlify function).');

  /** Calls the auth function. Resolves { ok, data }; throws only if the server is unreachable. */
  async function call(method, body) {
    console.log('[AUTH CALL]', method);
    try {
      const res = await fetch(ENDPOINT, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: body && JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      console.log('[AUTH CALL] Status:', res.status);
      return { ok: res.ok, data };
    } catch (err) {
      console.error('[AUTH CALL] Network error:', err);
      throw new Error('Cannot reach the server. Try again.');
    }
  }

  async function login(user, password) {
    console.log('[AUTH LOGIN] Attempt.');
    const { ok, data } = await call('POST', { user, password });
    if (!ok) throw new Error(data.error || 'Login failed.');
    return data;
  }

  /** @returns {Promise<{user:string}|null>} */
  async function getSession() {
    const { ok, data } = await call('GET');
    console.log('[AUTH SESSION]', ok ? 'Active for ' + data.user : 'None');
    return ok ? data : null;
  }

  async function logout() {
    await call('DELETE');
    console.log('[AUTH LOGOUT] Done.');
  }

  return { login, getSession, logout };
})();

const DashDB = (() => {
  /** @returns {Promise<object>} dashboard data for the given user */
  function getDashboard(user) {
    console.log('[DASH READ] Fetching dashboard for:', user);
    return new Promise((resolve) => {
      const data = {
        user,
        total: 365, scheduled: 123,
        week: { count: 45, goal: 45 },
        target: { week: 7, earned: 2500, goal: 2500 },
        videos: [
          { id: 'VID-001', title: 'Morning Dance Routine - Beginner', platform: 'Instagram', date: 'Sept 5, 2024', status: 'Scheduled', caption: 'Build confidence...', tags: '#dance', link: 'https://example.com/1', issue: false },
          { id: 'VID-002', title: 'Confidence Building Series #1', platform: 'TikTok', date: 'Sept 6, 2024', status: 'In Progress', caption: 'Dance at your...', tags: '#confidence', link: 'https://example.com/2', issue: false },
          { id: 'VID-003', title: 'Teacher Tips - Posture Basics', platform: 'YouTube', date: 'Sept 7, 2024', status: 'Posted', caption: 'Master the basics...', tags: '#tips', link: 'https://example.com/3', issue: false },
          { id: 'VID-004', title: 'Home Dance Challenge Week 1', platform: 'Instagram', date: 'Sept 8, 2024', status: 'Verified', caption: 'Join our week...', tags: '#challenge', link: 'https://example.com/4', issue: false },
          { id: 'VID-005', title: 'Student Success Story', platform: 'TikTok', date: 'Sept 9, 2024', status: 'Not Started', caption: 'Real transformation...', tags: '#story', link: 'https://example.com/5', issue: true },
        ],
        milestones: [
          { title: 'Week 2: 90 Videos', state: 'COMPLETED', earned: 500, date: 'Sept 12, 2024' },
          { title: 'Week 4: 180 Videos', state: 'COMPLETED', earned: 500, date: 'Sept 26, 2024' },
          { title: 'Week 7: 270 Videos', state: 'IN PROGRESS' },
          { title: 'Week 10: 365 Videos', state: 'UPCOMING' },
        ],
      };
      console.log('[DASH READ] Mock data ready. Videos:', data.videos.length);
      resolve(data);
    });
  }

  return { getDashboard };
})();