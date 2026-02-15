# 第 6 章：通道抽象层

> 本章将讲解 OpenClaw 如何统一接入不同的消息平台，让你理解平台适配器的设计原理。

---

## 6.1 平台接入的挑战

### 6.1.1 现实世界的比喻

想象你要同时管理三家不同的餐厅：

**Discord 餐厅**：
- 顾客通过对讲机点餐（WebSocket 实时通信）
- 菜单是英文的
- 服务员叫 "Bot"
- 有大厅（服务器）和包间（频道）

**Telegram 餐厅**：
- 顾客每隔几秒打电话询问（HTTP 轮询）
- 菜单是多语言的
- 服务员也叫 "Bot"
- 有圆桌（群组）和讨论区（话题）

**飞书餐厅**：
- 顾客通过小程序下单（Webhook）
- 菜单是企业定制的
- 服务员叫 "应用"
- 有工作群和审批流程

**问题**：
- 每家餐厅的点餐方式不同
- 菜单格式不同
- 服务员培训内容不同
- 你怎么统一管理？

**解决方案**：请一个"万能店长"

```
Discord 顾客 ──┐
Telegram 顾客 ─┼──→ 万能店长 ──→ 后厨（你的业务逻辑）
飞书顾客 ─────┘      ↑
                  统一处理：
                  - 不管哪家餐厅来的，都转成标准订单
                  - 后厨只需要会一种做法
                  - 店长负责对接各餐厅的特殊要求
```

这个"万能店长"就是 OpenClaw 的**通道抽象层**。

### 6.1.2 技术层面的差异

用技术语言描述，各平台的差异：

| 方面 | Discord | Telegram | 飞书 |
|------|---------|----------|------|
| **协议** | WebSocket | HTTP 长轮询 / Webhook | Webhook |
| **认证** | Bot Token | Bot Token | App ID + Secret |
| **消息格式** | JSON | JSON | JSON（结构不同） |
| **富媒体** | 支持 | 支持 | 支持（卡片） |
| **群组管理** | 服务器+频道 | 群组+话题 | 群+线程 |
| **API 限制** | 120/分钟 | 30/秒 | 100/分钟 |

**如果没有抽象层**：

```
你的业务逻辑
    ↓
需要同时处理：
- Discord 的 WebSocket 连接
- Telegram 的 HTTP 轮询
- 飞书的 Webhook 验证
- 每个平台的特殊消息格式
- 各自的限流策略

结果：代码混乱，难以维护
```

### 6.1.3 抽象层的价值

通道抽象层（Channel Abstraction Layer）解决这些问题：

```
┌─────────────────────────────────────────┐
│           你的业务逻辑                   │
│      （只处理统一的消息格式）              │
└─────────────────┬───────────────────────┘
                  │ 统一接口
┌─────────────────▼───────────────────────┐
│         通道抽象层（Channel Layer）      │
│    屏蔽平台差异，提供统一接入能力          │
└─────────────────┬───────────────────────┘
                  │ 平台特定实现
┌─────────────────▼───────────────────────┐
│  Discord  │  Telegram  │    飞书       │
│  Adapter  │  Adapter   │   Adapter    │
└─────────────────────────────────────────┘
```

**核心价值**：

| 价值 | 说明 | 生活类比 |
|------|------|---------|
| **一次开发** | 业务逻辑写一次，支持所有平台 | 厨师学会一道菜，三家餐厅都能卖 |
| **易于扩展** | 新增平台只需添加适配器 | 新开一家餐厅，只需培训一个店长 |
| **降低复杂度** | 不用关心平台细节 | 厨师专心做菜，不用管顾客从哪家店来 |
| **统一维护** | 平台变更只需改适配器 | 餐厅装修，只需店长适应，厨师不变 |

**实际场景示例**：

假设你运营一个 AI 助手，同时服务三个平台的用户：

