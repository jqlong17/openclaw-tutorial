# 第 9 章：Telegram 集成深度解析

> 本章将深入解析 OpenClaw 与 Telegram 的集成，包括 Bot 创建、消息处理、键盘交互、话题与频道等。

---

## 8.1 Telegram Bot 基础

### 8.1.1 BotFather 创建流程

Telegram 使用 **BotFather** 创建和管理 Bot：

**步骤 1：找到 BotFather**

1. 在 Telegram 中搜索 `@BotFather`
2. 点击开始对话
3. 发送 `/start` 命令

**步骤 2：创建新 Bot**

```
┌─────────────────────────────────────────────┐
│  BotFather                                  │
├─────────────────────────────────────────────┤
│                                             │
│  You: /newbot                               │
│                                             │
│  BotFather:                                 │
│  Alright, a new bot. How are we going to   │
│  call it? Please choose a name for your bot.│
│                                             │
│  You: MyOpenClawBot                         │
│                                             │
│  BotFather:                                 │
│  Good. Now let's choose a username for your│
│  bot. It must end in `bot`. Like this, for │
│  example: TetrisBot or tetris_bot.         │
│                                             │
│  You: myopenclaw_bot                        │
│                                             │
│  BotFather:                                 │
│  Done! Congratulations on your new bot.    │
│  You will find it at t.me/myopenclaw_bot   │
│                                             │
│  Use this token to access the HTTP API:    │
│  123456789:ABCdefGHIjklMNOpqrSTUvwxyz      │
│                                             │
└─────────────────────────────────────────────┘
```

**步骤 3：配置 Bot 设置**

```
# 设置描述
/setdescription
选择你的 Bot
输入描述：我是 OpenClaw AI 助手，可以帮助你完成各种任务。

# 设置关于信息
/setabouttext
选择你的 Bot
输入关于：OpenClaw AI 助手 - 智能、高效、可靠。

# 设置头像
/setuserpic
选择你的 Bot
发送图片

# 设置命令列表
/setcommands
选择你的 Bot
输入命令列表：
ask - 向 AI 助手提问
status - 查看 Bot 状态
help - 获取帮助
```

### 8.1.2 Token 获取与配置

**Token 格式**：
```
123456789:ABCdefGHIjklMNOpqrSTUvwxyz
```

**配置到 OpenClaw**：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "accounts": {
        "default": {
          "token": "${TELEGRAM_BOT_TOKEN}"
        }
      }
    }
  }
}
```

**环境变量**：
```bash
export TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
```

### 8.1.3 隐私模式

Telegram Bot 有**隐私模式**设置：

| 模式 | 说明 | 影响 |
|------|------|------|
| **隐私模式开启**（默认） | Bot 只接收@提及的消息和回复 | 群组中需要@Bot |
| **隐私模式关闭** | Bot 接收所有消息 | 可以看到群组所有对话 |

**切换隐私模式**：

```
向 BotFather 发送：/setprivacy
选择你的 Bot
选择 Disable（关闭）或 Enable（开启）
```

**OpenClaw 建议**：
- 私聊场景：保持默认即可
- 群组场景：根据需要选择
  - 需要监听所有消息 → 关闭隐私模式
  - 只需要响应@提及 → 保持开启

### 8.1.4 群组权限

Telegram 群组中的权限设置：

**群组管理员设置**：
1. 进入群组
2. 点击群组名称 → 管理员
3. 找到 Bot，设置权限：
   - 删除消息
   - 限制成员
   - 置顶消息
   - 管理话题
   - 等等

**OpenClaw 配置**：

```json
{
  "channels": {
    "telegram": {
      "accounts": {
        "default": {
          "token": "${TELEGRAM_BOT_TOKEN}",
          "groupConfig": {
            "requireMention": false,
            "allowTopics": true,
            "adminOnlyCommands": ["config", "restart"]
          }
        }
      }
    }
  }
}
```

---

## 8.2 消息处理

### 8.2.1 长轮询 vs Webhook

Telegram 支持两种消息接收方式：

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Long Polling** | 简单、无需公网地址 | 延迟稍高、资源占用 | 开发测试、小规模 |
| **Webhook** | 实时、高效 | 需要公网地址、HTTPS | 生产环境、大规模 |

**OpenClaw 默认使用 Long Polling**，配置简单。

**Long Polling 原理**：

```typescript
// /src/telegram/bot/polling.ts (简化)

