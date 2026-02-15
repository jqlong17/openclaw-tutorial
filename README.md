# OpenClaw 学习教程网站

OpenClaw 完整学习教程的 VitePress 网站源码。

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 构建
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 部署

### 部署到 Vercel

1. 在 GitHub 创建仓库并推送代码
2. 在 Vercel 导入项目
3. 框架预设选择 "VitePress"
4. 点击部署

### 自定义域名

在 Vercel 项目设置中添加自定义域名。

## 目录结构

```
docs/
├── .vitepress/     # VitePress 配置
├── guide/          # 基础指南
├── platform/       # 平台集成
├── agent/          # AI Agent
├── advanced/       # 高级特性
├── projects/       # 实践项目
└── index.md        # 首页
```

## 贡献

欢迎提交 Issue 和 PR 改进教程内容。

## 许可证

MIT