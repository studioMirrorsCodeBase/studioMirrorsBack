/**
 * app.js
 * -----------------------------------------------------------------------
 * UI logic for the Video Vault app. Talks only to the DB module
 * (see db.js) - never touches localStorage or a future API directly.
 * -----------------------------------------------------------------------
 */

console.log('[APP INIT] Video Vault UI script loaded.');

// ---- DOM REFS ----
const linkInput = document.getElementById('linkInput');
const addBtn = document.getElementById('addBtn');
const viewBtn = document.getElementById('viewBtn');
const videoListContainer = document.getElementById('videoListContainer');
const videoList = document.getElementById('videoList');

// ---- ADD LINK ----
addBtn.addEventListener('click', () => {
  const link = linkInput.value.trim();
  console.log('[ADD CLICKED] Raw input value:', link);

  if (!link) {
    console.warn('[ADD ABORTED] Empty input, nothing saved.');
    return;
  }

  DB.addVideo(link)
    .then(() => {
      linkInput.value = '';
      console.log('[ADD SUCCESS] Input cleared, video stored.');
    })
    .catch((err) => {
      console.error('[ADD FAILED]', err);
    });
});

// ---- VIEW VIDEOS ----
viewBtn.addEventListener('click', () => {
  console.log('[VIEW CLICKED] Fetching videos to render.');

  DB.getVideos()
    .then((videos) => {
      renderVideoList(videos);
      videoListContainer.classList.toggle('hidden');
      console.log(
        '[VIEW TOGGLE] List visibility is now:',
        videoListContainer.classList.contains('hidden') ? 'HIDDEN' : 'VISIBLE'
      );
    })
    .catch((err) => {
      console.error('[VIEW FAILED]', err);
    });
});

/**
 * Renders the list of video links into the DOM.
 * @param {string[]} videos
 */
function renderVideoList(videos) {
  videoList.innerHTML = '';

  if (videos.length === 0) {
    videoList.innerHTML = '<li>No videos stored yet.</li>';
    console.log('[RENDER] No videos found.');
    return;
  }

  videos.forEach((link, index) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link;
    li.appendChild(a);
    videoList.appendChild(li);
    console.log(`[RENDER] Added video #${index + 1} to list:`, link);
  });
}