class TelegramPolling {
  private offset = 0;
  private running = false;
  
  async start(token: string) {
    this.running = true;
    
    while (this.running) {
      try {
        // 获取更新
        const updates = await this.getUpdates(token, {
          offset: this.offset,
          limit: 100,
          timeout: 30, // 长轮询超时
        });
        
        for (const update of updates) {
          // 处理更新
          await this.handleUpdate(update);
          
          // 更新 offset
          this.offset = update.update_id + 1;
        }
      } catch (error) {
        console.error('Polling error:', error);
        await sleep(5000); // 出错后等待
      }
    }
  }
  
  private async getUpdates(
    token: string,
    params: GetUpdatesParams
  ): Promise<Update[]> {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }
    );
    
    const data = await response.json();
    return data.result || [];
  }
  
  stop() {
    this.running = false;
  }
}
```

### 8.2.2 消息类型处理

Telegram 支持多种消息类型：

```typescript
// /src/telegram/bot/types.ts (简化)

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  
  // 文本消息
  text?: string;
  entities?: MessageEntity[];
  
  // 媒体消息
  photo?: PhotoSize[];
  video?: Video;
  audio?: Audio;
  document?: Document;
  voice?: Voice;
  sticker?: Sticker;
  
  // 其他
  caption?: string;
  reply_to_message?: TelegramMessage;
  forward_from?: TelegramUser;
  location?: Location;
  contact?: Contact;
  
  // 新成员
  new_chat_members?: TelegramUser[];
  left_chat_member?: TelegramUser;
  
  // 群组信息
  new_chat_title?: string;
  new_chat_photo?: PhotoSize[];
}

// 处理不同类型的消息
async function handleTelegramMessage(
  message: TelegramMessage,
  bot: Bot
): Promise<void> {
  // 1. 文本消息
  if (message.text) {
    return handleTextMessage(message, bot);
  }
  
  // 2. 图片
  if (message.photo) {
    return handlePhotoMessage(message, bot);
  }
  
  // 3. 视频
  if (message.video) {
    return handleVideoMessage(message, bot);
  }
  
  // 4. 文档
  if (message.document) {
    return handleDocumentMessage(message, bot);
  }
  
  // 5. 语音
  if (message.voice) {
    return handleVoiceMessage(message, bot);
  }
  
  // 6. 贴纸
  if (message.sticker) {
    return handleStickerMessage(message, bot);
  }
  
  // 7. 位置
  if (message.location) {
    return handleLocationMessage(message, bot);
  }
  
  // 8. 新成员
  if (message.new_chat_members) {
    return handleNewMembers(message, bot);
  }
}
```

### 8.2.3 回复与引用

Telegram 的回复机制：

```typescript
// 处理回复消息
function extractReplyContext(message: TelegramMessage): ReplyContext | null {
  if (!message.reply_to_message) {
    return null;
  }
  
  const replied = message.reply_to_message;
  
  return {
    messageId: replied.message_id.toString(),
    content: replied.text || replied.caption || '',
    sender: {
      id: replied.from.id.toString(),
      name: replied.from.first_name,
    },
  };
}

// 发送带引用的回复
async function sendReply(
  chatId: string,
  text: string,
  replyToMessageId: string,
  bot: Bot
) {
  await bot.api.sendMessage(chatId, text, {
    reply_to_message_id: parseInt(replyToMessageId),
    parse_mode: 'Markdown',
  });
}

