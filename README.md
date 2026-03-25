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

The extension automatically works on any GitLab instance (including self-hosted) by detecting GitLab's URL pattern (`/-/issues/` and `/-/merge_requests/`). No additional configuration is needed.
