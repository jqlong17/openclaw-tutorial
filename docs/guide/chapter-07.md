# 第 7 章：Discord 集成深度解析

> 本章将带你深入了解 Discord 平台，学习如何创建 Bot、配置权限、处理消息和实现高级功能。

---

## 7.1 为什么选择 Discord

### 7.1.1 Discord 的特点

Discord 最初为游戏玩家设计，现在已成为：**开发者社区的首选平台**

**核心优势**：

| 特性 | 说明 | 适合场景 |
|------|------|---------|
| **机器人生态** | 完善的 Bot API，丰富的开发文档 | 技术社区、开源项目 |
| **实时互动** | WebSocket 实时通信，延迟低 | 客服支持、直播互动 |
| **权限精细** | 角色、频道、用户多级权限 | 企业协作、付费社群 |
| **扩展性强** | 斜杠命令、按钮、表单、嵌入消息 | 复杂交互、游戏化 |
| **全球化** | 海外用户多，国际化程度高 | 出海产品、国际社区 |

### 7.1.2 Discord 的适用场景

**开源项目社区**
```
场景：你的开源项目有 1000+ Star
- 用户在 Discord 提问
- Bot 自动回答常见问题
- 复杂问题转给维护者
- 发布版本更新通知
```

**游戏社区运营**
```
场景：游戏有 10 万+ 玩家
- 玩家查询游戏数据
- 组队匹配、活动通知
- 客服工单处理
- 社区活动自动化
```

**技术学习社群**
```
场景：编程学习社群
- 学员提问，AI 助教回答
- 作业提交和批改
- 学习进度跟踪
- 知识点问答游戏
```

---

## 7.2 Discord 核心概念

### 7.2.1 服务器（Guild）与频道（Channel）

**服务器（Guild）**：
- 相当于一个独立的社区空间
- 可以包含多个频道
- 有自己的成员、角色、权限设置

**频道（Channel）类型**：

| 类型 | 用途 | Bot 适用性 |
|------|------|-----------|
| **文字频道** | 文字聊天 | ✅ 最常用 |
| **语音频道** | 语音通话 | ⚠️ 有限支持 |
| **分类** | 频道分组 | - 组织用 |
| **论坛** | 话题讨论 | ✅ 支持发帖 |
| **公告** | 重要通知 | ✅ 适合推送 |

**理解层级结构**：
```
Discord 服务器（Guild）
├── 分类：📢 公告
│   ├── 频道：#欢迎
│   └── 频道：#更新日志
├── 分类：💬 交流
│   ├── 频道：# general
│   └── 频道：# help
└── 分类：🤖 Bot 专区
    ├── 频道：#bot-commands
    └── 频道：#bot-testing
```

### 7.2.2 角色（Role）与权限（Permission）

**角色是权限的集合**：
```
@管理员
├── 管理服务器
├── 管理频道
├── 踢出成员
└── 禁言成员

@普通成员
├── 发送消息
├── 添加反应
└── 使用斜杠命令

@新成员
└── 仅查看
```

**Bot 需要的典型权限**：

| 权限 | 用途 | 风险等级 |
|------|------|---------|
| **View Channels** | 查看频道 | 低 |
| **Send Messages** | 发送消息 | 低 |
| **Read Message History** | 读取历史消息 | 中 |
| **Manage Messages** | 管理消息（删除） | 中 |
| **Embed Links** | 发送嵌入消息 | 低 |
| **Attach Files** | 上传文件 | 中 |
| **Use Slash Commands** | 使用斜杠命令 | 低 |
| **Manage Threads** | 管理线程 | 中 |

### 7.2.3 消息类型与交互组件

**基础消息**：纯文本
```
Hello, world!
```

**嵌入消息（Embed）**：富文本卡片
```
┌─────────────────────────────┐
│ 📚 OpenClaw 教程更新           │
│                              │
│ 第7章已发布：Discord 集成      │
│                              │
│ [查看详情] [稍后阅读]         │
└─────────────────────────────┘
```

