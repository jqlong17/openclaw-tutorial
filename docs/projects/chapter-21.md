# 第 21 章：实践项目概述与入门项目

> 本章将介绍 OpenClaw 的实践项目设计思路，并完成两个入门项目。

---

## 21.1 项目设计思路

### 21.1.1 OpenClaw 核心优势

根据前面章节的学习，OpenClaw 的核心优势：

| 优势 | 说明 | 应用场景 |
|------|------|----------|
| **多平台统一** | 一个 Agent 管理多个平台 | 跨平台消息同步、统一客服 |
| **AI Agent 能力** | 工具调用 + 记忆 + 多模态 | 智能助手、自动化任务 |
| **定时任务** | Cron + 隔离执行 | 日报、提醒、监控 |
| **多节点部署** | 分布式 + 负载均衡 | 高可用服务、大规模处理 |
| **插件扩展** | 灵活的钩子机制 | 定制化功能、第三方集成 |

### 21.1.2 项目分级

```
实践项目（4个级别）
├── 入门级（第21章）
│   ├── 智能客服机器人
│   └── 个人知识助手
├── 进阶级（第22章）
│   ├── 跨平台消息同步助手
│   └── 智能日报生成器
├── 高级（第23章）
│   ├── 分布式 AI 协作团队
│   └── 智能生活管家
└── 企业级（第24章）
    └── 企业智能中台
```

---

## 21.2 项目一：智能客服机器人

### 21.2.1 项目概述

**目标**：为网站/产品创建一个智能客服机器人，支持多平台接入。

**功能**：
- 自动回答常见问题
- 人工客服转接
- 问题分类和记录
- 满意度收集

**技术栈**：
- OpenClaw 核心
- Discord/Telegram 接入
- 向量数据库（FAQ）
- 工具系统（转接人工）

### 21.2.2 实现步骤

**步骤1：准备 FAQ 知识库**

```markdown
<!-- knowledge/faq.md -->

## 常见问题

### 产品价格
Q: 你们的产品多少钱？
A: 我们提供三种套餐：
- 基础版：¥99/月
- 专业版：¥299/月
- 企业版：¥999/月

### 退款政策
Q: 支持退款吗？
A: 支持7天无理由退款。请联系客服处理。

### 技术支持
Q: 遇到技术问题怎么办？
A: 
1. 查看帮助文档：https://docs.example.com
2. 在社区提问：https://community.example.com
3. 联系人工客服：发送 "人工"
```

**步骤2：配置 Agent**

```markdown
<!-- SOUL.md -->

你是智能客服助手 "小智"，专门为用户解答产品相关问题。

## 职责
1. 基于知识库回答用户问题
2. 无法回答时引导至人工客服
3. 记录用户反馈

## 回复规则
- 语气友好、专业
- 回答简洁，不超过3点
- 不确定时回答："这个问题我需要确认一下，请稍等或联系人工客服"

## 转人工规则
用户发送以下关键词时，调用 transfer_to_human 工具：
- "人工"
- "客服"
- "找人工"
- "转人工"
```

**步骤3：实现转人工工具**

```typescript
// tools/transfer-to-human.ts

export function transferToHumanTool(): Tool {
  return {
    definition: {
      name: 'transfer_to_human',
      description: '将对话转接给人工客服',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: '转接原因',
          },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            default: 'medium',
          },
        },
        required: ['reason'],
      },
    },
    
    async execute(params) {
      // 1. 记录转接信息
      await logTicket({
        userId: context.userId,
        reason: params.reason,
        urgency: params.urgency,
        conversationHistory: context.history,
      });
      
      // 2. 通知人工客服
      await notifyHumanAgents({
        channel: 'support-channel',
        message: `新工单：${params.reason}（优先级：${params.urgency}）`,
        userId: context.userId,
      });
      
      // 3. 返回转接结果
      return {
        success: true,
        message: '已为您转接人工客服，请稍等...',
        estimatedWaitTime: '5分钟',
      };
    },
  };
}
```

**步骤4：配置记忆系统**

```json
{
  "memory": {
    "enabled": true,
    "sources": ["knowledge/faq.md"],
    "search": {
      "topK": 3,
      "minScore": 0.7
    }
  }
}
```

**步骤5：部署到多平台**

```yaml
# config/channels.yaml
channels:
  discord:
    enabled: true
    token: ${DISCORD_BOT_TOKEN}
    intents: [GuildMessages, DirectMessages]
    
  telegram:
    enabled: true
    token: ${TELEGRAM_BOT_TOKEN}
    
  website:
    enabled: true
    widget: true
    embedCode: |
      <script src="https://api.openclaw.ai/widget.js"
              data-agent-id="customer-service-bot"></script>
```

### 21.2.3 运行效果

```
用户：你们的产品多少钱？

小智：我们提供三种套餐：
• 基础版：¥99/月
• 专业版：¥299/月  
• 企业版：¥999/月

需要我详细介绍某个套餐吗？

---

用户：人工

小智：已为您转接人工客服，请稍等...
预计等待时间：5分钟

[系统通知] 工单 #1234 已创建，分配给客服小王
```

---

## 21.3 项目二：个人知识助手

### 21.3.1 项目概述

**目标**：打造专属的个人知识管理助手，帮你整理笔记、回答问题、生成摘要。

**功能**：
- 笔记自动整理和标签化
- 基于笔记回答问题
- 生成每日/每周知识摘要
- 跨设备同步

