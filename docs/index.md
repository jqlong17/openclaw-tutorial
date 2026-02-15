---
layout: home

hero:
  name: "OpenClaw"
  text: "多平台 AI Agent 框架"
  tagline: 一套代码，同时服务 Discord、Telegram、飞书等多个平台。让企业级 AI 助手开发变得简单。
  image:
    src: /logo.svg
    alt: OpenClaw
  actions:
    - theme: brand
      text: 🚀 10 分钟快速开始
      link: /guide/chapter-02
    - theme: alt
      text: 📖 阅读完整教程
      link: /guide/
    - theme: alt
      text: ⭐ GitHub Star
      link: https://github.com/openclaw/openclaw

features:
  - icon: 🎯
    title: 多平台统一接入
    details: 一套代码同时接入 Discord、Telegram、飞书、iMessage。用户从哪个平台来，体验都一致。
  - icon: 🧠
    title: AI Agent 框架
    details: 内置工具调用、记忆系统、多模态理解。让 AI 不仅能聊天，还能真正帮你完成任务。
  - icon: 🏢
    title: 企业级就绪
    details: 网关层设计、多节点部署、安全权限、监控运维。从个人项目到企业级应用无缝扩展。
  - icon: 💰
    title: 成本可控
    details: 智能限流、模型降级、包月套餐支持。避免 AI 调用成本失控，适合大规模部署。
  - icon: 🔌
    title: 生态丰富
    details: 官方支持 10+ 平台，社区贡献 50+ 工具插件。快速对接现有系统。
  - icon: 📦
    title: 私有化部署
    details: 数据完全自主可控，支持本地部署、私有云、混合云。满足企业合规要求。
---

## 为什么选择 OpenClaw？

### 与其他方案对比

| 特性 | ChatGPT | OpenAI API | Coze/扣子 | **OpenClaw** |
|------|---------|-----------|-----------|--------------|
| 多平台接入 | ❌ 仅网页 | ❌ 需自建 | ⚠️ 有限 | ✅ **全平台** |
| 开发成本 | - | 高 | 低 | **中** |
| 自定义能力 | ❌ 无 | ✅ 完整 | ⚠️ 受限 | ✅ **完整** |
| 企业级特性 | ❌ 无 | ❌ 需自建 | ⚠️ 部分 | ✅ **内置** |
| 私有化部署 | ❌ 不可 | ✅ 可 | ❌ 不可 | ✅ **支持** |
| 数据可控 | ❌ 不可 | ✅ 可 | ❌ 不可 | ✅ **完全可控** |

**OpenClaw 的定位**：比直接调用 API 更简单，比低代码平台更灵活，比通用网关更懂 AI。

---

## 架构预览

```
┌─────────────────────────────────────────────────────────┐
│  用户接入层（Discord / Telegram / 飞书 / iMessage）        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  OpenClaw Gateway（网关层）                               │
│  ├─ 多平台统一接入                                        │
│  ├─ 智能路由 & 负载均衡                                    │
│  ├─ 限流熔断 & 安全防护                                    │
│  └─ 监控运维 & 日志追踪                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  AI Agent 运行时                                         │
│  ├─ 角色设定（SOUL.md）                                   │
│  ├─ 工具系统（Tools）                                     │
│  ├─ 记忆系统（Memory）                                    │
│  └─ 多模态理解（Vision/Audio）                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  基础设施层（LLM / 向量数据库 / 文件存储 / 外部 API）        │
└─────────────────────────────────────────────────────────┘
```

**核心设计**：网关层统一处理多平台接入，Agent 层专注 AI 能力，基础设施层提供底层支持。

---

## 快速开始

### 方式一：npm 安装（推荐新手）

```bash
# 安装 CLI
npm install -g @openclaw/cli

# 创建项目
openclaw init my-agent
cd my-agent

# 配置模型（支持 MiniMax 包月、DeepSeek、Kimi 等）
echo "MINIMAX_API_KEY=your-key" > .env

# 启动
openclaw dev
```

### 方式二：源码安装（推荐开发者）

```bash
# 克隆仓库
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖并构建
npm install
npm run build

# 链接到全局
npm link

# 验证
openclaw --version
```

---

## 适用场景

### 👤 个人开发者
- **智能个人助手**：管理日程、记录笔记、查询信息
- **知识管理**：构建个人知识库，智能问答
- **多平台消息管理**：一个助手管理所有平台

### 🏢 企业用户
- **智能客服**：7x24 小时自动回复，复杂问题转人工
- **办公助手**：会议记录、任务分配、数据查询
- **企业知识库**：产品文档智能问答，内部培训

### 🚀 创业公司
- **快速原型验证**：几小时搭建 AI 应用原型
- **产品 MVP**：低成本验证市场需求
- **规模化扩展**：从原型到生产环境无缝升级

---

## 教程结构

本教程共 **24 章**，带你从入门到精通：

| 模块 | 章节 | 核心内容 |
|------|------|---------|
| **基础入门** | 1-3 章 | OpenClaw 概览、环境搭建、第一个 Agent |
| **核心概念** | 4-6 章 | 消息传输、网关架构、通道抽象层 |
| **平台集成** | 7-11 章 | Discord、Telegram、飞书、iMessage 深度集成 |
| **AI Agent** | 12-15 章 | 运行器、工具系统、记忆系统、多模态 |
| **高级特性** | 16-20 章 | 定时任务、插件、多节点、安全、性能 |
| **实践项目** | 21-24 章 | 入门、进阶、高级、企业级完整项目 |

---

## 社区与支持

- 💬 [Discord 社区](https://discord.gg/clawd) - 实时讨论、获取帮助
- 🐙 [GitHub](https://github.com/openclaw/openclaw) - 源码、Issue、PR
- 📚 [官方文档](https://docs.openclaw.ai) - API 参考、配置指南
- 📝 [本教程源码](https://github.com/jqlong17/openclaw-tutorial) - 欢迎贡献

---

## 许可

本教程采用 [MIT 许可证](https://opensource.org/licenses/MIT)

OpenClaw 项目采用 [Apache 2.0 许可证](https://github.com/openclaw/openclaw/blob/main/LICENSE)
