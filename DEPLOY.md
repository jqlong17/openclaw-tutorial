# 部署指南

## 方式一：部署到 Vercel（推荐）

### 1. 准备代码

```bash
# 确保所有文档已复制
./copy-docs.sh

# 初始化 git 仓库
git init
git add .
git commit -m "Initial commit: OpenClaw tutorial site"
```

### 2. 创建 GitHub 仓库

1. 登录 GitHub
2. 创建新仓库，如 `openclaw-tutorial`
3. 推送代码：

```bash
git remote add origin https://github.com/yourname/openclaw-tutorial.git
git push -u origin main
```

### 3. 在 Vercel 部署

1. 登录 [Vercel](https://vercel.com)
2. 点击 "Add New Project"
3. 导入 GitHub 仓库
4. 框架预设选择 **VitePress**
5. 点击 "Deploy"

### 4. 自定义域名（可选）

1. 在 Vercel 项目设置中找到 "Domains"
2. 添加你的域名，如 `docs.openclaw.ai`
3. 按提示配置 DNS

---

## 方式二：部署到 Netlify

### 1. 构建站点

```bash
npm install
npm run docs:build
```

### 2. 部署

1. 登录 [Netlify](https://netlify.com)
2. 拖拽 `docs/.vitepress/dist` 文件夹到部署区域
3. 或使用 Git 集成自动部署

---

## 方式三：部署到 GitHub Pages

### 1. 修改配置

```typescript
// docs/.vitepress/config.ts
export default defineConfig({
  base: '/openclaw-tutorial/',  // 仓库名
  // ...
})
```

### 2. 创建 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

### 3. 启用 GitHub Pages

1. 仓库设置 -> Pages
2. Source 选择 "GitHub Actions"

---

## 本地预览

```bash
# 安装依赖
npm install

# 开发模式
npm run docs:dev

# 构建
npm run docs:build

# 预览构建结果
npm run docs:preview
```

---

## 更新文档

当教程内容更新时：

```bash
# 1. 重新复制文档
./copy-docs.sh

# 2. 提交更改
git add .
git commit -m "Update tutorial content"
git push

# 3. 自动部署（Vercel/Netlify）
```

---

## 常见问题

### 搜索不工作？

确保构建了索引：
```bash
npm run docs:build
```

### 图片不显示？

将图片放在 `docs/public/` 目录下

### 自定义样式？

创建 `docs/.vitepress/theme/custom.css`