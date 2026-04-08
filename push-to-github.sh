#!/bin/bash
# 推送 vocab-metro 到 GitHub

cd /Users/peter/.openclaw/workspace-planner/vocab-metro

echo "=== Git 状态 ==="
git status

echo ""
echo "=== 准备推送 ==="
echo "远程仓库:"
git remote -v

echo ""
echo "=== 尝试推送 ==="
git push origin main

echo ""
echo "如果提示输入用户名密码:"
echo "用户名: shencheng1202"
echo "密码: 使用 GitHub Personal Access Token"