// 引用格式（类似 Discord 的回复）
function formatQuoteReply(replyContext: ReplyContext, newContent: string): string {
  const quoted = replyContext.content.slice(0, 50).replace(/\n/g, ' ');
  return `**${replyContext.sender.name}:** ${quoted}...\n\n${newContent}`;
}
```

### 8.2.4 编辑与删除

处理消息编辑和删除：

```typescript
// 监听消息编辑
bot.on('edited_message', async (ctx) => {
  const editedMessage = ctx.editedMessage;
  
  console.log(`Message ${editedMessage.message_id} edited:`);
  console.log(`Old: ${ctx.message?.text}`);
  console.log(`New: ${editedMessage.text}`);
  
  // 可以选择是否重新处理编辑后的消息
  if (config.reprocessEditedMessages) {
    await handleMessage(editedMessage, bot);
  }
});

// 删除消息
async function deleteMessage(
  chatId: string,
  messageId: string,
  bot: Bot
) {
  try {
    await bot.api.deleteMessage(chatId, parseInt(messageId));
  } catch (error) {
    // 可能无权限删除
    console.error('Failed to delete message:', error);
  }
}

// 编辑 Bot 发送的消息
async function editMessage(
  chatId: string,
  messageId: string,
  newText: string,
  bot: Bot
) {
  await bot.api.editMessageText(chatId, parseInt(messageId), newText, {
    parse_mode: 'Markdown',
  });
}
```

---

## 8.3 键盘与交互

### 8.3.1 内联键盘

创建内联键盘（Inline Keyboard）：

```typescript
// /src/telegram/bot/keyboard.ts (简化)

import { InlineKeyboard } from 'grammy';

// 创建确认键盘
function createConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ 确认', 'confirm_yes')
    .text('❌ 取消', 'confirm_no');
}

// 创建模型选择键盘
function createModelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🌙 Kimi', 'model_kimi')
    .text('🤖 GPT-4', 'model_gpt4')
    .row()
    .text('🔮 Gemini', 'model_gemini')
    .text('⚙️ 设置', 'settings');
}

// 创建分页键盘
function createPaginationKeyboard(
  currentPage: number,
  totalPages: number
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  if (currentPage > 1) {
    keyboard.text('◀️ 上一页', `page_${currentPage - 1}`);
  }
  
  keyboard.text(`${currentPage}/${totalPages}`, 'noop');
  
  if (currentPage < totalPages) {
    keyboard.text('下一页 ▶️', `page_${currentPage + 1}`);
  }
  
  return keyboard;
}

// 发送带键盘的消息
async function sendKeyboardMessage(
  chatId: string,
  text: string,
  bot: Bot
) {
  await bot.api.sendMessage(chatId, text, {
    reply_markup: createModelKeyboard(),
  });
}

// 处理键盘回调
bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  
  // 回答回调（停止加载动画）
  await ctx.answerCallbackQuery();
  
  switch (callbackData) {
    case 'confirm_yes':
      await handleConfirmYes(ctx);
      break;
    case 'confirm_no':
      await handleConfirmNo(ctx);
      break;
    case 'model_kimi':
      await setModel(ctx, 'kimi');
      break;
    // ... 其他回调
  }
});
```

### 8.3.2 回复键盘

创建回复键盘（Reply Keyboard）：

```typescript
// 创建回复键盘
function createReplyKeyboard(): ReplyKeyboardMarkup {
  return {
    keyboard: [
      [{ text: '🔍 搜索' }, { text: '📊 状态' }],
      [{ text: '⚙️ 设置' }, { text: '❓ 帮助' }],
    ],
    resize_keyboard: true,  // 调整键盘大小
    one_time_keyboard: false,  // 是否一次性
  };
}

// 发送带回复键盘的消息
await bot.api.sendMessage(chatId, '请选择操作：', {
  reply_markup: createReplyKeyboard(),
});

// 移除回复键盘
await bot.api.sendMessage(chatId, '键盘已移除', {
  reply_markup: { remove_keyboard: true },
});
```

### 8.3.3 按钮回调

处理复杂的按钮交互：

```typescript
// 带状态的回调处理
interface CallbackState {
  userId: string;
  action: string;
  data: unknown;
  timestamp: number;
}

const callbackStates = new Map<string, CallbackState>();

