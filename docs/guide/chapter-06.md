# 第 6 章：通道抽象层

> 本章将深入解析 OpenClaw 的通道抽象层设计，了解如何统一不同消息平台的差异。

---

## 6.1 Channel 设计哲学

### 6.1.1 为什么需要抽象层

在没有抽象层的情况下，每个平台都需要独立处理：

```
❌ 没有抽象层

Discord Bot          Telegram Bot         Slack Bot
     │                     │                    │
     ▼                     ▼                    ▼
  Discord API        Telegram API          Slack API
     │                     │                    │
     ▼                     ▼                    ▼
  独立处理逻辑        独立处理逻辑          独立处理逻辑
     │                     │                    │
     ▼                     ▼                    ▼
  重复代码            重复代码              重复代码
```

有了抽象层后：

```
✅ 有抽象层

Discord ──┐
          │
Telegram ─┼──▶ Channel Adapter ──▶ 统一处理逻辑 ──▶ AI Core
          │         (标准化)
Slack ────┘
```

**抽象层的价值**：

| 价值 | 说明 |
|------|------|
| **代码复用** | 核心逻辑只需写一次 |
| **易于扩展** | 添加新平台只需实现适配器 |
| **统一维护** | 修复 bug 只需改一处 |
| **降低门槛** | 新开发者只需了解抽象接口 |

### 6.1.2 Channel 接口定义

OpenClaw 的 Channel 核心接口：

```typescript
// /src/channels/registry.ts (简化)

/**
 * 通道接口 - 所有平台适配器必须实现
 */
interface Channel {
  /** 通道唯一标识 */
  readonly id: string;
  
  /** 通道类型 */
  readonly type: 'discord' | 'telegram' | 'slack' | ...;
  
  /**
   * 初始化通道
   * 建立连接、认证、启动监听
   */
  initialize(): Promise<void>;
  
  /**
   * 销毁通道
   * 清理资源、关闭连接
   */
  destroy(): Promise<void>;
  
  /**
   * 发送消息
   */
  sendMessage(
    target: MessageTarget,
    content: MessageContent,
    options?: SendOptions
  ): Promise<SentMessage>;
  
  /**
   * 注册消息处理器
   */
  onMessage(handler: MessageHandler): void;
  
  /**
   * 发送"正在输入"状态
   */
  sendTyping(target: MessageTarget): Promise<void>;
  
  /**
   * 获取通道状态
   */
  getStatus(): ChannelStatus;
}

/**
 * 消息目标
 */
interface MessageTarget {
  /** 目标类型 */
  type: 'user' | 'channel' | 'thread';
  
  /** 目标 ID */
  id: string;
  
  /** 父级 ID（如频道 ID） */
  parentId?: string;
}

/**
 * 消息内容
 */
interface MessageContent {
  /** 文本内容 */
  text?: string;
  
  /** 媒体附件 */
  attachments?: Attachment[];
  
  /** 回复引用 */
  replyTo?: string;
  
  /** 平台特定扩展 */
  platformSpecific?: Record<string, unknown>;
}

/**
 * 消息处理器
 */
type MessageHandler = (message: InboundMessage) => Promise<void> | void;

/**
 * 入站消息
 */
interface InboundMessage {
  /** 消息 ID */
  id: string;
  
  /** 内容 */
  content: string;
  
  /** 发送者 */
  sender: {
    id: string;
    name: string;
    username?: string;
  };
  
  /** 目标 */
  target: MessageTarget;
  
  /** 平台原始数据 */
  raw: unknown;
  
  /** 时间戳 */
  timestamp: Date;
}
```

### 6.1.3 适配器模式

OpenClaw 使用适配器模式统一不同平台：

