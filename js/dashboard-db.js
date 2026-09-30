/**
 * dashboard-db.js
 * Mocked auth + dashboard data (localStorage / in-memory).
 * FUTURE: swap internals for fetch('/.netlify/functions/...') calls.
 * Both APIs return Promises (or plain values for session), so
 * dashboard.js will NOT need to change.
 */

const Auth = (() => {
  const KEY = 'videoVaultSession';
  console.log('[AUTH INIT] Mock auth loaded (localStorage).');

  // Mock: any non-empty user + password is accepted. Password is never stored or logged.
  function login(user, password) {
    console.log('[AUTH LOGIN] Attempt for user:', user);
    return new Promise((resolve, reject) => {
      if (!user || !password) return reject(new Error('Enter user name and password.'));
      localStorage.setItem(KEY, JSON.stringify({ user }));
      console.log('[AUTH LOGIN] Session created.');
      resolve({ user });
    });
  }

  function getSession() {
    const raw = localStorage.getItem(KEY);
    const session = raw ? JSON.parse(raw) : null;
    console.log('[AUTH SESSION]', session ? 'Active for ' + session.user : 'None');
    return session;
  }

  function logout() {
    localStorage.removeItem(KEY);
    console.log('[AUTH LOGOUT] Session cleared.');
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
