// Dynamically register content scripts when the user grants new host permissions
chrome.permissions.onAdded.addListener((permissions) => {
  if (permissions.origins && permissions.origins.length > 0) {
    registerContentScripts(permissions.origins);
  }
});

// On install/update, register content scripts for all granted optional origins
chrome.runtime.onInstalled.addListener(async () => {
  const granted = await chrome.permissions.getAll();
  const extraOrigins = (granted.origins || []).filter(
    (o) => !o.includes('gitlab.com')
  );
  if (extraOrigins.length > 0) {
    registerContentScripts(extraOrigins);
  }
});

async function registerContentScripts(origins) {
  // Build match patterns for issues and MRs from granted origins
  const matches = [];
  for (const origin of origins) {
    // origin is like "*://git.example.com/*"
    const base = origin.replace(/\*$/, '').replace(/\/$/, '');
    matches.push(base + '/*/-/issues/*');
    matches.push(base + '/*/-/merge_requests/*');
  }

  // Unregister existing dynamic scripts first to avoid duplicates
  try {
    await chrome.scripting.unregisterContentScripts({ ids: ['gitlabclip-dynamic'] });
  } catch {
    // Ignore if not registered yet
  }

  await chrome.scripting.registerContentScripts([
    {
      id: 'gitlabclip-dynamic',
      matches,
      js: ['content.js'],
      css: ['content.css'],
      runAt: 'document_idle',
    },
  ]);
}