**没有抽象层的情况**：
```
周一：Discord 用户反馈问题
- 你需要改 Discord 相关的代码
- 测试 Discord 的功能
- 担心改坏了 Telegram 和飞书的部分

周三：Telegram 更新了 API
- 你需要学习新 API
- 修改 Telegram 相关代码
- 重新测试所有功能

周五：想接入 Slack
- 需要重新开发一套逻辑
- 复制粘贴现有代码
- 维护两套相似的代码

结果：70% 时间在处理平台差异，30% 时间在做业务
```

**使用 OpenClaw 抽象层**：
```
周一：Discord 用户反馈问题
- 修改一次业务逻辑
- 自动应用到所有平台

周三：Telegram 更新了 API
- 只需要更新 Telegram 适配器
- 业务逻辑完全不用动

周五：想接入 Slack
- 添加 Slack 适配器（已有模板）
- 业务逻辑自动支持

结果：90% 时间在做业务，10% 时间处理平台相关
```

---

## 6.2 抽象层设计

### 6.2.1 统一消息格式

所有平台的消息都转换为标准格式：

```typescript
// 标准消息结构
interface StandardMessage {
  // 消息唯一标识
  id: string;
  
  // 来源平台
  platform: 'discord' | 'telegram' | 'lark' | ...;
  
  // 发送者信息
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  
  // 消息内容
  content: {
    type: 'text' | 'image' | 'file' | 'card';
    text?: string;
    attachments?: Attachment[];
  };
  
  // 会话上下文
  context: {
    channelId: string;
    threadId?: string;
    isGroup: boolean;
  };
  
  // 时间戳
  timestamp: number;
}
```

> **源码参考**：消息类型定义 `src/types/message.ts`

### 6.2.2 适配器接口

每个平台适配器实现统一接口：

```typescript
// 适配器接口定义
interface ChannelAdapter {
  // 平台名称
  readonly platform: string;
  
  // 初始化连接
  initialize(config: AdapterConfig): Promise<void>;
  
  // 接收消息（平台 → OpenClaw）
  onMessage(handler: (msg: StandardMessage) => void): void;
  
  // 发送消息（OpenClaw → 平台）
  sendMessage(channelId: string, content: MessageContent): Promise<void>;
  
  // 关闭连接
  disconnect(): Promise<void>;
}
```

**适配器的工作方式**：

继续用餐厅比喻：

```
Discord 餐厅（适配器）：
- 对讲机收到订单（WebSocket 消息）
- 店长把对讲机内容转成标准订单格式
- 交给后厨处理
- 后厨做好后，店长把标准格式转回对讲机语言

Telegram 餐厅（适配器）：
- 电话收到订单（HTTP 请求）
- 店长把电话内容转成标准订单格式
- 交给后厨处理
- 后厨做好后，店长把标准格式转回电话语言

飞书餐厅（适配器）：
- 小程序收到订单（Webhook）
- 店长把小程序内容转成标准订单格式
- 交给后厨处理
- 后厨做好后，店长把标准格式转回小程序语言

关键：后厨（你的业务逻辑）永远只处理标准格式
```

**技术实现**：

每个适配器只需要做两件事：
1. **接收时**：把平台格式 → 标准格式
2. **发送时**：把标准格式 → 平台格式

```typescript
// Discord 适配器示例
class DiscordAdapter {
  // 收到 Discord 消息时
  onMessage(discordMsg) {
    // 转换：Discord 格式 → 标准格式
    const standardMsg = {
      id: discordMsg.id,
      platform: 'discord',
      sender: { id: discordMsg.author.id, name: discordMsg.author.username },
      content: { type: 'text', text: discordMsg.content },
      // ... 其他字段
    };
    
    // 交给业务逻辑处理
    handleMessage(standardMsg);
  }
  
  // 发送回复时
  sendReply(standardContent) {
    // 转换：标准格式 → Discord 格式
    const discordContent = {
      content: standardContent.text,
      embeds: standardContent.cards
    };
    
    // 调用 Discord API 发送
    discordAPI.send(discordContent);
  }
}
```

> **源码参考**：适配器接口 `src/channels/adapter-interface.ts`，Discord 适配器 `src/discord/adapter.ts`

### 6.2.3 平台特性映射

不同平台的相似功能如何映射？

