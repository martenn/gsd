# Claude Code Review Controls

This document explains how to control when Claude reviews your pull requests to manage token usage.

## Control Mechanisms

### 1. Label-Based Control (Primary)

**How it works:** Add the `review:claude` label to a PR to trigger a review.

**Usage:**
1. Open your PR on GitHub
2. Add the label `review:claude` to the PR
3. The workflow will automatically run and post a review

**To create the label (first time only):**
```bash
gh label create "review:claude" --description "Trigger Claude code review" --color "0E8A16"
```

### 2. Manual Trigger

**How it works:** Manually trigger the review workflow for a specific PR.

**Usage:**
1. Go to Actions → Claude Code Review workflow
2. Click "Run workflow"
3. Enter the PR number
4. Optionally check "Force review" to bypass safety checks

**Or via CLI:**
```bash
gh workflow run claude-code-review.yml -f pr_number=123 -f force_review=false
```

## Safety Limits

The workflow has built-in safety checks to prevent excessive token usage:

- **Max PR size:** 500 lines of changes (additions + deletions)
- **Draft PRs:** Automatically skipped unless forced
- **Force override:** Manual triggers can bypass these limits

### Adjusting Limits

Edit the `MAX_CHANGES` constant in `.github/workflows/claude-code-review.yml`:

```javascript
const MAX_CHANGES = 500;  // Adjust this value
```

## Workflow Behavior

### When review runs:
- ✅ PR has `review:claude` label
- ✅ PR is not in draft status
- ✅ PR has ≤500 lines of changes

### When review is skipped:
- ❌ Missing label
- ❌ Draft PR
- ❌ Too many changes

### Notifications:
- If skipped: Workflow posts a comment explaining why and how to trigger
- If completed: Workflow posts confirmation comment

## Recommended Workflow

**For normal PRs:**
1. Create PR (no review yet)
2. When ready for review, add `review:claude` label
3. Review is automatically triggered

**For large PRs:**
1. Create PR
2. Manually trigger with "force review" option if needed
3. Or break into smaller PRs

**For quick iterations:**
- Don't add the label until you're ready for a review
- Use draft PRs while still working on code

## Token Usage Tips

1. **Be selective:** Only request reviews for significant changes
2. **Use drafts:** Keep PRs as drafts while iterating
3. **Combine commits:** Squash/rebase before requesting review
4. **Manual control:** Use the label strategically
5. **Size awareness:** Break large changes into smaller PRs

## Other Claude Workflows

This project has two other Claude-related workflows:

- **`claude.yml`**: Responds to `@claude` mentions in issues/comments
- **`claude-code-review.yml`**: This controlled review workflow (you are here)

The `@claude` workflow is always active but only runs when explicitly mentioned, so it doesn't consume tokens unnecessarily.
