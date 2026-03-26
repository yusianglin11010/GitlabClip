// === Constants ===
const BUTTON_CLASS = 'gitlabclip-btn';
const SUCCESS_CLASS = 'gitlabclip-btn--success';
const FEEDBACK_DURATION = 1500;

const COPY_ICON_URL = chrome.runtime.getURL('icons/copy.svg');
const CHECK_ICON_URL = chrome.runtime.getURL('icons/check.svg');

// === URL Detection ===
function isTargetPage() {
  const path = window.location.pathname;
  return /\/-\/issues\/\d+/.test(path) || /\/-\/merge_requests\/\d+/.test(path);
}

// === Title Extraction ===
function escapeMarkdown(text) {
  return text.replace(/([[\]()])/g, '\\$1');
}

function getTitle() {
  const byTestId = document.querySelector(
    '[data-testid="issue-title"], [data-testid="merge-request-title"], [data-testid="work-item-title"], [data-testid="title-content"]'
  );
  if (byTestId) return byTestId.textContent.trim();

  const byClass = document.querySelector('h1.title');
  if (byClass) return byClass.textContent.trim();

  const byHeader = document.querySelector('.detail-page-header h1, .merge-request h1');
  if (byHeader) return byHeader.textContent.trim();

  return document.title.replace(/\s*[·\-|].*$/, '').trim();
}

// === Clipboard ===
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// === UI ===
function createIcon(url) {
  const img = document.createElement('img');
  img.src = url;
  img.width = 16;
  img.height = 16;
  img.className = 'gitlabclip-icon';
  return img;
}

function showSuccess(btn) {
  btn.replaceChildren(createIcon(CHECK_ICON_URL));
  btn.classList.add(SUCCESS_CLASS);
  setTimeout(() => {
    btn.replaceChildren(createIcon(COPY_ICON_URL));
    btn.classList.remove(SUCCESS_CLASS);
  }, FEEDBACK_DURATION);
}

async function handleCopy(event) {
  event.preventDefault();
  event.stopPropagation();

  const btn = event.currentTarget;
  const title = escapeMarkdown(getTitle());
  const url = window.location.href;
  const markdown = `[${title}](${url})`;

  await copyToClipboard(markdown);
  showSuccess(btn);
}

// === Dark Mode Detection ===
function isDarkMode() {
  // GitLab's own dark mode class
  if (document.body.classList.contains('gl-dark')) return true;
  if (document.documentElement.classList.contains('gl-dark')) return true;

  // Detect by actual background color luminance
  const bg = getComputedStyle(document.body).backgroundColor;
  const match = bg.match(/\d+/g);
  if (match) {
    const [r, g, b] = match.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  return false;
}

function applyTheme(btn) {
  btn.classList.toggle('gitlabclip-btn--dark', isDarkMode());
}

// === Injection ===
function findTitleElement() {
  return (
    document.querySelector('[data-testid="issue-title"], [data-testid="merge-request-title"], [data-testid="work-item-title"], [data-testid="title-content"]') ||
    document.querySelector('h1.title')
  );
}

function injectButton() {
  if (!isTargetPage()) return;
  if (document.querySelector('.' + BUTTON_CLASS)) return;

  const titleEl = findTitleElement();
  if (!titleEl) return;

  const btn = document.createElement('button');
  btn.className = BUTTON_CLASS;
  btn.title = 'Copy as Markdown link';
  btn.appendChild(createIcon(COPY_ICON_URL));
  btn.addEventListener('click', handleCopy);
  applyTheme(btn);

  titleEl.insertAdjacentElement('beforeend', btn);
}

// === SPA Navigation ===
let pendingCheck = false;

function scheduleCheck() {
  if (pendingCheck) return;
  pendingCheck = true;
  requestAnimationFrame(() => {
    pendingCheck = false;
    if (!document.querySelector('.' + BUTTON_CLASS) && isTargetPage()) {
      injectButton();
    }
  });
}

function observePageChanges() {
  const observer = new MutationObserver(() => scheduleCheck());
  observer.observe(document.body, { childList: true, subtree: true });
}

// === Entry Point ===
function init() {
  if (window.__gitlabclip_injected) return;
  window.__gitlabclip_injected = true;
  injectButton();
  observePageChanges();
  document.addEventListener('turbo:load', () => injectButton());
  document.addEventListener('turbolinks:load', () => injectButton());
}

init();
