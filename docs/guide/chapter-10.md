# 第 10 章：飞书（Lark）集成深度解析

> 本章将深入解析 OpenClaw 与飞书（Lark）的集成，包括 Bot 创建、消息处理、卡片交互、审批流程等企业级功能。

---

## 9.1 飞书 Bot 基础

### 9.1.1 飞书开放平台配置

**步骤 1：创建企业自建应用**

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 点击"创建企业自建应用"
3. 填写应用名称和描述
4. 选择应用类型（内部应用/商店应用）

**步骤 2：配置机器人能力**

进入应用详情页，启用以下能力：

| 能力 | 说明 | 配置位置 |
|------|------|----------|
| **机器人** | 启用Bot功能 | 添加应用能力 → 机器人 |
| **通讯录权限** | 读取用户信息 | 权限管理 → 通讯录 |
| **消息权限** | 发送/接收消息 | 权限管理 → 消息 |
| **群组权限** | 读取群组信息 | 权限管理 → 群组 |

**步骤 3：获取凭证**

```
应用凭证
├── App ID: cli_xxxxxxxxxxxxxxxx
├── App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
└── Encrypt Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

机器人设置
├── Webhook URL: https://your-domain.com/webhook/lark
└── Verification Token: xxxxxxxxxxxxxxxxxxxxxxx
```

### 9.1.2 Token 获取与配置

```typescript
// Token 管理器
class LarkTokenManager {
  private token: string | null = null;
  private expiresAt: number = 0;
  
  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - 60000) {
      return this.token;
    }
    return this.refreshToken();
  }
  
  private async refreshToken(): Promise<string> {
    const response = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret }),
      }
    );
    
    const data = await response.json();
    this.token = data.tenant_access_token;
    this.expiresAt = Date.now() + data.expire * 1000;
    
    return this.token;
  }
}
```

### 9.1.3 事件订阅配置

```typescript
// Webhook 服务器
class LarkWebhookServer {
  private server: ReturnType<typeof createServer>;
  
  start() {
    this.server = createServer((req, res) => {
      if (req.url === '/webhook/lark' && req.method === 'POST') {
        this.handleWebhook(req, res);
      }
    });
    
    this.server.listen(this.port);
  }
  
  private async handleWebhook(req, res) {
    const body = await readBody(req);
    const event = JSON.parse(body);
    
    // URL 验证
    if (event.type === 'url_verification') {
      res.end(JSON.stringify({ challenge: event.challenge }));
      return;
    }
    
    // 处理事件
    for (const handler of this.messageHandlers) {
      handler(event);
    }
    
    res.end('OK');
  }
}
```

---

## 9.2 消息处理

### 9.2.1 接收消息事件

```typescript
interface LarkEvent {
  schema: '2.0';
  header: {
    event_id: string;
    event_type: string;
    create_time: string;
    token: string;
    app_id: string;
    tenant_key: string;
  };
  event: {
    sender: {
      sender_id: {
        union_id: string;
        user_id: string;
        open_id: string;
      };
      sender_type: string;
      tenant_key: string;
    };
    message: {
      message_id: string;
      root_id?: string;
      parent_id?: string;
      create_time: string;
      chat_id: string;
      chat_type: 'p2p' | 'group';
      message_type: 'text' | 'image' | 'file' | 'post';
      content: string;
      mentions?: Array<{
        key: string;
        id: {
          union_id: string;
          user_id: string;
          open_id: string;
        };
        name: string;
        tenant_key: string;
      }>;
    };
  };
}
```

### 9.2.2 发送消息

```typescript
// 发送文本消息
async function sendTextMessage(
  chatId: string,
  text: string,
  token: string
): Promise<void> {
  await fetch('https://open.feishu.cn/open-apis/im/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }),
  });
}

// 发送富文本消息
async function sendPostMessage(
  chatId: string,
  title: string,
  content: PostContent[],
  token: string
): Promise<void> {
  await fetch('https://open.feishu.cn/open-apis/im/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'post',
      content: JSON.stringify({
        zh_cn: {
          title,
          content,
        },
      }),
    }),
  });
}
```

