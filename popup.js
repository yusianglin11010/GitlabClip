const domainInput = document.getElementById('domain');
const addBtn = document.getElementById('addBtn');
const statusEl = document.getElementById('status');
const siteList = document.getElementById('siteList');

const DEFAULT_ORIGIN = '*://*.gitlab.com/*';

function showStatus(msg, isError) {
  statusEl.textContent = msg;
  statusEl.className = 'status' + (isError ? ' error' : '');
  if (!isError) setTimeout(() => (statusEl.textContent = ''), 2000);
}

function originForDomain(domain) {
  return `*://${domain}/*`;
}

async function loadSites() {
  const granted = await chrome.permissions.getAll();
  const origins = granted.origins || [];
  siteList.innerHTML = '';

  // Always show default gitlab.com
  const defaultLi = document.createElement('li');
  defaultLi.innerHTML = `<span>*.gitlab.com <span class="default-tag">(default)</span></span>`;
  siteList.appendChild(defaultLi);

  // Show extra origins
  for (const origin of origins) {
    if (origin === DEFAULT_ORIGIN || origin === '<all_urls>') continue;
    const li = document.createElement('li');
    const display = origin.replace(/^\*:\/\//, '').replace(/\/\*$/, '');
    const span = document.createElement('span');
    span.textContent = display;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeSite(origin));
    li.appendChild(span);
    li.appendChild(removeBtn);
    siteList.appendChild(li);
  }
}

async function addSite() {
  let domain = domainInput.value.trim();
  if (!domain) {
    showStatus('Please enter a domain', true);
    return;
  }

  // Clean up input
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  const origin = originForDomain(domain);

  try {
    const granted = await chrome.permissions.request({ origins: [origin] });
    if (granted) {
      showStatus(`Added ${domain}`);
      domainInput.value = '';
      loadSites();
    } else {
      showStatus('Permission denied', true);
    }
  } catch (err) {
    showStatus(err.message, true);
  }
}

async function removeSite(origin) {
  await chrome.permissions.remove({ origins: [origin] });
  loadSites();
}

addBtn.addEventListener('click', addSite);
domainInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addSite();
});

loadSites();