**技术栈**：
- OpenClaw 核心
- 记忆系统（RAG）
- 定时任务
- iMessage/Telegram 接入

### 21.3.2 实现步骤

**步骤1：笔记目录结构**

```
notes/
├── daily/           # 每日笔记
│   ├── 2024-01-15.md
│   └── 2024-01-16.md
├── projects/        # 项目笔记
│   ├── project-a.md
│   └── project-b.md
├── ideas/           # 灵感想法
│   └── ideas.md
└── reading/         # 读书笔记
    └── book-notes.md
```

**步骤2：配置记忆系统**

```json
{
  "memory": {
    "enabled": true,
    "sources": ["notes/**/*.md"],
    "watch": true,
    "chunking": {
      "strategy": "semantic",
      "maxChunkSize": 500
    },
    "search": {
      "hybrid": true,
      "vectorWeight": 0.7,
      "textWeight": 0.3
    }
  }
}
```

**步骤3：创建笔记工具**

```typescript
// tools/note-tools.ts

// 添加笔记
export function addNoteTool(): Tool {
  return {
    definition: {
      name: 'add_note',
      description: '添加一条笔记',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          category: {
            type: 'string',
            enum: ['daily', 'project', 'idea', 'reading'],
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['content', 'category'],
      },
    },
    
    async execute(params) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const filename = params.category === 'daily'
        ? `notes/daily/${today}.md`
        : `notes/${params.category}/${params.tags?.[0] || 'untitled'}.md`;
      
      const note = `
## ${format(new Date(), 'HH:mm')}

${params.content}

${params.tags ? `标签: ${params.tags.join(', ')}` : ''}
`;
      
      await appendFile(filename, note);
      
      // 触发记忆系统重新索引
      await context.memory.reindex(filename);
      
      return { success: true, filename };
    },
  };
}

// 搜索笔记
export function searchNotesTool(): Tool {
  return {
    definition: {
      name: 'search_notes',
      description: '搜索笔记内容',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', default: 5 },
        },
        required: ['query'],
      },
    },
    
    async execute(params) {
      const results = await context.memory.search({
        query: params.query,
        topK: params.limit,
      });
      
      return {
        results: results.map(r => ({
          content: r.content,
          source: r.path,
          relevance: r.score,
        })),
      };
    },
  };
}
```

**步骤4：配置定时摘要任务**

```json
{
  "cron": {
    "jobs": [
      {
        "name": "daily-summary",
        "schedule": { "kind": "cron", "expr": "0 21 * * *" },
        "type": "agentTurn",
        "payload": {
          "message": "请基于今天的笔记生成一份知识摘要，包括：1.今日记录的主要内容 2.关键知识点 3.待办事项",
          "model": "kimi-coding/k2p5"
        },
        "delivery": {
          "mode": "announce",
          "channel": "telegram",
          "to": "my-chat-id"
        }
      },
      {
        "name": "weekly-review",
        "schedule": { "kind": "cron", "expr": "0 20 * * 0" },
        "type": "agentTurn",
        "payload": {
          "message": "请生成本周知识回顾，包括：1.本周学习总结 2.知识关联分析 3.下周建议关注的内容"
        }
      }
    ]
  }
}
```

**步骤5：配置 Agent 角色**

```markdown
<!-- SOUL.md -->

你是个人知识助手 "记忆精灵"，帮助主人管理和回顾知识。

## 能力
1. 记录和整理笔记
2. 基于历史笔记回答问题
3. 生成知识摘要和关联

## 交互方式
- 主人说"记录：xxx" → 调用 add_note 保存
- 主人问"关于xxx" → 调用 search_notes 搜索后回答
- 每天21:00自动生成日报
- 每周日生成周报

## 回复风格
- 简洁明了
- 主动关联相关知识
- 适时提醒待办事项
```

### 21.3.3 运行效果

```
主人：记录：今天学习了 OpenClaw 的记忆系统，使用 RAG 技术

记忆精灵：已保存到笔记 ✓
位置：notes/daily/2024-01-16.md
标签建议：#openclaw #rag #学习笔记

---

主人：关于 RAG 我之前学过什么？

记忆精灵：根据你的笔记，关于 RAG 你有以下内容：

1. **2024-01-10** - 学习了向量数据库基础
   "向量嵌入将文本转换为高维向量..."

2. **2024-01-15** - 了解了 Embedding 模型
   "OpenAI text-embedding-3-small..."

3. **今天** - OpenClaw 记忆系统
   "使用 RAG 技术..."

看起来你正在系统学习 RAG 技术，建议整理一份完整的知识图谱。

---

[每晚21:00自动推送]
📚 今日知识摘要

今日记录：3条笔记
• OpenClaw 记忆系统学习
• 项目A进度更新
• 读书笔记：《深度学习》

关键知识点：
1. RAG = 检索增强生成
2. 向量检索 + 全文检索混合

待办事项：
□ 整理 RAG 学习笔记
□ 完成项目A文档
```

---

## 21.4 本章小结

本章完成了两个入门项目：

1. **智能客服机器人** - 展示多平台接入 + 知识库问答
2. **个人知识助手** - 展示记忆系统 + 定时任务

**关键技能**：
- 工具开发
- 记忆系统配置
- 定时任务设置
- 多平台部署

---

*下一章：第 22 章 进阶级项目（跨平台消息同步助手、智能日报生成器）*
