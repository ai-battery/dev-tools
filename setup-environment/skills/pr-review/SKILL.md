---
name: pr-review
description: Expert code review skill for pull requests and local changes. Use when asked to review a PR, review code, check a pull request, conduct code review, give feedback on changes, resolve review comments, or audit code quality. Provides GitHub workflow automation, severity classification, expert decision trees for edge cases, and constructive feedback patterns.
---

# PR Review

Expert-level code review guidance focusing on decision-making, edge cases, and workflow automation. This skill provides what Claude doesn't inherently know: GitHub CLI workflows, severity heuristics, and expert judgment for non-obvious situations.

## Quick Start

```bash
# Remote PR
PR=${1:-$(gh pr view --json number -q '.number')}
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
gh pr checkout $PR
gh pr view $PR --json title,body,additions,deletions,changedFiles,labels

# Local changes
git diff --stat && git diff
```

## Review Workflow

### Phase 0: Get Changed Files and Line Numbers

Before reviewing, get the list of changed files with their line numbers:

```bash
# List all changed files
gh pr diff $PR --name-only

# Get full diff with line numbers (for identifying comment locations)
gh pr diff $PR

# Get diff for a specific file
gh pr diff $PR -- path/to/file.ts

# Get structured file changes with line ranges
gh api repos/$REPO/pulls/$PR/files | jq '.[] | {
  filename: .filename,
  status: .status,
  additions: .additions,
  deletions: .deletions,
  patch: .patch
}'
```

**Reading the diff output**: Line numbers in `@@` headers show where to place comments:
```
@@ -15,6 +15,8 @@  <- Old file started at line 15, new file at line 15
```
- Use the RIGHT side line number (after `+`) for commenting on new/modified code
- Use the LEFT side line number (after `-`) for commenting on deleted code

### Phase 1: Triage (before reading code)

```bash
# Check size - if >400 lines, consider requesting split
gh pr view $PR --json additions,deletions | jq '.additions + .deletions'

# Check CI status - don't waste time if build is broken
gh pr checks $PR

# Read project conventions
cat CLAUDE.md .claude/CLAUDE.md AGENTS.md CONTRIBUTING.md 2>/dev/null | head -100
```

**Triage Decision Tree**:

```
PR Size Check:
├─ <100 lines → Full detailed review
├─ 100-400 lines → Standard review
├─ 400-800 lines → Request split OR time-box to 60min
└─ >800 lines → Block until split (unless mechanical refactor)
```

### Phase 2: Review and Feedback

**Severity Classification** (use consistently):

| Label          | When to Use                                             | Author Action |
| -------------- | ------------------------------------------------------- | ------------- |
| `[blocking]`   | Security holes, data loss, breaking changes, logic bugs | Must fix      |
| `[important]`  | Performance issues, missing error handling, test gaps   | Should fix    |
| `[suggestion]` | Better patterns, refactoring opportunities              | Consider      |
| `[nit]`        | Style, naming, minor improvements                       | Optional      |
| `[question]`   | Unclear intent, need context                            | Explain       |
| `[praise]`     | Excellent work worth highlighting                       | None          |

**Feedback Format**:

```markdown
**[severity]** One-line summary

Why this matters: [impact explanation]

Suggested fix: [concrete solution or alternative]
```

### Phase 3: Add Inline Comments

Place comments directly on specific lines in the PR diff. This is the preferred way to give feedback - comments appear exactly where the issue is.

```bash
# First, get the commit SHA (required for inline comments)
COMMIT_SHA=$(gh api repos/$REPO/pulls/$PR --jq '.head.sha')

# Single inline comment on a specific line
gh api repos/$REPO/pulls/$PR/comments \
  --method POST \
  -f commit_id="$COMMIT_SHA" \
  -f path="<file-path-from-diff>" \
  -F line=<line-number> \
  -f side="RIGHT" \
  -f body="**[severity]** <your comment based on actual code review>"

# Multi-line comment (for a range of lines)
gh api repos/$REPO/pulls/$PR/comments \
  --method POST \
  -f commit_id="$COMMIT_SHA" \
  -f path="<file-path-from-diff>" \
  -F start_line=<start-line> \
  -F line=<end-line> \
  -f side="RIGHT" \
  -f body="**[severity]** <your comment about this code block>"
```

**Required parameters for inline comments:**
- `commit_id` - The SHA of the PR's head commit
- `path` - File path relative to repo root (get from `gh pr diff --name-only`)
- `line` - Line number in the file (get from diff `@@` headers)
- `side` - `"RIGHT"` for new/modified code, `"LEFT"` for deleted code

