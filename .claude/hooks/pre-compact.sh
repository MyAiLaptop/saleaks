#!/bin/bash
# Pre-compaction hook: Updates CLAUDE.md with recent uncommitted changes

cd "$(dirname "$0")/../.."

# Get current date
DATE=$(date +"%Y-%m-%d %H:%M")

# Check if there are uncommitted changes
if git diff --quiet && git diff --cached --quiet; then
    echo "No uncommitted changes to document"
    exit 0
fi

# Get list of modified files
MODIFIED_FILES=$(git diff --name-only HEAD 2>/dev/null)
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null)

# Only proceed if CLAUDE.md exists
if [ ! -f "CLAUDE.md" ]; then
    echo "CLAUDE.md not found"
    exit 0
fi

# Check if there's already a "Pending Changes" section
if grep -q "## Pending Changes (Pre-Compaction)" CLAUDE.md; then
    # Remove old pending changes section
    sed -i '/## Pending Changes (Pre-Compaction)/,/^## [^P]/{ /^## [^P]/!d; }' CLAUDE.md
fi

# Append pending changes section
cat >> CLAUDE.md << EOF

## Pending Changes (Pre-Compaction)

**Last updated:** $DATE

### Modified Files:
$(echo "$MODIFIED_FILES" "$STAGED_FILES" | sort -u | sed 's/^/- /')

### Summary:
Review git diff for details on what changed in this session.

EOF

echo "Updated CLAUDE.md with pending changes"