// 创建带状态的回调
function createStatefulCallback(
  userId: string,
  action: string,
  data: unknown
): string {
  const callbackId = generateId();
  
  callbackStates.set(callbackId, {
    userId,
    action,
    data,
    timestamp: Date.now(),
  });
  
  // 清理过期状态
  setTimeout(() => {
    callbackStates.delete(callbackId);
  }, 300000); // 5分钟过期
  
  return `${action}:${callbackId}`;
}

// 处理回调
bot.on('callback_query', async (ctx) => {
  const [action, callbackId] = ctx.callbackQuery.data.split(':');
  const state = callbackStates.get(callbackId);
  
  if (!state) {
    await ctx.answerCallbackQuery({
      text: '操作已过期，请重新尝试',
      show_alert: true,
    });
    return;
  }
  
  // 验证用户
  if (state.userId !== ctx.from.id.toString()) {
    await ctx.answerCallbackQuery({
      text: '这不是你的操作',
      show_alert: true,
    });
    return;
  }
  
  // 执行操作
  await executeAction(action, state.data, ctx);
});
```

### 8.3.4 深度链接

使用深度链接（Deep Linking）：

```typescript
// 生成启动链接
function generateStartLink(payload: string): string {
  // URL 编码 payload
  const encoded = encodeURIComponent(payload);
  return `https://t.me/myopenclaw_bot?start=${encoded}`;
}

// 处理 /start 命令
bot.command('start', async (ctx) => {
  const payload = ctx.match; // 获取 start 参数
  
  if (payload) {
    // 处理深度链接
    switch (payload) {
      case 'pairing':
        await handlePairingRequest(ctx);
        break;
      case 'invite':
        await handleGroupInvite(ctx);
        break;
      default:
        // 解析复杂 payload
        const data = parsePayload(payload);
        await handleCustomPayload(ctx, data);
    }
  } else {
    // 普通启动
    await ctx.reply('欢迎使用 OpenClaw！发送 /help 查看帮助。');
  }
});

// 示例：生成配对链接
const pairingLink = generateStartLink('pairing');
// https://t.me/myopenclaw_bot?start=pairing
```

---

## 8.4 话题与频道

### 8.4.1 话题 (Topics)

Telegram 群组中的话题功能：

```typescript
// 检查是否在话题中
function isTopicMessage(message: TelegramMessage): boolean {
  return !!message.message_thread_id;
}

// 获取话题信息
function getTopicInfo(message: TelegramMessage): TopicInfo | null {
  if (!message.message_thread_id) {
    return null;
  }
  
  // 话题名称需要从其他地方获取
  // 因为 Telegram API 不直接在消息中提供话题名称
  return {
    threadId: message.message_thread_id.toString(),
    // 需要缓存或查询获取名称
  };
}

// 发送到特定话题
async function sendToTopic(
  chatId: string,
  threadId: string,
  text: string,
  bot: Bot
) {
  await bot.api.sendMessage(chatId, text, {
    message_thread_id: parseInt(threadId),
  });
}

// 创建话题（需要管理员权限）
async function createTopic(
  chatId: string,
  name: string,
  bot: Bot
) {
  const result = await bot.api.createForumTopic(chatId, name);
  return result.message_thread_id;
}
```

### 8.4.2 频道支持

Telegram 频道（Channel）处理：

```typescript
// 频道消息特点：
// - sender_chat 代替 from
// - 没有回复功能
// - 可以编辑消息

function isChannelMessage(message: TelegramMessage): boolean {
  return message.chat.type === 'channel';
}

function isChannelPost(message: TelegramMessage): boolean {
  return !!message.sender_chat;
}

// 处理频道消息
async function handleChannelMessage(
  message: TelegramMessage,
  bot: Bot
) {
  // 频道消息发送者是频道本身
  const sender = message.sender_chat;
  
  console.log(`Channel: ${sender?.title}`);
  console.log(`Content: ${message.text}`);
  
  // 频道消息通常不需要回复
  // 但可以记录或转发
}

// 在频道中发送消息（需要 Bot 是频道管理员）
async function sendToChannel(
  channelId: string,
  text: string,
  bot: Bot
) {
  await bot.api.sendMessage(channelId, text, {
    parse_mode: 'HTML',
  });
}