| 功能 | Discord | Telegram | 飞书 |
|------|---------|----------|------|
| **单聊** | DM（私信） | Private Chat | 单聊 |
| **群聊** | Server + Channel | Group + Topic | 群 + 线程 |
| **@提及** | @username | @username | @用户名 |
| **回复** | Reply | Reply | 回复 |
| **表情回应** | Reaction | Reaction | 表情回复 |
| **富文本** | Embed | Markdown + 按钮 | 卡片消息 |

**映射示例**：

```
OpenClaw 标准格式          Discord          Telegram         飞书
─────────────────────────────────────────────────────────────────
replyTo: messageId    →  message_reference  reply_to_message  parent_id
mentions: [...]       →  mentions           entities          at_users
attachments: [...]    →  attachments        document          files
card: {...}           →  embed              inline_keyboard   card
```

---

## 6.3 适配器实现原理

### 6.3.1 Discord 适配器

**连接方式**：WebSocket

```
Discord 服务器 ←──WebSocket──→ Discord Adapter
                                    ↓
                              转换为标准消息
                                    ↓
                              发送给 Gateway
```

**特点**：
- 实时双向通信
- 支持消息编辑、删除事件
- 支持表情回应、线程管理

**消息转换示例**：

```typescript
// Discord 消息 → 标准消息
function toStandard(discordMsg): StandardMessage {
  return {
    id: discordMsg.id,
    platform: 'discord',
    sender: {
      id: discordMsg.author.id,
      name: discordMsg.author.username,
      avatar: discordMsg.author.avatarURL(),
    },
    content: {
      type: 'text',
      text: discordMsg.content,
      attachments: discordMsg.attachments.map(a => ({
        name: a.name,
        url: a.url,
        type: a.contentType,
      })),
    },
    context: {
      channelId: discordMsg.channelId,
      threadId: discordMsg.thread?.id,
      isGroup: discordMsg.guild !== null,
    },
    timestamp: discordMsg.createdTimestamp,
  };
}
```

> **源码参考**：Discord 适配器 `src/discord/adapter.ts`

### 6.3.2 Telegram 适配器

**连接方式**：HTTP 长轮询 或 Webhook

```
方式一：长轮询
Telegram 服务器 ←──HTTP 轮询──→ Telegram Adapter
（每 1-30 秒请求一次）

方式二：Webhook
Telegram 服务器 ──POST 请求──→ Telegram Adapter
（实时推送）
```

**特点**：
- 支持 Bot API 的所有功能
- 支持内联键盘、回复键盘
- 支持话题（Topic）管理

**消息转换示例**：

```typescript
// Telegram 消息 → 标准消息
function toStandard(tgMsg): StandardMessage {
  return {
    id: String(tgMsg.message_id),
    platform: 'telegram',
    sender: {
      id: String(tgMsg.from.id),
      name: tgMsg.from.first_name,
    },
    content: {
      type: 'text',
      text: tgMsg.text || '',
    },
    context: {
      channelId: String(tgMsg.chat.id),
      threadId: tgMsg.message_thread_id,
      isGroup: tgMsg.chat.type !== 'private',
    },
    timestamp: tgMsg.date * 1000, // Telegram 使用秒级时间戳
  };
}
```

> **源码参考**：Telegram 适配器 `src/telegram/adapter.ts`

### 6.3.3 飞书适配器

**连接方式**：Webhook

```
飞书服务器 ──POST 请求──→ 飞书 Adapter
                              ↓
                        验证签名
                              ↓
                        转换为标准消息
```

**特点**：
- 企业级功能丰富
- 支持卡片消息、审批流程
- 支持群机器人、应用机器人

**安全验证**：

```typescript
// 飞书请求签名验证
function verifySignature(body: string, signature: string, secret: string): boolean {
  const timestamp = Date.now();
  const signString = `${timestamp}\n${secret}`;
  const computed = crypto.createHmac('sha256', secret)
    .update(signString)
    .digest('base64');
  return signature === computed;
}
```

> **源码参考**：飞书适配器 `src/lark/adapter.ts`

---

## 6.4 添加新平台

### 6.4.1 实现步骤

如果你想接入一个新的消息平台（如 Slack）：