```bash
# Comment on deleted code (use side="LEFT")
gh api repos/$REPO/pulls/$PR/comments \
  --method POST \
  -f commit_id="$COMMIT_SHA" \
  -f path="<file-path-from-diff>" \
  -F line=<line-number-in-old-file> \
  -f side="LEFT" \
  -f body="**[question]** <ask why this code was removed>"
```

### Phase 4: Submit Review with Multiple Inline Comments

Submit a complete review with multiple inline comments in one API call:

```bash
# Get commit SHA first
COMMIT_SHA=$(gh api repos/$REPO/pulls/$PR --jq '.head.sha')

# Submit review with multiple inline comments
# Replace placeholders with actual file paths, line numbers, and comments from your review
gh api repos/$REPO/pulls/$PR/reviews \
  --method POST \
  -f commit_id="$COMMIT_SHA" \
  --input - <<EOF
{
  "body": "## Summary\n<your overall assessment>\n\n## Required Changes\n- <list issues found>",
  "event": "REQUEST_CHANGES",
  "comments": [
    {
      "path": "<file-path>",
      "line": <line-number>,
      "side": "RIGHT",
      "body": "**[blocking]** <issue description and suggested fix>"
    },
    {
      "path": "<another-file-path>",
      "line": <line-number>,
      "side": "RIGHT",
      "body": "**[suggestion]** <improvement idea>"
    }
  ]
}
EOF

# For approval
gh api repos/$REPO/pulls/$PR/reviews \
  --method POST \
  -f commit_id="$COMMIT_SHA" \
  --input - <<EOF
{
  "body": "## Summary\n<positive assessment>\n\n## Strengths\n- <what's good>\n\nApproved - ready to merge.",
  "event": "APPROVE",
  "comments": []
}
EOF
```

**Review events**:
- `APPROVE` - Approve the PR
- `REQUEST_CHANGES` - Block until issues fixed
- `COMMENT` - Neutral feedback, no approval decision

### Phase 5: Quick Review Commands (without inline comments)

For simple approvals/rejections without inline comments:

```bash
# Approve
gh pr review $PR --approve --body "$(cat <<'EOF'
## Summary
[1-2 sentences]

## Strengths
- [what's good]

Approved - ready to merge.
EOF
)"

# Request changes
gh pr review $PR --request-changes --body "$(cat <<'EOF'
## Summary
[1-2 sentences]

## Required Changes
- **[blocking]** [issue]

Please address blocking items before merge.
EOF
)"
```

## Responding to Existing Comments

```bash
# Fetch all review comments with file locations
gh api repos/$REPO/pulls/$PR/comments | jq '.[] | {id, path, line, body: .body[0:100]}'

# Fetch unresolved comment threads
gh api repos/$REPO/pulls/$PR/comments | jq '[.[] | select(.in_reply_to_id == null)] | .[] | {id, path, line, body: .body[0:100]}'

# Reply to a specific comment (threaded reply)
gh api repos/$REPO/pulls/$PR/comments \
  --method POST \
  -f body="Fixed in abc123." \
  -F in_reply_to=COMMENT_ID
```

**Reply Templates** (keep professional, no emojis):

| Situation | Response                                                 |
| --------- | -------------------------------------------------------- |
| Fixed     | `Fixed in [hash]. [one-line explanation]`                |
| Won't fix | `Won't fix: [reason]. [link to discussion if needed]`    |
| By design | `By design: [explanation of intent]`                     |
| Deferred  | `Deferred to #[issue]. Will address in [timeframe].`     |
| Disagree  | `Let's discuss: [your perspective]. [specific question]` |

## Complete Review Workflow

Follow these steps to review a PR with inline comments:

```bash
# 1. Set up variables
PR=$(gh pr view --json number -q '.number')
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
COMMIT_SHA=$(gh api repos/$REPO/pulls/$PR --jq '.head.sha')

# 2. Get list of changed files
gh pr diff $PR --name-only

# 3. Review each file's diff to find line numbers
gh pr diff $PR -- <file-path>
# Look at @@ headers to determine line numbers:
# @@ -10,5 +10,8 @@ means changes start at line 10 in the new file

# 4. For each issue found, post an inline comment
gh api repos/$REPO/pulls/$PR/comments \
  --method POST \
  -f commit_id="$COMMIT_SHA" \
  -f path="<file-path>" \
  -F line=<line-number> \
  -f side="RIGHT" \
  -f body="**[severity]** <description of issue and suggested fix>"

# 5. After reviewing all files, submit the overall review
gh api repos/$REPO/pulls/$PR/reviews \
  --method POST \
  -f commit_id="$COMMIT_SHA" \
  -f body="## Summary
<your overall assessment based on the actual changes>

## Required Changes
- <list the blocking issues you found>

Please address before merging." \
  -f event="REQUEST_CHANGES"
```

