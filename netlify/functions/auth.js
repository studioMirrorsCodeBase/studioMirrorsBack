/**
 * netlify/functions/auth.js
 * -----------------------------------------------------------------------
 * TEMPORARY single-user login. Runs server-side only, so the credentials
 * are never sent to the browser.
 *   POST   = log in   (body: { user, password })
 *   GET    = who am I (checks the session cookie)
 *   DELETE = log out
 * FUTURE: replace with Netlify Identity; js/dashboard-db.js (Auth) is the
 * only client file that talks to this, so dashboard.js won't need changes.
 * -----------------------------------------------------------------------
 */
const crypto = require('crypto');

// ============================ CHANGE THESE ============================
// Username of the ONE allowed login. Best: set env var VV_USERNAME in Netlify
// (keeps it out of GitHub). Otherwise replace 'CHANGE_ME_USERNAME' below.
const USERNAME = process.env.VV_USERNAME || 'CHANGE_ME_USERNAME';
// Password of the ONE allowed login. Best: set env var VV_PASSWORD in Netlify.
// Otherwise replace 'CHANGE_ME_PASSWORD' below.
const PASSWORD = process.env.VV_PASSWORD || 'CHANGE_ME_PASSWORD';
// =====================================================================

const COOKIE = 'vv_session';
const MAX_AGE = 8 * 60 * 60; // session length in seconds (8 hours)
// Temporary: signing key derived from the credentials (changing either logs everyone out).
const KEY = `${USERNAME}:${PASSWORD}`;

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
});
const sha = (s) => crypto.createHash('sha256').update(s).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b)); // constant-time compare
const sign = (data) => crypto.createHmac('sha256', KEY).update(data).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cookie = (value, age) =>
  `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;

function makeToken() {
  const payload = Buffer.from(JSON.stringify({ user: USERNAME, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** Returns the username if the session cookie is valid, else null. */
function readSession(event) {
  const match = (event.headers.cookie || '').match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!match) return null;
  const [payload, sig] = match[1].split('.');
  if (!payload || !sig || !same(sig, sign(payload))) {
    console.warn('[AUTH] Session rejected: bad signature.');
    return null;
  }
  const { user, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (Date.now() > exp) {
    console.log('[AUTH] Session expired.');
    return null;
  }
  return user;
}

exports.handler = async (event) => {
  console.log('[AUTH] Invoked. Method:', event.httpMethod);

  try {
    // Fail closed if the placeholders were never changed.
    if (USERNAME.startsWith('CHANGE_ME') || PASSWORD.startsWith('CHANGE_ME')) {
      console.error('[AUTH] CONFIG ERROR: username/password not set (env vars or the lines above).');
      return json(500, { error: 'Login is not configured.' });
    }

    if (event.httpMethod === 'GET') {
      const user = readSession(event);
      console.log('[AUTH] Session check:', user ? 'valid' : 'none');
      return user ? json(200, { user }) : json(401, { error: 'Not logged in.' });
    }

    if (event.httpMethod === 'DELETE') {
      console.log('[AUTH] Logout: cookie cleared.');
      return json(200, { ok: true }, { 'Set-Cookie': cookie('', 0) });
    }

    if (event.httpMethod === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        console.warn('[AUTH] Login rejected: body is not valid JSON.');
        return json(400, { error: 'Bad request.' });
      }

      const { user, password } = body;
      if (typeof user !== 'string' || typeof password !== 'string' || !user || !password) {
        console.warn('[AUTH] Login rejected: missing fields.');
        return json(400, { error: 'Enter user name and password.' });
      }

      const userOk = same(user, USERNAME);
      const passOk = same(password, PASSWORD);
      if (!(userOk && passOk)) {
        console.warn('[AUTH] Login FAILED (credentials not logged).');
        await sleep(500); // slows down password guessing
        return json(401, { error: 'Invalid user name or password.' }); // same message for either field
      }

      console.log('[AUTH] Login OK. Session cookie issued.');
      return json(200, { user: USERNAME }, { 'Set-Cookie': cookie(makeToken(), MAX_AGE) });
    }

    console.warn('[AUTH] Unsupported method:', event.httpMethod);
    return json(405, { error: 'Method not allowed.' });
  } catch (err) {
    console.error('[AUTH] Unexpected error:', err);
    return json(500, { error: 'Server error.' });
  }
};