```mermaid
graph TB
    subgraph 抽象层
        A[Channel Interface]
    end
    
    subgraph 适配器层
        B1[DiscordAdapter]
        B2[TelegramAdapter]
        B3[SlackAdapter]
        B4[OtherAdapter]
    end
    
    subgraph 平台 SDK
        C1[discord.js]
        C2[grammy]
        C3[@slack/bolt]
        C4[...]
    end
    
    subgraph 平台 API
        D1[Discord API]
        D2[Telegram API]
        D3[Slack API]
        D4[...]
    end
    
    A --> B1
    A --> B2
    A --> B3
    A --> B4
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    B4 --> C4
    
    C1 --> D1
    C2 --> D2
    C3 --> D3
    C4 --> D4
```

**适配器职责**：

| 职责 | 说明 |
|------|------|
| **协议转换** | 平台 API ↔ 内部接口 |
| **数据标准化** | 平台格式 ↔ 统一格式 |
| **特性适配** | 处理平台特有功能 |
| **错误处理** | 平台特定错误转换 |

---

## 6.2 消息标准化

### 6.2.1 MsgContext 结构

标准化的消息上下文结构：

```typescript
// /src/auto-reply/templating.ts

interface MsgContext {
  // ========== 消息内容 ==========
  
  /** 完整消息体（含信封格式） */
  Body: string;
  
  /** 给 AI 的纯净内容 */
  BodyForAgent: string;
  
  /** 原始消息内容 */
  RawBody: string;
  
  /** 命令部分（如果有） */
  CommandBody?: string;
  
  // ========== 路由信息 ==========
  
  /** 发送者标识 */
  From: string;
  
  /** 接收者标识 */
  To: string;
  
  /** 会话唯一键 */
  SessionKey: string;
  
  /** 账号 ID */
  AccountId: string;
  
  // ========== 会话信息 ==========
  
  /** 聊天类型 */
  ChatType: 'direct' | 'channel';
  
  /** 会话标签 */
  ConversationLabel: string;
  
  // ========== 群组信息 ==========
  
  /** 群组主题 */
  GroupSubject?: string;
  
  /** 群组频道 */
  GroupChannel?: string;
  
  /** 群组空间 */
  GroupSpace?: string;
  
  // ========== 发送者信息 ==========
  
  /** 发送者名称 */
  SenderName: string;
  
  /** 发送者 ID */
  SenderId: string;
  
  /** 用户名 */
  SenderUsername: string;
  
  /** 标签 */
  SenderTag?: string;
  
  // ========== 回复上下文 ==========
  
  /** 回复的消息 ID */
  ReplyToId?: string;
  
  /** 回复的消息内容 */
  ReplyToBody?: string;
  
  /** 回复的消息发送者 */
  ReplyToSender?: string;
  
  // ========== 线程信息 ==========
  
  /** 线程起始消息 */
  ThreadStarterBody?: string;
  
  /** 线程标签 */
  ThreadLabel?: string;
  
  /** 父会话键 */
  ParentSessionKey?: string;
  
  // ========== 媒体 ==========
  
  /** 媒体 URL */
  MediaUrl?: string;
  
  /** 媒体类型 */
  MediaContentType?: string;
  
  /** 媒体说明 */
  MediaCaption?: string;
  
  // ========== 元数据 ==========
  
  /** 提供商 */
  Provider: string;
  
  /** 表面 */
  Surface: string;
  
  /** 是否被@提及 */
  WasMentioned: boolean;
  
  /** 时间戳 */
  Timestamp: number;
  
  // ========== 命令相关 ==========
  
  /** 命令是否授权 */
  CommandAuthorized?: boolean;
  
  /** 命令来源 */
  CommandSource?: 'text' | 'native';
  
  // ========== 其他 ==========
  
  /** 不可信上下文 */
  UntrustedContext?: unknown[];
  
  /** 群组系统提示词 */
  GroupSystemPrompt?: string;
  
  /** 允许的发送者 */
  OwnerAllowFrom?: string[];
}
```

### 6.2.2 平台特定字段映射

不同平台到标准字段的映射：