### 9.2.3 消息免打扰

```typescript
// 检查用户是否设置了免打扰
async function checkUserDoNotDisturb(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    await sendTextMessage(userId, '', token);
    return false;
  } catch (error: any) {
    // 错误码 230003 表示用户设置了免打扰
    if (error.code === 230003) {
      return true;
    }
    throw error;
  }
}
```

---

## 9.3 卡片交互

### 9.3.1 交互式卡片

```typescript
// 创建交互式卡片
function createInteractiveCard(): Card {
  return {
    config: {
      wide_screen_mode: true,
      enable_forward: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '🦀 OpenClaw 助手',
      },
      subtitle: {
        tag: 'plain_text',
        content: '您的智能工作伙伴',
      },
      template: 'blue',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '请选择您需要的功能：',
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '💬 开始对话',
            },
            type: 'primary',
            value: {
              action: 'start_chat',
            },
          },
          {
            tag: 'button',
            text: {
              tag: 'plain_text',
              content: '⚙️ 设置',
            },
            type: 'default',
            value: {
              action: 'open_settings',
            },
          },
        ],
      },
    ],
  };
}

// 发送卡片消息
async function sendCardMessage(
  chatId: string,
  card: Card,
  token: string
): Promise<void> {
  await fetch('https://open.feishu.cn/open-apis/im/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    }),
  });
}
```

### 9.3.2 卡片回调处理

```typescript
// 处理卡片回调
async function handleCardCallback(
  event: CardCallbackEvent,
  token: string
) {
  const { action, open_chat_id, open_message_id } = event;
  
  switch (action.value.action) {
    case 'start_chat':
      await handleStartChat(open_chat_id, token);
      break;
    case 'open_settings':
      await handleOpenSettings(open_chat_id, token);
      break;
  }
}
```

---

## 9.4 企业级功能

### 9.4.1 审批流程集成

```typescript
// 创建审批实例
async function createApprovalInstance(
  approvalCode: string,
  userId: string,
  formData: Record<string, unknown>,
  token: string
) {
  const response = await fetch(
    'https://open.feishu.cn/open-apis/approval/v4/instances',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approval_code: approvalCode,
        user_id: userId,
        form: JSON.stringify(formData),
      }),
    }
  );
  
  return await response.json();
}
```

### 9.4.2 日程管理

```typescript
// 创建日程
async function createCalendarEvent(
  userId: string,
  event: CalendarEvent,
  token: string
) {
  const response = await fetch(
    'https://open.feishu.cn/open-apis/calendar/v4/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        start_time: {
          timestamp: Math.floor(event.startTime / 1000).toString(),
        },
        end_time: {
          timestamp: Math.floor(event.endTime / 1000).toString(),
        },
        attendees: event.attendees.map(id => ({ user_id: id })),
      }),
    }
  );
  
  return await response.json();
}
```

### 9.4.3 文档协作

```typescript
// 创建文档
async function createDocument(
  title: string,
  content: string,
  folderToken: string,
  token: string
) {
  const response = await fetch(
    'https://open.feishu.cn/open-apis/doc/v2/create',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        folder_token: folderToken,
      }),
    }
  );
  
  return await response.json();
}
```

---

## 本章小结

通过本章的学习，你应该掌握了：

1. **飞书 Bot 基础** - 应用创建、Token 管理、事件订阅
2. **消息处理** - 接收/发送消息、富文本、免打扰
3. **卡片交互** - 交互式卡片、回调处理、表单
4. **企业级功能** - 审批流程、日程管理、文档协作

**飞书 vs Discord 对比**：

| 特性 | 飞书 | Discord |
|------|------|---------|
| 定位 | 企业办公 | 社区/游戏 |
| 消息类型 | 文本/富文本/卡片 | 文本/Embed |
| 交互方式 | 卡片交互 | 按钮/菜单 |
| 企业功能 | 审批/日程/文档 | 较弱 |
| 部署方式 | 企业内部 | 公开服务器 |

---

*下一章：iMessage 集成*