**交互组件**：
- **按钮**：点击触发操作
- **选择菜单**：下拉选择
- **模态框**：弹出表单
- **斜杠命令**：/command

---

## 7.3 创建 Discord Bot

### 7.3.1 在 Discord 开发者平台创建应用

**步骤一：访问开发者平台**
1. 打开 https://discord.com/developers/applications
2. 登录你的 Discord 账号
3. 点击 "New Application"

**步骤二：创建应用**
```
Name: MyOpenClawBot
（这个名字用户会看到）
```

**步骤三：添加 Bot**
1. 左侧菜单选择 "Bot"
2. 点击 "Add Bot"
3. 确认创建

**步骤四：获取 Token**
```
Token: MTQ3MDM5NTgyOTU0NTA3NDY5OA.GdcnGb.xxxxxx
（这是 Bot 的密码，不要泄露！）
```

### 7.3.2 配置 Bot 权限

**Privileged Gateway Intents**（需要开启）：

| Intent | 用途 | 是否必须 |
|--------|------|---------|
| **MESSAGE CONTENT** | 读取消息内容 | ✅ 必须 |
| **SERVER MEMBERS** | 获取成员列表 | 可选 |
| **PRESENCE** | 获取在线状态 | 可选 |

**为什么需要 MESSAGE CONTENT？**
```
不开：Bot 只能看到 "有人发了消息"，看不到内容
开启：Bot 可以看到 "用户说：今天天气怎么样"
```

### 7.3.3 邀请 Bot 加入服务器

**生成邀请链接**：

1. 左侧菜单选择 "OAuth2" → "URL Generator"
2. 选择 scopes：
   - ✅ `bot`（作为机器人）
   - ✅ `applications.commands`（斜杠命令）
3. 选择权限（建议）：
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Use Slash Commands
   - ✅ Manage Messages（可选）

**生成的链接**：
```
https://discord.com/api/oauth2/authorize?
  client_id=1470395829545074698
  &permissions=274877910080
  &scope=bot%20applications.commands
```

**点击链接，选择服务器，授权加入**。

---

## 7.4 OpenClaw 配置 Discord

### 7.4.1 基础配置

```yaml
# config.yaml

channels:
  discord:
    enabled: true
    token: ${DISCORD_BOT_TOKEN}  # 从开发者平台获取
    
    # 可选：指定监听的服务器
    # guilds:
    #   - "1094891738960764959"
    
    # 可选：指定监听的频道
    # channels:
    #   - "1472525158827819091"
```

### 7.4.2 环境变量设置

```bash
# .env 文件
DISCORD_BOT_TOKEN=MTQ3MDM5NTgyOTU0NTA3NDY5OA.GdcnGb.xxxxxx
```

### 7.4.3 启动测试

```bash
openclaw dev
```

看到日志：
```
✓ Discord bot connected
✓ Gateway ready
✓ Listening for messages...
```

在 Discord 中发送消息测试：
```
用户：你好
Bot：你好！我是 OpenClaw Agent，有什么可以帮助你的吗？
```

---

## 7.5 Discord 特有功能

### 7.5.1 斜杠命令（Slash Commands）

**什么是斜杠命令？**
```
用户输入：/weather 北京
Bot 响应：北京今天晴，25°C

而不是：
用户输入：查天气 北京
```

**优势**：
- 自动补全提示
- 参数类型校验
- 权限控制
- 更直观的交互

**OpenClaw 自动支持**：
```yaml
# 配置斜杠命令
agent:
  commands:
    - name: weather
      description: 查询天气
      options:
        - name: city
          description: 城市名称
          type: string
          required: true
```

### 7.5.2 嵌入消息（Embeds）

**让回复更美观**：

纯文本：
```
产品：OpenClaw
版本：v2.0
更新：新增 Discord 支持
```

