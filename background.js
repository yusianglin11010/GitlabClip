// Get extra (non-gitlab.com) origins that the user has granted
async function getExtraOrigins() {
  const granted = await chrome.permissions.getAll();
  return (granted.origins || []).filter(
    (o) => o !== '<all_urls>' && !o.includes('gitlab.com')
  );
}

// Register dynamic content scripts for extra origins
async function registerAllDynamicScripts() {
  const extraOrigins = await getExtraOrigins();

  try {
    await chrome.scripting.unregisterContentScripts();
  } catch {
    // Ignore if none registered
  }

  if (extraOrigins.length === 0) return;

  await chrome.scripting.registerContentScripts([
    {
      id: 'gitlabclip-dynamic',
      matches: extraOrigins,
      js: ['content.js'],
      css: ['content.css'],
      runAt: 'document_idle',
    },
  ]);
}

// Programmatic injection as fallback for browsers where dynamic registration is unreliable
function matchesOrigin(url, origins) {
  try {
    const { hostname } = new URL(url);
    return origins.some((origin) => {
      // origin is like "*://git.example.com/*"
      const hostPart = origin.replace(/^\*:\/\//, '').replace(/\/\*$/, '');
      // Handle wildcard subdomains like "*.gitlab.com"
      if (hostPart.startsWith('*.')) {
        return hostname.endsWith(hostPart.slice(1)) || hostname === hostPart.slice(2);
      }
      return hostname === hostPart;
    });
  } catch {
    return false;
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const extraOrigins = await getExtraOrigins();
  if (extraOrigins.length === 0) return;
  if (!matchesOrigin(tab.url, extraOrigins)) return;

  // Check if content script is already injected
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!document.querySelector('.gitlabclip-btn') || !!window.__gitlabclip_injected,
    });
    if (results[0]?.result) return;
  } catch {
    return; // No permission for this tab
  }

  // Inject content script and CSS
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch {
    // Ignore injection errors
  }
});

// Re-register on every service worker startup
registerAllDynamicScripts();

// Also register when new permissions are granted
chrome.permissions.onAdded.addListener(() => {
  registerAllDynamicScripts();
});

// And on install/update
chrome.runtime.onInstalled.addListener(() => {
  registerAllDynamicScripts();
});
