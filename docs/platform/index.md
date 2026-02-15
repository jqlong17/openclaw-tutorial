# 平台集成

OpenClaw 支持多种即时通讯平台的深度集成。

## 支持的平台

| 平台 | 特点 | 适用场景 |
|------|------|----------|
| **Discord** | 功能丰富，社区活跃 | 开源项目、游戏社区 |
| **Telegram** | 隐私安全，全球化 | 国际化产品、隐私敏感 |
| **飞书** | 企业办公，审批流程 | 国内企业、办公协同 |
| **iMessage** | 苹果生态，原生体验 | macOS 用户、个人助手 |

## 章节导航

- [第7章：Discord集成深度解析](/platform/chapter-07)
- [第8章：Discord高级功能与最佳实践](/platform/chapter-08)
- [第9章：Telegram集成深度解析](/platform/chapter-09)
- [第10章：飞书集成深度解析](/platform/chapter-10)
- [第11章：iMessage集成深度解析](/platform/chapter-11)

## 快速对比

```typescript
// Discord
const discordConfig = {
  token: process.env.DISCORD_TOKEN,
  intents: ['GuildMessages', 'DirectMessages'],
};

// Telegram
const telegramConfig = {
  token: process.env.TELEGRAM_TOKEN,
  webhook: true,
};

// 飞书
const larkConfig = {
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
  encryptKey: process.env.LARK_ENCRYPT_KEY,
};
```

选择适合你的平台，开始集成吧！