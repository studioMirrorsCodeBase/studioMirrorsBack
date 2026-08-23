/**
 * db.js
 * -----------------------------------------------------------------------
 * Data access layer for the Video Vault app.
 *
 * CURRENT STATE: Mocked using localStorage so the app runs fully
 * standalone on Netlify with zero backend setup.
 *
 * FUTURE STATE: Swap the internals of getVideos() / addVideo() to call
 * the serverless function at /.netlify/functions/videos, which will
 * talk to the real database (e.g. Netlify Database / Postgres).
 * Because both functions return Promises, app.js will NOT need to
 * change when you make that swap.
 * -----------------------------------------------------------------------
 */

const DB = (() => {
  const STORAGE_KEY = 'videoLinks';

  console.log('[DB INIT] Data layer loaded (mode: localStorage mock).');

  /**
   * Fetch all stored video links.
   * @returns {Promise<string[]>}
   */
  function getVideos() {
    console.log('[DB READ] Request to fetch all videos.');

    return new Promise((resolve) => {
      const raw = localStorage.getItem(STORAGE_KEY);
      const videos = raw ? JSON.parse(raw) : [];
      console.log('[DB READ] Retrieved videos:', videos);
      resolve(videos);
    });

    // ---- FUTURE REAL-DB VERSION (example) ----
    // return fetch('/.netlify/functions/videos')
    //   .then((res) => res.json())
    //   .then((data) => {
    //     console.log('[DB READ] Retrieved videos from API:', data.videos);
    //     return data.videos;
    //   });
  }

  /**
   * Save a new video link.
   * @param {string} link
   * @returns {Promise<void>}
   */
  function addVideo(link) {
    console.log('[DB WRITE] Request to save video:', link);

    return new Promise((resolve, reject) => {
      if (!link || typeof link !== 'string') {
        console.error('[DB WRITE] Invalid link provided:', link);
        reject(new Error('Invalid link'));
        return;
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      const videos = raw ? JSON.parse(raw) : [];
      videos.push(link);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));

      console.log('[DB WRITE] Save successful. Total videos now:', videos.length);
      resolve();
    });

    // ---- FUTURE REAL-DB VERSION (example) ----
    // return fetch('/.netlify/functions/videos', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ link }),
    // }).then((res) => {
    //   if (!res.ok) throw new Error('Failed to save video');
    //   console.log('[DB WRITE] Save successful via API.');
    // });
  }

  return { getVideos, addVideo };
})();