| 标准字段 | Discord | Telegram | Slack |
|----------|---------|----------|-------|
| `SenderId` | `author.id` | `from.id` | `user.id` |
| `SenderName` | `author.global_name` | `from.first_name` | `user.real_name` |
| `SenderUsername` | `author.username` | `from.username` | `user.name` |
| `To` | `channel_id` | `chat.id` | `channel` |
| `ChatType` | `guild_id ? 'channel' : 'direct'` | `chat.type` | `channel_type` |
| `ReplyToId` | `referenced_message.id` | `reply_to_message.message_id` | `thread_ts` |

**Discord 转换示例**：

```typescript
// /src/discord/monitor/message-handler.process.ts (简化)
function discordToStandard(
  message: DiscordMessage,
  context: DiscordContext
): Partial<MsgContext> {
  const isDM = !message.guild_id;
  
  return {
    // 内容
    RawBody: message.content,
    BodyForAgent: message.content,
    
    // 发送者
    SenderId: message.author.id,
    SenderName: message.author.global_name || message.author.username,
    SenderUsername: message.author.username,
    
    // 目标
    From: isDM 
      ? `discord:user:${message.author.id}`
      : `discord:channel:${message.channel_id}`,
    To: isDM
      ? `discord:user:${message.author.id}`
      : `discord:channel:${message.channel_id}`,
    
    // 会话类型
    ChatType: isDM ? 'direct' : 'channel',
    
    // 回复
    ReplyToId: message.referenced_message?.id,
    
    // 平台
    Provider: 'discord',
    Surface: 'discord',
    
    // 提及
    WasMentioned: message.mentions.some(
      m => m.id === context.botUserId
    ),
    
    // 时间戳
    Timestamp: new Date(message.timestamp).getTime(),
  };
}
```

### 6.2.3 媒体内容处理

不同平台的媒体处理方式：

```typescript
// 媒体类型枚举
enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
}

// 标准化媒体信息
interface MediaInfo {
  type: MediaType;
  url: string;
  mimeType: string;
  size: number;
  filename?: string;
  caption?: string;
}

// Discord 媒体提取
function extractDiscordMedia(message: DiscordMessage): MediaInfo[] {
  return message.attachments.map(att => ({
    type: guessMediaType(att.content_type),
    url: att.url,
    mimeType: att.content_type,
    size: att.size,
    filename: att.filename,
  }));
}

// Telegram 媒体提取
function extractTelegramMedia(message: TelegramMessage): MediaInfo[] {
  const media: MediaInfo[] = [];
  
  if (message.photo) {
    const largest = message.photo[message.photo.length - 1];
    media.push({
      type: MediaType.IMAGE,
      url: `https://api.telegram.org/file/bot${token}/${largest.file_id}`,
      mimeType: 'image/jpeg',
      size: largest.file_size || 0,
    });
  }
  
  if (message.video) {
    media.push({
      type: MediaType.VIDEO,
      url: message.video.file_id,
      mimeType: message.video.mime_type || 'video/mp4',
      size: message.video.file_size || 0,
    });
  }
  
  if (message.document) {
    media.push({
      type: MediaType.DOCUMENT,
      url: message.document.file_id,
      mimeType: message.document.mime_type || 'application/octet-stream',
      size: message.document.file_size || 0,
      filename: message.document.file_name,
    });
  }
  
  return media;
}
```

---

## 6.3 白名单与权限

### 6.3.1 Allow List 配置

控制谁可以与 Agent 交互：

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "accounts": {
        "default": {
          "token": "${DISCORD_BOT_TOKEN}",
          "dm": {
            "enabled": true,
            "policy": "pairing",
            "allowFrom": ["user_id_1", "user_id_2"]
          },
          "guilds": {
            "my_guild_id": {
              "channels": {
                "general": {
                  "users": ["*"]
                },
                "admin": {
                  "users": ["admin_id_1", "admin_id_2"]
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**配置说明**：

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `dm.enabled` | 是否允许私信 | `true` / `false` |
| `dm.policy` | 私信策略 | `"open"` / `"pairing"` / `"allowlist"` |
| `dm.allowFrom` | 允许的用户列表 | `["123", "456"]` 或 `["*"]` |
| `guilds.{id}` | 特定 Guild 配置 | Guild ID |
| `channels.{name}.users` | 频道允许用户 | `["*"]` 表示所有人 |

### 6.3.2 提及门控

在群组中控制何时响应：

```typescript
// /src/channels/mention-gating.ts (简化)

