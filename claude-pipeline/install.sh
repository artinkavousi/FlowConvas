#!/usr/bin/env bash
# Spec pipeline installer.
#
# Installs the six flat, hyphenated skills (dev-spec-*) into the skill stores that
# desktop agents actually read:
#   - Verdent:      ~/.verdent/skills/<skill>/SKILL.md   (shown in Customize > Skills, slash menu)
#   - Claude Code:  ~/.claude/skills/<skill>/SKILL.md    (CLI / agent runtime)
# Verdent does NOT support nested skill folders or "/" namespaces, so the skills are
# flat-named (dev-spec-prd, …) and invoked as /dev-spec-prd.
#
# Non-destructive to other skills; refreshes only our six.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/DEV/skills" && pwd)"
SKILLS=(dev-spec-research dev-spec-prd dev-spec-plan dev-spec-build dev-spec-review dev-spec-feature)

say() { printf '  %s\n' "$1"; }

install_into() {
  local store="$1" label="$2"
  [ -d "$store" ] || { say "$label not found ($store) — skipped."; return; }
  mkdir -p "$store/skills"
  for skill in "${SKILLS[@]}"; do
    rm -r "$store/skills/$skill" 2>/dev/null || true
    cp -R "$SRC/$skill" "$store/skills/$skill"
  done
  say "$label: installed ${#SKILLS[@]} skills into $store/skills/"
}

echo "Installing spec pipeline skills (flat dev-spec-*)..."
install_into "${VERDENT_HOME:-$HOME/.verdent}" "Verdent"
install_into "${CLAUDE_HOME:-$HOME/.claude}"   "Claude Code"

echo
echo "Done. Restart the app (or open a new session) to refresh the skill list."
echo "Use in any project via the slash menu:"
echo "  /dev-spec-research → /dev-spec-prd → /dev-spec-plan → /dev-spec-build → /dev-spec-review"
echo "  /dev-spec-feature  (add a feature to an in-flight project)"
echo
echo "Artifacts land in that project's ./spec/ folder."