**Notes:**
- You cannot use `REQUEST_CHANGES` on your own PR - use `COMMENT` instead
- Always base your comments on the actual code in the diff, not hypothetical issues
- Use the severity labels consistently: `[blocking]`, `[important]`, `[suggestion]`, `[nit]`, `[question]`, `[praise]`

## Expert Decision Trees

### When to Approve vs Request Changes

```
Should I approve?
├─ Any [blocking] issues? → Request Changes
├─ Multiple [important] issues? → Request Changes
├─ Only [nit] and [suggestion]? → Approve with comments
├─ Only [question] items? → Comment (no approval decision)
└─ Clean review? → Approve
```

### When Author Disagrees

```
Author pushes back on feedback:
├─ Security/correctness issue?
│   └─ Stand firm. "I understand, but [specific risk]. Let's get [expert] to weigh in."
├─ Design/architecture disagreement?
│   └─ Provide data or benchmark. If equal, defer to author (they maintain it).
├─ Style preference?
│   └─ If no project standard exists, let it go. File issue to establish standard.
└─ You might be wrong?
    └─ Say "Good point, I hadn't considered that. Approved." (builds trust)
```

### Large PR Strategies

```
PR is >400 lines and author won't split:
├─ Mechanical refactor (renames, moves)?
│   └─ Verify no behavior change, spot-check, approve
├─ Generated code (migrations, types)?
│   └─ Verify generation source, check edge cases only
├─ Critical deadline?
│   └─ Review carefully, require split as follow-up PR
├─ Mix of changes?
│   └─ Block. "I can review X today if you split Y into separate PR."
└─ Author is senior/trusted?
    └─ Trust but verify critical paths, approve with spot-checks
```

### Multiple Reviewers Conflict

```
Another reviewer approved but you have concerns:
├─ [blocking] issue they missed?
│   └─ Add your review, explain concern, don't approve
├─ Different opinion on approach?
│   └─ Comment, let author decide, don't block
├─ They approved without reviewing?
│   └─ Do your review anyway, your comments stand
└─ You're more junior?
    └─ Still comment! Fresh eyes catch different things
```

## NEVER Do When Reviewing

- **NEVER approve without reading every changed line** - "LGTM" without review erodes trust
- **NEVER leave [blocking] without a suggested fix** - blocking without helping is gatekeeping
- **NEVER use [blocking] for style preferences** - that's what [nit] is for
- **NEVER review for >60 minutes straight** - take breaks, attention degrades
- **NEVER forget to check DELETED code** - removals cause bugs too
- **NEVER assume green CI = correct** - tests can be wrong or incomplete
- **NEVER comment on the person** - "This function is confusing" not "You wrote confusing code"
- **NEVER request changes on issues that exist in surrounding code you didn't write**
- **NEVER approve your own PR without a second reviewer** - self-review is blind review
- **NEVER block a PR for issues you can't articulate** - if you can't explain it, it's not blocking
- **NEVER leave a review half-done** - finish or don't start

## Pre-Merge Verification

```bash
# Quick pre-merge check
gh pr checks $PR && \
gh pr view $PR --json reviewDecision -q '.reviewDecision' && \
gh api repos/$REPO/pulls/$PR/comments | jq '[.[] | select(.in_reply_to_id == null)] | length'
```

**Approve only when**:

- All [blocking] resolved
- All [important] resolved or explicitly deferred
- CI green
- No unresolved conversations (or explicitly acknowledged)

## Review Dynamics by Seniority

| Your Level | Reviewing Junior    | Reviewing Peer    | Reviewing Senior                  |
| ---------- | ------------------- | ----------------- | --------------------------------- |
| Junior     | Rare                | Focus on learning | Ask questions, learn patterns     |
| Mid        | Teach, be patient   | Normal review     | Focus on correctness, not style   |
| Senior     | Mentor, explain why | Normal review     | Trust more, verify critical paths |

**Key insight**: When reviewing up, focus on correctness and security. When reviewing down, focus on teaching and patterns.
