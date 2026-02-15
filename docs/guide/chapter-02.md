# 第 2 章：快速开始

> 本章将带你快速安装 OpenClaw，并创建第一个简单的 AI Agent。

---

## 2.1 安装 OpenClaw

### 2.1.1 环境要求

- **Node.js** 18+ 
- **npm** 或 **pnpm**
- **Git**（可选，用于克隆示例）

### 2.1.2 安装 CLI

```bash
npm install -g @openclaw/cli
```

安装完成后，验证：

```bash
openclaw --version
```

### 2.1.3 创建第一个项目

```bash
# 创建项目
openclaw init my-first-agent

# 进入目录
cd my-first-agent

# 查看项目结构
ls -la
```

生成的项目结构：

```
my-first-agent/
├── config/           # 配置文件
│   └── openclaw.yaml
├── docs/             # 文档
│   └── welcome.md
├── memory/           # 记忆存储
├── skills/           # 技能插件
├── .env              # 环境变量
└── README.md
```

---

## 2.2 配置 AI 模型

### 2.2.1 获取 API Key

OpenClaw 支持多种 LLM 提供商：

| 提供商 | 获取方式 | 特点 | 计费方式 |
|--------|---------|------|---------|
| **Moonshot** | https://platform.moonshot.cn | 国内可用，Kimi 模型 | 按量付费 |
| **MiniMax** | https://platform.minimaxi.com | 国内可用，包月套餐 | **包月推荐** |
| **OpenAI** | https://platform.openai.com | GPT-4，功能强大 | 按量付费 |
| **Together** | https://together.ai | 开源模型，性价比高 | 按量付费 |

**成本建议**：

OpenClaw 的 Agent 会频繁调用 LLM API，**按量计费可能产生较高费用**。建议：

- **国内用户**：选择 **MiniMax** 的包月套餐，性价比最高
- **轻量使用**：Moonshot（Kimi）按量付费，适合测试
- **企业场景**：MiniMax 或 OpenAI 的企业套餐

**推荐**：新手先用 MiniMax 包月，成本可控。

### 2.2.2 配置环境变量

编辑 `.env` 文件：

```bash
# Moonshot（推荐）
MOONSHOT_API_KEY=your-api-key

# 或 OpenAI
OPENAI_API_KEY=your-api-key
```

### 2.2.3 选择模型

编辑 `config/openclaw.yaml`：

**MiniMax 包月（推荐）**：
```yaml
models:
  default: minimax
  providers:
    minimax:
      apiKey: ${MINIMAX_API_KEY}
      model: MiniMax-M2.1
```

**Moonshot 按量**：
```yaml
models:
  default: moonshot
  providers:
    moonshot:
      apiKey: ${MOONSHOT_API_KEY}
      model: kimi-k2.5
```

**成本对比**：
- MiniMax 包月：¥99/月，无限调用
- Moonshot 按量：约 ¥0.01-0.03/千 tokens
- 如果每天对话 1000 轮，包月更划算

---

## 2.3 创建第一个 Agent

### 2.3.1 定义 Agent 角色

创建 `SOUL.md` 文件：

```markdown
# 我的第一个 Agent

你是「小助手」，一个友好的 AI 助手。

## 能力
1. 回答用户问题
2. 记住对话内容
3. 保持礼貌和专业

## 回复风格
- 简洁明了
- 友好亲切
- 不确定时诚实说明
```

### 2.3.2 配置消息平台

选择你想接入的平台：

**Discord**：
```yaml
channels:
  discord:
    enabled: true
    token: ${DISCORD_BOT_TOKEN}
```

**Telegram**：
```yaml
channels:
  telegram:
    enabled: true
    token: ${TELEGRAM_BOT_TOKEN}
```

**终端测试**（不需要外部平台）：
```yaml
channels:
  terminal:
    enabled: true
```

### 2.3.3 启动 Agent

```bash
# 开发模式
openclaw dev

# 或生产模式
openclaw start
```

看到以下输出表示成功：

```
✓ Agent loaded: my-first-agent
✓ Channel connected: terminal
✓ Ready to receive messages

Type your message and press Enter:
> 
```

---

## 2.4 测试对话

### 2.4.1 终端交互

在终端中输入消息：

```
> 你好
小助手：你好！很高兴见到你，有什么可以帮助你的吗？

> 今天天气怎么样？
小助手：我没有获取天气信息的能力，但可以帮你查资料或解答问题。

> 记住我叫张三
小助手：好的，我会记住你叫张三。

> 我叫什么名字？
小助手：你叫张三，之前告诉我的。
```

### 2.4.2 验证记忆功能

重启 Agent 后再次询问：

```
> 我叫什么名字？
小助手：你叫张三，我们之前聊过。
```

✅ 记忆功能正常工作！

---

## 2.5 添加简单工具

### 2.5.1 什么是工具

工具让 Agent 能够：
- 获取实时信息（天气、股票）
- 执行操作（发送邮件、创建日程）
- 访问外部系统（数据库、API）

### 2.5.2 配置内置工具

编辑 `config/openclaw.yaml`：

```yaml
tools:
  - name: web_search
    enabled: true
    config:
      provider: brave
      apiKey: ${BRAVE_API_KEY}
```

### 2.5.3 测试工具调用

```
> 搜索 OpenClaw 的最新消息
小助手：让我搜索一下...
[调用 web_search 工具]

根据搜索结果，OpenClaw 最近发布了 v2.0 版本，主要更新包括...
```

---

## 2.6 下一步

### 你已经完成

✅ 安装 OpenClaw CLI
✅ 配置 AI 模型
✅ 创建第一个 Agent
✅ 测试对话和记忆
✅ 添加简单工具

### 继续学习

| 章节 | 内容 |
|------|------|
| 第3章 | 深入理解 Agent 配置 |
| 第4章 | 消息传输流程 |
| 第5章 | 网关架构 |
| 第6章 | 通道抽象层 |

### 实践建议

1. **尝试不同平台** - 接入 Discord 或 Telegram
2. **添加更多工具** - 文件读取、代码执行
3. **自定义角色** - 让 Agent 有独特个性
4. **探索记忆系统** - 连接知识库

---

## 常见问题

### Q: 启动失败怎么办？

检查：
1. Node.js 版本是否 18+
2. API Key 是否正确设置
3. 配置文件格式是否正确

### Q: 如何调试？

```bash
# 开启调试模式
openclaw dev --debug

# 查看日志
openclaw logs
```

### Q: 如何停止 Agent？

```bash
# 终端中按 Ctrl+C
# 或查找进程并终止
openclaw stop
```

---

恭喜！你已经成功创建并运行了第一个 OpenClaw Agent。

在下一章，我们将深入探索 Agent 的更多配置选项。
