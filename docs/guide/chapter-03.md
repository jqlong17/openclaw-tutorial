# 第 3 章：理解 Agent 配置

> 本章将深入讲解 OpenClaw Agent 的配置方式，帮助你理解如何定制自己的 AI 助手。

---

## 3.1 Agent 是什么

### 3.1.1 从用户角度看

想象你在和一个智能助手对话：

```
你：帮我查一下明天的会议安排

Agent：好的，我查一下您的日历...
      明天上午 10 点有产品评审会
      下午 2 点有技术分享会
      需要我帮您准备什么吗？

你：记住我偏好早上开会

Agent：好的，已记录您的偏好。
      以后安排会议时我会优先建议上午时间。
```

这个助手能：
- **理解你的意图**（查日程、记录偏好）
- **调用工具**（查询日历）
- **记住信息**（你的偏好）
- **保持对话连贯**（上下文理解）

这就是 Agent。

### 3.1.2 从技术角度看

Agent = AI 模型 + 工具 + 记忆 + 角色设定

```
用户消息
    ↓
【角色设定】决定 Agent 的性格和能力范围
    ↓
【AI 模型】理解意图，决定如何回应
    ↓
【工具系统】调用外部功能获取信息
    ↓
【记忆系统】保存和检索历史信息
    ↓
生成回复
```

---

## 3.2 Agent 的核心配置

### 3.2.1 角色设定（SOUL.md）

这是 Agent 的"人格定义文件"，决定：
- 它是谁（名字、身份）
- 它能做什么（能力范围）
- 它怎么说话（语言风格）

**示例：客服助手**

```markdown
# 客服助手 "小服"

你是智能客服助手，专门帮助用户解答产品问题。

## 身份
- 名字：小服
- 所属：OpenClaw 产品团队
- 职责：解答用户疑问，处理常见问题

## 能力
1. 查询订单状态
2. 解答产品功能问题
3. 引导用户提交工单
4. 收集用户反馈

## 回复风格
- 专业、礼貌、耐心
- 先确认理解用户问题
- 不确定时主动询问
- 复杂问题引导至人工

## 限制
- 不能处理退款（引导至人工）
- 不能修改订单信息（引导至人工）
- 不涉及技术实现细节
```

**为什么重要？**

同样的 AI 模型，不同的角色设定，表现完全不同：

| 角色 | 用户问"你好" | 回复风格 |
|------|-------------|---------|
| 客服 | "您好！有什么可以帮助您的？" | 专业礼貌 |
| 朋友 | "嗨！好久不见，最近咋样？" | 轻松随意 |
| 导师 | "你好，今天想学习什么？" | 耐心引导 |

### 3.2.2 模型选择

决定 Agent 的"大脑"用什么。截至2026年，主流模型包括：

| 模型 | 特点 | 适用场景 | 成本 |
|------|------|---------|------|
| **Gemini 3 Pro** | Google 最新旗舰，原生多模态，理解图片/视频/音频 | 复杂多模态任务、创意生成 | 较高 |
| **Claude 4** | Anthropic 最新，推理能力极强，代码能力强 | 代码生成、逻辑推理、长文档 | 高 |
| **GPT-5** | OpenAI 最新，综合能力最强 | 通用任务、复杂对话 | 最高 |
| **Kimi K2.5** |  Moonshot，中文优秀，长上下文 | 中文场景、长文档处理 | 中等 |
| **MiniMax M2.1** | 国内厂商，包月套餐，性价比高 | 高频调用、成本敏感 | 低（包月） |
| **DeepSeek V3** | 深度求索，推理强，价格低 | 代码、数学、逻辑任务 | 低 |

**2026年选型建议**：

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| **多模态理解** | Gemini 3 Pro | 原生支持图文视频，效果最佳 |
| **代码生成** | Claude 4 或 DeepSeek V3 | 代码能力强，逻辑清晰 |
| **中文对话** | Kimi K2.5 或 MiniMax | 中文优化好，成本低 |
| **成本敏感** | MiniMax 包月 或 DeepSeek | 包月无限调用，或按量极低价 |
| **通用场景** | GPT-5 或 Claude 4 | 综合能力最强，但成本最高 |

**成本对比（2026年2月）**：

| 模型 | 输入价格 | 输出价格 | 备注 |
|------|---------|---------|------|
| GPT-5 | $5/百万 tokens | $15/百万 tokens | 最强但最贵 |
| Claude 4 | $3/百万 tokens | $15/百万 tokens | 推理强 |
| Gemini 3 Pro | $1.25/百万 tokens | $5/百万 tokens | 多模态 |
| Kimi K2.5 | ¥0.012/千 tokens | ¥0.012/千 tokens | 中文友好 |
| MiniMax M2.1 | ¥99/月 无限调用 | - | 包月最省 |
| DeepSeek V3 | ¥0.001/千 tokens | ¥0.002/千 tokens | 性价比之王 |

**配置示例**：

```yaml
# 多模态场景 - Gemini 3 Pro
model: gemini-3-pro

# 代码生成 - Claude 4
model: claude-4-sonnet

# 中文场景 - Kimi
model: kimi-k2.5

# 成本敏感 - MiniMax 包月
model: minimax-m2.1

# 性价比 - DeepSeek
model: deepseek-v3
```

### 3.2.3 工具配置

决定 Agent 能调用哪些外部功能：

**常见工具类型**：

| 工具 | 功能 | 示例场景 |
|------|------|---------|
| **web_search** | 搜索网络信息 | 用户问"最新新闻" |
| **read_file** | 读取文件内容 | 用户问"总结这份文档" |
| **send_email** | 发送邮件 | 用户说"发邮件给张三" |
| **query_database** | 查询数据库 | 用户问"上个月销售额" |
| **create_calendar_event** | 创建日程 | 用户说"明天下午开会" |

