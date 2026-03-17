#!/bin/sh
# Install Abneg@tion Git hooks
# Run once after clone: ./scripts/install-hooks.sh

HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPTS_DIR="$(git rev-parse --show-toplevel)/scripts/hooks"

echo "Installation des hooks Abneg@tion..."

cp "$SCRIPTS_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
echo "  ✓ pre-commit installé"

cp "$SCRIPTS_DIR/post-merge" "$HOOKS_DIR/post-merge"
chmod +x "$HOOKS_DIR/post-merge"
echo "  ✓ post-merge installé"

echo ""
echo "Hooks actifs. pre-commit bloque les unicode escapes et console.log."
echo "post-merge lance le QA agent après chaque merge sur main."
