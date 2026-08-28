#!/bin/sh
branch="$(git branch --show-current)"
protected="main master"
for b in $protected; do
  if [ "$branch" = "$b" ]; then
    echo ""
    echo "husky - BLOCKED: direct work on branch '$branch' is not allowed."
    echo "         Create a feature branch first, e.g.: git checkout -b feat/my-change"
    exit 1
  fi
done