嵌入消息：
```
┌─────────────────────────────┐
│ 🚀 OpenClaw v2.0 发布         │
│                              │
│ 📦 产品：OpenClaw            │
│ 🏷️ 版本：v2.0                │
│ 📝 更新：新增 Discord 支持    │
│                              │
│ [查看文档] [下载]            │
└─────────────────────────────┘
```

**OpenClaw 自动转换**：
```typescript
// Agent 返回标准格式
{
  title: "OpenClaw v2.0 发布",
  description: "新增 Discord 支持",
  fields: [
    { name: "产品", value: "OpenClaw" },
    { name: "版本", value: "v2.0" }
  ]
}

// Discord 适配器自动转为 Embed
```

### 7.5.3 线程（Threads）

**什么是线程？**
- 频道内的子话题
- 不污染主频道
- 支持自动归档

**使用场景**：
```
#help 频道中：
用户 A 提问："如何配置数据库？"
Bot 创建线程："帮助：数据库配置"
讨论在线程中进行
问题解决后自动归档
```

**OpenClaw 支持**：
```yaml
channels:
  discord:
    threads:
      enabled: true
      auto_create: true  # 自动为长对话创建线程
```

---

## 7.6 最佳实践

### 7.6.1 权限最小化原则

**只给 Bot 必要的权限**：
```
必需：
✓ View Channels
✓ Send Messages
✓ Read Message History
✓ Use Slash Commands

可选（按需开启）：
⚠ Manage Messages（需要删除消息时）
⚠ Manage Threads（需要管理线程时）
⚠ Attach Files（需要上传文件时）
```

### 7.6.2 频道隔离策略

**为 Bot 设置专用频道**：
```
Discord 服务器
├── #general（普通聊天，Bot 不回复）
├── #bot-commands（斜杠命令专用）
├── #bot-chat（与 Bot 对话）
└── #bot-logs（Bot 日志）
```

**配置**：
```yaml
channels:
  discord:
    allowed_channels:
      - "bot-commands-channel-id"
      - "bot-chat-channel-id"
```

### 7.6.3 速率限制处理

**Discord 的限流**：
- 全局：50 请求/秒
- 频道：5 请求/5秒
- 服务器：5 请求/5秒

**OpenClaw 自动处理**：
```
消息队列 → 限速发送 → 避免被封
```

---

## 7.7 常见问题

### Q: Bot 不响应消息？

**检查清单**：
1. ✅ Token 是否正确
2. ✅ MESSAGE CONTENT INTENT 是否开启
3. ✅ Bot 是否在频道中
4. ✅ 频道权限是否允许 Bot 读取和发送

### Q: 斜杠命令不显示？

**解决**：
1. 重新邀请 Bot（带 applications.commands 权限）
2. 等待 1 小时（全局命令同步需要时间）
3. 检查命令是否正确注册

### Q: 如何限制 Bot 只在特定频道工作？

**配置**：
```yaml
channels:
  discord:
    allowed_channels:
      - "123456789"  # 只允许这个频道
```

---

## 7.8 本章小结

### 核心要点

1. **Discord 优势**：机器人生态完善，实时互动，权限精细
2. **核心概念**：服务器、频道、角色、权限、消息类型
3. **创建 Bot**：开发者平台 → 创建应用 → 添加 Bot → 获取 Token
4. **配置权限**：MESSAGE CONTENT INTENT 必须开启
5. **特有功能**：斜杠命令、嵌入消息、线程

### 下一步

在下一章，我们将学习：
- Telegram 平台集成
- Telegram 的群组、话题、键盘等特色功能
- 与 Discord 的异同对比

---

## 参考资源

- Discord 开发者文档：https://discord.com/developers/docs
- Discord Bot 最佳实践：https://discord.com/developers/docs/topics/best-practices
- OpenClaw Discord 配置：https://docs.openclaw.ai/discord
