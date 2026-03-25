# GitlabClip - Chrome Extension Plan

## Context

建立一個極簡的 Chrome Extension，在 GitLab 的 Issue 和 Merge Request 頁面的標題旁注入一個複製按鈕。點擊後將標題與 URL 以 Markdown 超連結格式 `[Title](URL)` 複製到剪貼簿。

## File Structure

```
GitlabClip/
  manifest.json       # Manifest V3 設定
  content.js          # Content script（核心邏輯）
  content.css         # 注入按鈕的樣式
  icons/
    icon16.png        # 16x16 圖示
    icon48.png        # 48x48 圖示
    icon128.png       # 128x128 圖示
```

無 background script、無 popup、無 build tool、無 framework。純 vanilla JS/CSS。

## Implementation Steps

### Step 1: 建立 `manifest.json`
- Manifest V3
- Content script match patterns: `*://*.gitlab.com/*/-/issues/*` 和 `*://*.gitlab.com/*/-/merge_requests/*`
- 不需要額外 permissions（clipboard write 在 user gesture 下的 content script 中可直接使用）
- `run_at: "document_idle"`

### Step 2: 建立 `icons/` 圖示
- 使用簡單的 SVG 轉 PNG，或以 canvas 生成 16/48/128 三種尺寸
- 以剪貼簿/連結為主題的簡易圖示

### Step 3: 建立 `content.css`
- `.gitlabclip-btn` — 透明背景、28x28px、與 GitLab UI 融合
- Hover 狀態：淺灰背景
- 成功狀態 `.gitlabclip-btn--success`：綠色（#217645）

### Step 4: 建立 `content.js` — 核心邏輯

**4a. URL 偵測**
```javascript
function isTargetPage() {
  const path = window.location.pathname;
  return /\/-\/issues\/\d+/.test(path) || /\/-\/merge_requests\/\d+/.test(path);
}
```

**4b. 標題擷取（cascading selector 策略）**
1. `[data-testid="issue-title"]` / `[data-testid="merge-request-title"]`（最穩定）
2. `h1.title`（class fallback）
3. `document.title` 去除 ` · GitLab` 後綴（最終 fallback）

**4c. Markdown 特殊字元跳脫**
- 跳脫 `[`, `]`, `(`, `)` 避免破壞連結格式

**4d. 按鈕注入**
- 使用 inline SVG 作為圖示（copy icon / checkmark icon）
- `titleEl.insertAdjacentElement('afterend', btn)` 插入於標題後方
- 避免重複注入：檢查 `.gitlabclip-btn` 是否已存在

**4e. 剪貼簿複製**
- 主要：`navigator.clipboard.writeText(markdown)`
- Fallback：建立暫時 textarea + `document.execCommand('copy')`

**4f. 視覺回饋**
- 複製成功後圖示切換為綠色勾勾，1.5 秒後恢復

**4g. SPA 導航處理**
- `MutationObserver` 監聽 `document.body`，當按鈕消失時重新注入
- 使用 `requestAnimationFrame` 節流避免效能問題
- 監聽 `turbo:load` / `turbolinks:load` 事件

### Step 5: 更新 `README.md`
- 加入安裝說明（chrome://extensions → 載入未封裝擴充功能）
- 加入使用說明

## Key Files to Create/Modify
- `manifest.json` — 新建
- `content.js` — 新建
- `content.css` — 新建
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` — 新建
- `README.md` — 更新

## Verification
1. 在 Chrome 載入未封裝擴充功能 (`chrome://extensions` → Developer mode → Load unpacked)
2. 開啟任意 GitLab Issue 頁面 → 確認標題旁出現複製按鈕
3. 點擊按鈕 → 確認剪貼簿內容為 `[Issue Title](URL)`
4. 開啟 GitLab MR 頁面 → 同樣驗證
5. 在 Issue/MR 之間切換（SPA 導航）→ 確認按鈕正確重新注入
6. 測試標題含 `[]()` 等特殊字元時是否正確跳脫
