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
        // CHANGE HERE: set to true once work begins (or return real data from a function).
        workStarted: false,
        // CHANGE HERE: payee name and currency shown in the "Mode of Payment" popup.
        payment: { name: 'Longe Longe', currency: 'XAF', currencyName: 'Central African CFA franc' },
        // Empty until work starts; same shape as before so render code needs no change.
        total: 0, scheduled: 0,
        week: { count: 0, goal: 0 },
        target: { week: 0, earned: 0, goal: 0 },
        videos: [],
        milestones: [],
      };
      console.log('[DASH READ] Data ready. workStarted:', data.workStarted, '| Videos:', data.videos.length);
      resolve(data);
    });
  }

  return { getDashboard };
})();