// 编辑频道消息
async function editChannelMessage(
  channelId: string,
  messageId: string,
  newText: string,
  bot: Bot
) {
  await bot.api.editMessageText(
    channelId,
    parseInt(messageId),
    newText,
    { parse_mode: 'HTML' }
  );
}
```

### 8.4.3 媒体组

处理媒体组（Media Group）：

```typescript
// 媒体组是同时发送的多张图片/视频
// 它们有相同的 media_group_id

const mediaGroupCache = new Map<string, TelegramMessage[]>();

async function handleMediaGroupMessage(
  message: TelegramMessage,
  bot: Bot
) {
  if (!message.media_group_id) {
    // 单张图片，直接处理
    return handleSingleMedia(message, bot);
  }
  
  const groupId = message.media_group_id;
  
  // 添加到缓存
  if (!mediaGroupCache.has(groupId)) {
    mediaGroupCache.set(groupId, []);
    
    // 设置超时，收集完所有媒体后处理
    setTimeout(() => {
      const group = mediaGroupCache.get(groupId);
      mediaGroupCache.delete(groupId);
      
      if (group) {
        processMediaGroup(group, bot);
      }
    }, 1000); // 等待 1 秒收集所有媒体
  }
  
  mediaGroupCache.get(groupId)!.push(message);
}

async function processMediaGroup(
  messages: TelegramMessage[],
  bot: Bot
) {
  // 按消息 ID 排序
  messages.sort((a, b) => a.message_id - b.message_id);
  
  // 提取所有媒体
  const media = messages.map(m => ({
    type: m.photo ? 'photo' : 'video',
    fileId: m.photo?.[m.photo.length - 1].file_id || m.video?.file_id,
    caption: m.caption,
  }));
  
  // 处理媒体组
  console.log(`Processing media group with ${media.length} items`);
  
  // 可以一次性发送给 AI 分析
  await analyzeMediaGroup(media);
}
```

### 8.4.4 贴纸与表情

处理贴纸和动画表情：

```typescript
// 贴纸消息
async function handleStickerMessage(
  message: TelegramMessage,
  bot: Bot
) {
  const sticker = message.sticker;
  
  if (!sticker) return;
  
  console.log('Sticker received:', {
    emoji: sticker.emoji,
    setName: sticker.set_name,
    isAnimated: sticker.is_animated,
    isVideo: sticker.is_video,
  });
  
  // 可以下载贴纸文件
  const file = await bot.api.getFile(sticker.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  
  // 或者简单回复
  await bot.api.sendMessage(
    message.chat.id,
    `收到贴纸：${sticker.emoji}`,
    {
      reply_to_message_id: message.message_id,
    }
  );
}

// 动画表情（Animated Emoji）
async function handleDiceMessage(
  message: TelegramMessage,
  bot: Bot
) {
  const dice = message.dice;
  
  if (!dice) return;
  
  console.log('Dice/Animation:', {
    emoji: dice.emoji,
    value: dice.value,
  });
  
  // 例如：🎲 骰子、🎯 飞镖、🏀 篮球等
}
```

---

## 本章小结

通过本章的学习，你应该掌握了：

1. **Telegram Bot 基础** - BotFather 创建、Token 获取、隐私模式、群组权限
2. **消息处理** - 长轮询、多种消息类型、回复引用、编辑删除
3. **键盘与交互** - 内联键盘、回复键盘、按钮回调、深度链接
4. **话题与频道** - 话题支持、频道消息、媒体组、贴纸表情

**Discord vs Telegram 对比**：

| 特性 | Discord | Telegram |
|------|---------|----------|
| 连接方式 | WebSocket | Long Polling / Webhook |
| 消息编辑 | 不支持 | 支持 |
| 消息删除 | 支持 | 支持 |
| 键盘类型 | 按钮、选择菜单、模态框 | 内联键盘、回复键盘 |
| 话题 | Thread | Forum Topic |
| 频道 | 文字频道 | Channel（广播） |
| 隐私模式 | 无 | 有 |

---

*下一章：第 9 章 其他平台集成*
