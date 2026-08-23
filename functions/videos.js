/**
 * netlify/functions/videos.js
 * -----------------------------------------------------------------------
 * MOCK serverless function. Not currently called by the app (db.js
 * uses localStorage for now) - this is a placeholder so the folder
 * structure and deploy config are ready for when a real database
 * (e.g. Netlify Database / Postgres) is connected.
 *
 * Once ready:
 *   1. Install @netlify/database and connect a real DB.
 *   2. Replace the mockVideos array below with real queries.
 *   3. Update js/db.js to call this endpoint instead of localStorage
 *      (see the commented-out "FUTURE REAL-DB VERSION" blocks there).
 * -----------------------------------------------------------------------
 */

// Dummy in-memory data, resets on every cold start - for demo purposes only.
let mockVideos = [
  'https://example.com/video1',
  'https://example.com/video2',
];

exports.handler = async (event) => {
  console.log('[FUNCTION] videos.js invoked. HTTP method:', event.httpMethod);

  if (event.httpMethod === 'GET') {
    console.log('[FUNCTION] Returning mock videos:', mockVideos);
    return {
      statusCode: 200,
      body: JSON.stringify({ videos: mockVideos }),
    };
  }

  if (event.httpMethod === 'POST') {
    const { link } = JSON.parse(event.body || '{}');
    console.log('[FUNCTION] Received link to add:', link);

    if (!link) {
      console.warn('[FUNCTION] No link provided in request body.');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing link' }) };
    }

    mockVideos.push(link);
    console.log('[FUNCTION] Mock save successful. Total count:', mockVideos.length);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }

  console.warn('[FUNCTION] Unsupported HTTP method:', event.httpMethod);
  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
