#!/bin/bash

# 复制所有教程文档到 VitePress 目录

SRC_DIR="/Users/ruska/开源项目/openclaw/docs/openclaw的代码学习"
DST_DIR="/Users/ruska/开源项目/openclaw/docs-site/docs"

# 基础入门（第1-3章）
cp "$SRC_DIR/第1章-OpenClaw概览.md" "$DST_DIR/guide/chapter-01.md"
cp "$SRC_DIR/第2章-环境搭建与安装.md" "$DST_DIR/guide/chapter-02.md"
cp "$SRC_DIR/第3章-第一个Agent.md" "$DST_DIR/guide/chapter-03.md"

# 核心概念（第4-6章）
cp "$SRC_DIR/第4章-消息传输流程.md" "$DST_DIR/guide/chapter-04.md"
cp "$SRC_DIR/第5章-网关架构.md" "$DST_DIR/guide/chapter-05.md"
cp "$SRC_DIR/第6章-通道抽象层.md" "$DST_DIR/guide/chapter-06.md"

# 平台集成（第7-11章）
cp "$SRC_DIR/第7章-Discord集成深度解析.md" "$DST_DIR/platform/chapter-07.md"
cp "$SRC_DIR/第8章-Discord高级功能与最佳实践.md" "$DST_DIR/platform/chapter-08.md"
cp "$SRC_DIR/第9章-Telegram集成深度解析.md" "$DST_DIR/platform/chapter-09.md"
cp "$SRC_DIR/第10章-飞书集成深度解析.md" "$DST_DIR/platform/chapter-10.md"
cp "$SRC_DIR/第11章-iMessage集成深度解析.md" "$DST_DIR/platform/chapter-11.md"

# AI Agent（第12-15章）
cp "$SRC_DIR/第12章-Agent运行器.md" "$DST_DIR/agent/chapter-12.md"
cp "$SRC_DIR/第13章-工具系统.md" "$DST_DIR/agent/chapter-13.md"
cp "$SRC_DIR/第14章-记忆系统RAG.md" "$DST_DIR/agent/chapter-14.md"
cp "$SRC_DIR/第15章-媒体理解.md" "$DST_DIR/agent/chapter-15.md"

# 高级特性（第16-20章）
cp "$SRC_DIR/第16章-定时任务系统.md" "$DST_DIR/advanced/chapter-16.md"
cp "$SRC_DIR/第17章-插件系统.md" "$DST_DIR/advanced/chapter-17.md"
cp "$SRC_DIR/第18章-多节点部署.md" "$DST_DIR/advanced/chapter-18.md"
cp "$SRC_DIR/第19章-安全与权限.md" "$DST_DIR/advanced/chapter-19.md"
cp "$SRC_DIR/第20章-性能优化.md" "$DST_DIR/advanced/chapter-20.md"

# 实践项目（第21-24章）
cp "$SRC_DIR/第21章-实践项目概述与入门项目.md" "$DST_DIR/projects/chapter-21.md"
cp "$SRC_DIR/第22章-进阶级项目.md" "$DST_DIR/projects/chapter-22.md"
cp "$SRC_DIR/第23章-高级项目.md" "$DST_DIR/projects/chapter-23.md"
cp "$SRC_DIR/第24章-企业智能中台.md" "$DST_DIR/projects/chapter-24.md"

echo "所有文档复制完成！"
echo ""
echo "文件列表："
find "$DST_DIR" -name "chapter-*.md" | sort