interface MentionGatingConfig {
  /** 是否需要提及才响应 */
  requireMention: boolean;
  
  /** 提及方式 */
  mentionTypes: ('@bot' | '@everyone' | '@here' | 'keyword')[];
  
  /** 关键词列表（如果 mentionTypes 包含 keyword） */
  keywords?: string[];
  
  /** 私聊是否免提及 */
  dmBypass: boolean;
  
  /** 管理员是否免提及 */
  adminBypass: boolean;
}

function shouldRespond(
  message: InboundMessage,
  config: MentionGatingConfig,
  context: Context
): boolean {
  // 私聊免提及
  if (config.dmBypass && message.chatType === 'direct') {
    return true;
  }
  
  // 不需要提及
  if (!config.requireMention) {
    return true;
  }
  
  // 检查是否被@提及
  if (message.wasMentioned) {
    return true;
  }
  
  // 检查关键词
  if (config.keywords) {
    for (const keyword of config.keywords) {
      if (message.content.includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
}
```

### 6.3.3 命令授权

控制谁可以使用特定命令：

```json
{
  "commands": {
    "native": true,
    "accessGroups": {
      "admin": {
        "users": ["user_id_1", "user_id_2"],
        "commands": ["config", "restart", "shutdown"]
      },
      "moderator": {
        "users": ["user_id_3"],
        "commands": ["ban", "unban", "mute"]
      }
    }
  }
}
```

**命令授权检查**：

```typescript
// /src/channels/command-gating.ts (简化)

function checkCommandAuthorization(
  command: string,
  userId: string,
  config: CommandConfig
): AuthorizationResult {
  // 检查是否在允许列表
  for (const [groupName, group] of Object.entries(config.accessGroups)) {
    if (group.users.includes(userId) || group.users.includes('*')) {
      if (group.commands.includes(command) || group.commands.includes('*')) {
        return { authorized: true, group: groupName };
      }
    }
  }
  
  // 检查默认权限
  if (config.defaultAllow?.includes(command)) {
    return { authorized: true, group: 'default' };
  }
  
  return { 
    authorized: false, 
    reason: `Command "${command}" not allowed for user ${userId}` 
  };
}
```

### 6.3.4 群组策略

控制群组级别的行为：

```json
{
  "channels": {
    "discord": {
      "groupPolicy": "open",
      "accounts": {
        "default": {
          "guilds": {
            "*": {
              "requireMention": true,
              "autoThread": false,
              "historyLimit": 20
            }
          }
        }
      }
    }
  }
}
```

**群组策略选项**：

| 策略 | 说明 |
|------|------|
| `"open"` | 开放模式，响应所有允许的消息 |
| `"mention"` | 提及模式，只响应@提及的消息 |
| `"command"` | 命令模式，只响应命令 |
| `"disabled"` | 禁用，不响应任何消息 |

---

## 6.4 实现一个简单 Channel

### 6.4.1 需求分析

假设我们要添加一个**飞书（Lark）**平台的支持：

**飞书 Bot 特点**：
- Webhook 接收消息
- HTTP API 发送消息
- 支持私聊和群聊
- 支持富文本和卡片

### 6.4.2 接口实现

创建 `/src/lark/` 目录：

```typescript
// /src/lark/adapter.ts

import { Channel, MessageTarget, MessageContent, InboundMessage } from '../channels/types';

export class LarkAdapter implements Channel {
  readonly id = 'lark';
  readonly type = 'lark';
  
  private appId: string;
  private appSecret: string;
  private webhookSecret: string;
  private messageHandlers: Array<(message: InboundMessage) => void> = [];
  
  constructor(config: LarkConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.webhookSecret = config.webhookSecret;
  }
  
  async initialize(): Promise<void> {
    // 1. 获取 tenant access token
    await this.refreshToken();
    
    // 2. 启动 webhook 服务器
    this.startWebhookServer();
    
    // 3. 设置事件订阅
    await this.subscribeEvents();
    
    console.log('Lark adapter initialized');
  }
  
  async destroy(): Promise<void> {
    // 清理资源
    this.stopWebhookServer();
    console.log('Lark adapter destroyed');
  }
  
  async sendMessage(
    target: MessageTarget,
    content: MessageContent,
    options?: SendOptions
  ): Promise<SentMessage> {
    const larkMessage = this.toLarkFormat(content);
    
    const response = await fetch(
      `https://open.feishu.cn/open-apis/im/v1/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receive_id: target.id,
          msg_type: larkMessage.msg_type,
          content: JSON.stringify(larkMessage.content),
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Lark API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      id: result.data.message_id,
      timestamp: new Date(),
    };
  }
  
  onMessage(handler: (message: InboundMessage) => void): void {
    this.messageHandlers.push(handler);
  }
  
  async sendTyping(target: MessageTarget): Promise<void> {
    // 飞书没有直接的"正在输入"API
    // 可以发送一个空卡片或省略号
  }
  
  getStatus(): ChannelStatus {
    return {
      connected: !!this.accessToken,
      authenticated: !!this.accessToken,
    };
  }
  
  // ========== 私有方法 ==========
  
  private async refreshToken(): Promise<void> {
    const response = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret,
        }),
      }
    );
    
    const result = await response.json();
    this.accessToken = result.tenant_access_token;
    
    // 设置定时刷新
    setTimeout(() => this.refreshToken(), result.expire * 1000 - 60000);
  }
  
  private startWebhookServer(): void {
    // 创建 HTTP 服务器接收飞书事件
    const server = createServer((req, res) => {
      if (req.url === '/webhook/lark' && req.method === 'POST') {
        this.handleWebhook(req, res);
      }
    });
    
    server.listen(3001);
  }
  
  private async handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await readBody(req);
    const event = JSON.parse(body);
    
    // 验证签名
    if (!this.verifySignature(body, req.headers['x-lark-signature'] as string)) {
      res.statusCode = 401;
      res.end('Unauthorized');
      return;
    }
    
    // 处理 URL 验证
    if (event.type === 'url_verification') {
      res.end(JSON.stringify({ challenge: event.challenge }));
      return;
    }
    
    // 转换为标准消息
    const message = this.toStandardMessage(event);
    
    // 通知处理器
    for (const handler of this.messageHandlers) {
      handler(message);
    }
    
    res.end('OK');
  }
  
  private toStandardMessage(event: LarkEvent): InboundMessage {
    const message = event.event.message;
    const sender = event.event.sender;
    
    return {
      id: message.message_id,
      content: this.extractTextContent(message),
      sender: {
        id: sender.sender_id.user_id,
        name: sender.sender_id.user_id, // 飞书需要额外查询用户信息
      },
      target: {
        type: message.chat_type === 'p2p' ? 'user' : 'channel',
        id: message.chat_id,
      },
      raw: event,
      timestamp: new Date(parseInt(message.create_time)),
    };
  }
  
  private toLarkFormat(content: MessageContent): LarkMessage {
    if (content.text) {
      return {
        msg_type: 'text',
        content: { text: content.text },
      };
    }
    
    // 支持更多格式...
    
    return {
      msg_type: 'text',
      content: { text: '' },
    };
  }
  
  private verifySignature(body: string, signature: string): boolean {
    // 实现签名验证
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('base64');
    
    return signature === expected;
  }
}
```

### 6.4.3 测试验证

**单元测试**：

```typescript
// /src/lark/adapter.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { LarkAdapter } from './adapter';

describe('LarkAdapter', () => {
  let adapter: LarkAdapter;
  
  beforeEach(() => {
    adapter = new LarkAdapter({
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
      webhookSecret: 'test-webhook-secret',
    });
  });
  
  it('should convert text message to Lark format', () => {
    const result = (adapter as any).toLarkFormat({
      text: 'Hello, World!',
    });
    
    expect(result).toEqual({
      msg_type: 'text',
      content: { text: 'Hello, World!' },
    });
  });
  
  it('should convert Lark event to standard message', () => {
    const event = {
      event: {
        message: {
          message_id: 'msg_123',
          chat_type: 'p2p',
          chat_id: 'chat_456',
          create_time: '1705312200000',
          content: JSON.stringify({ text: 'Test message' }),
        },
        sender: {
          sender_id: { user_id: 'user_789' },
        },
      },
    };
    
    const result = (adapter as any).toStandardMessage(event);
    
    expect(result.id).toBe('msg_123');
    expect(result.content).toBe('Test message');
    expect(result.sender.id).toBe('user_789');
  });
});
```

**集成测试**：

```bash
# 启动测试网关
openclaw gateway run --config test.config.json

# 发送测试消息
curl -X POST http://localhost:3001/webhook/lark \
  -H "Content-Type: application/json" \
  -H "X-Lark-Signature: xxx" \
  -d '{
    "type": "event_callback",
    "event": {
      "message": {
        "message_id": "test_msg",
        "chat_type": "p2p",
        "chat_id": "test_chat",
        "create_time": "1705312200000",
        "content": "{\"text\": \"Hello\"}"
      },
      "sender": {
        "sender_id": { "user_id": "test_user" }
      }
    }
  }'
```

### 6.4.4 集成到主流程

**注册适配器**：

```typescript
// /src/channels/registry.ts

import { LarkAdapter } from '../lark/adapter';

const channelAdapters: Record<string, new (config: unknown) => Channel> = {
  discord: DiscordAdapter,
  telegram: TelegramAdapter,
  slack: SlackAdapter,
  lark: LarkAdapter,  // 添加飞书适配器
  // ...
};

export function createChannel(type: string, config: unknown): Channel {
  const AdapterClass = channelAdapters[type];
  if (!AdapterClass) {
    throw new Error(`Unknown channel type: ${type}`);
  }
  return new AdapterClass(config);
}
```

**配置示例**：

```json
{
  "channels": {
    "lark": {
      "enabled": true,
      "accounts": {
        "default": {
          "appId": "${LARK_APP_ID}",
          "appSecret": "${LARK_APP_SECRET}",
          "webhookSecret": "${LARK_WEBHOOK_SECRET}",
          "webhookPort": 3001
        }
      }
    }
  }
}
```

---

## 本章小结

通过本章的学习，你应该深入理解了：

1. **Channel 设计哲学** - 为什么需要抽象层、适配器模式
2. **消息标准化** - MsgContext 结构、平台字段映射、媒体处理
3. **白名单与权限** - Allow List、提及门控、命令授权、群组策略
4. **实现新 Channel** - 从需求分析到集成测试的完整流程

**核心要点**：
- 抽象层实现代码复用和易于扩展
- 标准化是统一不同平台的关键
- 权限控制确保系统安全
- 实现新 Channel 只需关注平台差异

**下一步**：进入第 7 章，深入了解配置系统。

---

## 练习与思考

1. **接口设计**：为微信（WeChat）平台设计 Channel 接口实现方案。

2. **字段映射**：对比 Discord 和 Telegram 的字段差异，列出标准化映射表。

3. **权限实验**：配置不同的白名单和提及策略，测试各种场景下的响应行为。

4. **适配器实现**：尝试实现一个简单的 Echo Channel，将收到的消息原样返回。

5. **性能测试**：对比直接调用平台 API 和通过 Channel 抽象层的性能差异。

---

*下一章：第 7 章 配置系统深度解析*