**配置示例**：

```yaml
tools:
  # 启用搜索工具
  - name: web_search
    enabled: true
    
  # 启用文件读取
  - name: read_file
    enabled: true
    
  # 启用邮件发送
  - name: send_email
    enabled: true
    config:
      smtp_server: smtp.example.com
```

**工具调用流程**：

```
用户：查一下北京天气

Agent 思考：
1. 用户需要天气信息
2. 我有 web_search 工具可以查天气
3. 调用工具，搜索"北京天气"
4. 获取结果
5. 组织语言回复用户

Agent：北京今天晴，25°C，空气质量良...
```

### 3.2.4 记忆配置

决定 Agent 能记住什么：

**短期记忆**（对话上下文）
- 自动维护，无需配置
- 记住当前对话的历史
- 多轮对话保持连贯

**长期记忆**（知识库）
- 需要配置存储位置
- 记住用户偏好、历史信息
- 支持文档检索

**配置示例**：

```yaml
memory:
  # 启用长期记忆
  enabled: true
  
  # 存储方式
  storage: sqlite  # 或 postgres、chroma
  
  # 知识库文档
  sources:
    - ./docs/knowledge-base.md
    - ./docs/product-docs/
```

**记忆应用场景**：

```
场景一：用户偏好
用户：我喜欢简洁的回复
Agent：好的，我会保持简洁。
（一周后）
用户：查一下天气
Agent：北京，晴，25°C。
（记住了"简洁"偏好）

场景二：知识库问答
用户：OpenClaw 支持哪些平台？
Agent：根据文档，支持 Discord、Telegram、飞书...
（从知识库检索答案）
```

---

## 3.3 完整配置示例

### 3.3.1 个人助手配置

适合个人使用的全能助手：

```yaml
# config.yaml

agent:
  name: "小助手"
  description: "你的个人智能助手"
  
  # AI 模型
  model: kimi-k2.5
  
  # 角色设定文件
  soul: ./SOUL.md
  
  # 启用的工具
  tools:
    - web_search      # 搜索信息
    - read_file       # 读取文件
    - write_file      # 写文件
    - send_email      # 发邮件
    - create_reminder # 创建提醒
  
  # 记忆配置
  memory:
    enabled: true
    storage: sqlite
    sources:
      - ./my-notes/   # 个人笔记

channels:
  # 终端交互（本地测试）
  terminal:
    enabled: true
  
  # Telegram（可选）
  telegram:
    enabled: false
    token: ${TELEGRAM_TOKEN}
```

### 3.3.2 企业客服配置

适合企业场景的客服机器人：

```yaml
# config.yaml

agent:
  name: "客服小助手"
  description: "OpenClaw 产品客服"
  
  # 使用稳定的模型
  model: gpt-4
  
  # 专业客服角色
  soul: ./customer-service-soul.md
  
  # 客服专用工具
  tools:
    - query_order      # 查询订单
    - search_knowledge # 搜索知识库
    - create_ticket    # 创建工单
    - transfer_human   # 转人工
  
  # 企业级记忆
  memory:
    enabled: true
    storage: postgres  # 企业数据库
    sources:
      - ./kb/product-docs/    # 产品文档
      - ./kb/faq/             # FAQ
      - ./kb/troubleshooting/ # 故障排查

channels:
  # 网站嵌入
  web_widget:
    enabled: true
  
  # 企业微信
  wecom:
    enabled: true
    corp_id: ${WECOM_CORP_ID}
  
  # 飞书
  lark:
    enabled: true
    app_id: ${LARK_APP_ID}
```

---

## 3.4 配置调试技巧

### 3.4.1 从简单开始

不要一次性配置太多功能：

1. **第一步**：基础对话（不配置工具）
2. **第二步**：添加 1-2 个核心工具
3. **第三步**：启用记忆功能
4. **第四步**：接入消息平台

### 3.4.2 常见问题

**Agent 回复不准确？**
- 检查角色设定是否清晰
- 考虑更换更强的模型
- 添加更多示例到 SOUL.md

**工具调用失败？**
- 检查工具配置参数
- 查看日志中的错误信息
- 确认 API Key 有效

**记忆不工作？**
- 检查存储路径是否正确
- 确认文档格式支持
- 查看向量数据库连接

### 3.4.3 调试模式

开启调试查看详细日志：

```bash
# 开发模式，显示详细日志
openclaw dev --debug

# 查看工具调用过程
openclaw dev --verbose
```

---

## 3.5 本章小结

### 核心概念

1. **Agent = AI 模型 + 工具 + 记忆 + 角色设定**
2. **角色设定（SOUL.md）** 决定 Agent 的人格和能力范围
3. **模型选择** 影响 Agent 的智能水平和成本
4. **工具配置** 决定 Agent 能做什么
5. **记忆配置** 决定 Agent 能记住什么

### 配置层次

```
基础层：模型选择（决定智能水平）
  ↓
角色层：SOUL.md（决定人格风格）
  ↓
能力层：工具配置（决定功能范围）
  ↓
数据层：记忆配置（决定知识储备）
  ↓
接入层：消息平台（决定使用场景）
```

### 下一步

在下一章，我们将深入了解：
- 消息是如何从用户传递到 Agent 的
- OpenClaw 的内部处理流程
- 如何调试和优化消息传输

---

## 参考资源

- 配置文档：https://docs.openclaw.ai/config
- 示例配置：https://github.com/openclaw/examples
- 模型选择指南：https://docs.openclaw.ai/models
