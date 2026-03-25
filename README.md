# GitlabClip

Clip GitLab resource title and URL as Markdown hyperlink format.

## Supported Resources

- Issue
- Merge Request

## Output Format

Clicking the copy button produces:

```markdown
[Issue/MR Title](https://gitlab.com/group/project/-/issues/123)
```

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `GitlabClip` folder
5. Navigate to any GitLab Issue or MR page — a copy icon will appear next to the title

## Self-hosted GitLab

By default, the extension only runs on `*.gitlab.com`. To enable it on a self-hosted GitLab instance:

1. Go to `chrome://extensions/` and find **GitlabClip**
2. Click **Details**
3. Under **Site access**, add your GitLab domain
4. The extension will automatically start working on the added domain