**第一步：创建适配器文件**

```typescript
// src/slack/adapter.ts

import { ChannelAdapter, StandardMessage } from '../channels/adapter-interface';

export class SlackAdapter implements ChannelAdapter {
  readonly platform = 'slack';
  
  async initialize(config: { token: string; signingSecret: string }) {
    // 初始化 Slack SDK
  }
  
  onMessage(handler: (msg: StandardMessage) => void) {
    // 监听 Slack 事件
  }
  
  async sendMessage(channelId: string, content: any) {
    // 发送消息到 Slack
  }
  
  // 转换方法
  private toStandard(slackEvent: any): StandardMessage {
    // 实现转换逻辑
  }
  
  private fromStandard(content: any): any {
    // 实现反向转换
  }
}
```

**第二步：注册适配器**

```typescript
// src/channels/registry.ts

import { SlackAdapter } from '../slack/adapter';

export const channelRegistry = {
  discord: DiscordAdapter,
  telegram: TelegramAdapter,
  lark: LarkAdapter,
  slack: SlackAdapter,  // 新增
};
```

**第三步：配置启用**

```yaml
# config.yaml
channels:
  slack:
    enabled: true
    token: ${SLACK_BOT_TOKEN}
    signingSecret: ${SLACK_SIGNING_SECRET}
```

### 6.4.2 需要处理的问题

| 问题 | 解决方案 |
|------|---------|
| **消息格式差异** | 定义清晰的映射规则 |
| **富媒体支持** | 提取通用能力，不支持的功能降级 |
| **限流策略** | 适配器层实现队列和重试 |
| **连接稳定性** | 实现断线重连和心跳机制 |

---

## 6.5 最佳实践

### 6.5.1 平台选择建议

| 场景 | 推荐平台 | 理由 |
|------|---------|------|
| **开源社区** | Discord | 开发者生态好，机器人生态丰富 |
| **国际化产品** | Telegram | 全球用户多，隐私保护好 |
| **国内企业** | 飞书 | 办公集成度高，审批流程完善 |
| **团队协作** | Slack | 企业级功能，集成能力强 |
| **个人助手** | iMessage | 苹果生态原生体验 |

### 6.5.2 多平台策略

**同时接入多个平台**：

```yaml
channels:
  # 主要平台
  discord:
    enabled: true
    token: ${DISCORD_TOKEN}
  
  # 备用平台
  telegram:
    enabled: true
    token: ${TELEGRAM_TOKEN}
  
  # 企业用户
  lark:
    enabled: true
    appId: ${LARK_APP_ID}
    appSecret: ${LARK_APP_SECRET}
```

**平台差异化处理**：

```typescript
// 根据平台特性调整回复
function formatReply(platform: string, content: string): any {
  switch (platform) {
    case 'discord':
      // Discord 支持 Markdown 和 Embed
      return { embeds: [{ description: content }] };
    
    case 'telegram':
      // Telegram 支持 HTML 解析
      return { text: content, parse_mode: 'HTML' };
    
    case 'lark':
      // 飞书使用卡片消息
      return { card: createCard(content) };
    
    default:
      return { text: content };
  }
}
```

---

## 6.6 本章小结

### 核心概念

1. **抽象层屏蔽差异**，业务逻辑只需处理统一格式
2. **适配器实现接口**，每个平台独立封装
3. **统一消息格式**，包含完整上下文信息
4. **易于扩展**，新增平台只需添加适配器

### 架构要点

```
业务逻辑
    ↓
统一消息格式
    ↓
通道抽象层
    ↓
平台适配器（Discord/Telegram/飞书/...）
    ↓
各平台 API
```

### 下一步

在下一章，我们将深入了解：
- Discord 平台的具体接入方式
- 如何创建 Discord Bot
- Discord 的高级功能使用

---

## 参考资源

- 适配器开发文档：https://docs.openclaw.ai/channels
- Discord 集成指南：https://docs.openclaw.ai/discord
- Telegram 集成指南：https://docs.openclaw.ai/telegram
- 飞书集成指南：https://docs.openclaw.ai/lark
