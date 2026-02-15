# 第 8 章：Discord 高级功能与最佳实践

> 本章将深入讲解 Discord 集成的高级功能，包括线程管理、权限系统、消息组件、自动化工作流等。

---

## 10.1 线程（Thread）高级管理

### 10.1.1 线程类型与创建

Discord 支持多种线程类型：

```typescript
// /src/discord/monitor/threading.ts

import { ChannelType, ThreadChannel } from '@buape/carbon';

enum ThreadType {
  PUBLIC_THREAD = 11,    // 公共线程（频道中可见）
  PRIVATE_THREAD = 12,   // 私有线程（仅邀请成员可见）
  ANNOUNCEMENT_THREAD = 10, // 公告线程（论坛帖子）
}

// 创建公共线程
async function createPublicThread(
  channelId: string,
  name: string,
  messageId: string,
  client: Client
): Promise<ThreadChannel> {
  const response = await client.rest.post(
    `/channels/${channelId}/messages/${messageId}/threads`,
    {
      body: {
        name,
        type: ChannelType.PublicThread,
        auto_archive_duration: 1440, // 24小时后自动归档
      },
    }
  );
  
  return new ThreadChannel(response, client);
}

// 创建私有线程
async function createPrivateThread(
  channelId: string,
  name: string,
  client: Client
): Promise<ThreadChannel> {
  const response = await client.rest.post(
    `/channels/${channelId}/threads`,
    {
      body: {
        name,
        type: ChannelType.PrivateThread,
        auto_archive_duration: 1440,
      },
    }
  );
  
  return new ThreadChannel(response, client);
}

// 创建论坛帖子（Forum Post）
async function createForumPost(
  forumChannelId: string,
  name: string,
  content: string,
  client: Client
) {
  const response = await client.rest.post(
    `/channels/${forumChannelId}/threads`,
    {
      body: {
        name,
        message: {
          content,
        },
        applied_tags: [], // 论坛标签
      },
    }
  );
  
  return response;
}
```

### 10.1.2 线程生命周期管理

```typescript
// 线程管理器
class ThreadManager {
  private activeThreads = new Map<string, ThreadInfo>();
  
  // 加入线程
  async joinThread(threadId: string, client: Client) {
    await client.rest.put(`/channels/${threadId}/thread-members/@me`);
    
    this.activeThreads.set(threadId, {
      id: threadId,
      joinedAt: new Date(),
      archived: false,
    });
  }
  
  // 离开线程
  async leaveThread(threadId: string, client: Client) {
    await client.rest.delete(`/channels/${threadId}/thread-members/@me`);
    this.activeThreads.delete(threadId);
  }
  
  // 归档线程
  async archiveThread(threadId: string, client: Client) {
    await client.rest.patch(`/channels/${threadId}`, {
      body: { archived: true },
    });
  }
  
  // 取消归档
  async unarchiveThread(threadId: string, client: Client) {
    await client.rest.patch(`/channels/${threadId}`, {
      body: { archived: false },
    });
  }
  
  // 删除线程
  async deleteThread(threadId: string, client: Client) {
    await client.rest.delete(`/channels/${threadId}`);
    this.activeThreads.delete(threadId);
  }
  
  // 添加成员到私有线程
  async addThreadMember(
    threadId: string,
    userId: string,
    client: Client
  ) {
    await client.rest.put(
      `/channels/${threadId}/thread-members/${userId}`
    );
  }
  
  // 获取线程成员列表
  async getThreadMembers(threadId: string, client: Client) {
    const response = await client.rest.get(
      `/channels/${threadId}/thread-members`
    );
    return response;
  }
}
```

### 10.1.3 线程消息处理

```typescript
// 处理线程中的消息
async function handleThreadMessage(
  message: DiscordMessage,
  threadContext: ThreadContext,
  client: Client
) {
  // 获取线程信息
  const thread = await client.channels.fetch(message.channel_id);
  
  if (!thread.isThread()) {
    return;
  }
  
  // 构建线程特定的上下文
  const context = {
    ...baseContext,
    ThreadLabel: `Discord thread #${thread.parent?.name} › ${thread.name}`,
    ThreadStarterBody: await getThreadStarterBody(thread),
    ParentSessionKey: buildParentSessionKey(thread.parentId),
  };
  
  // 线程特定的处理逻辑
  if (thread.parent?.type === ChannelType.GuildForum) {
    // 论坛帖子特殊处理
    await handleForumPostMessage(message, context, client);
  } else {
    // 普通线程处理
    await handleRegularThreadMessage(message, context, client);
  }
}

// 自动创建线程（当消息过长时）
async function autoCreateThread(
  channelId: string,
  messageId: string,
  topic: string,
  client: Client
): Promise<string> {
  const thread = await createPublicThread(
    channelId,
    topic.slice(0, 100), // 线程名称限制100字符
    messageId,
    client
  );
  
  // 发送引导消息
  await client.rest.post(`/channels/${thread.id}/messages`, {
    body: {
      content: `🧵 此话题已创建为新线程。继续在这里讨论吧！`,
    },
  });
  
  return thread.id;
}
```

### 10.1.4 论坛频道（Forum Channel）

```typescript
// 论坛频道特殊处理
interface ForumTag {
  id: string;
  name: string;
  emoji?: {
    id?: string;
    name?: string;
  };
  moderated: boolean;
}

// 获取论坛标签
async function getForumTags(
  forumChannelId: string,
  client: Client
): Promise<ForumTag[]> {
  const channel = await client.channels.fetch(forumChannelId);
  
  if (channel.type !== ChannelType.GuildForum) {
    throw new Error('Not a forum channel');
  }
  
  return channel.available_tags || [];
}

// 创建带标签的论坛帖子
async function createTaggedForumPost(
  forumChannelId: string,
  name: string,
  content: string,
  tagIds: string[],
  client: Client
) {
  return await client.rest.post(
    `/channels/${forumChannelId}/threads`,
    {
      body: {
        name,
        message: { content },
        applied_tags: tagIds,
      },
    }
  );
}

// 默认论坛回复计划
async function resolveForumAutoReplyPlan(
  message: DiscordMessage,
  forumChannel: ForumChannel,
  client: Client
): Promise<ReplyPlan> {
  // 论坛帖子总是回复到线程
  return {
    deliverTarget: `channel:${message.channel_id}`,
    replyTarget: `channel:${message.channel_id}`,
    replyReference: { use: () => undefined, markSent: () => {} },
    autoThreadContext: null,
  };
}
```

---

## 10.2 权限系统深度解析

### 10.2.1 权限计算

```typescript
// Discord 权限系统
import { PermissionFlagsBits } from 'discord-api-types/v10';

// 权限位运算
function calculatePermissions(
  basePermissions: bigint,
  allowPermissions: bigint,
  denyPermissions: bigint
): bigint {
  // 基础权限 + 允许的权限 - 拒绝的权限
  return (basePermissions | allowPermissions) & ~denyPermissions;
}

// 检查特定权限
function hasPermission(
  permissions: bigint,
  permission: bigint
): boolean {
  return (permissions & permission) === permission;
}

// 常用权限检查
const PERMISSION_CHECKS = {
  // 发送消息
  canSendMessages: (perms: bigint) => 
    hasPermission(perms, PermissionFlagsBits.SendMessages),
  
  // 管理消息
  canManageMessages: (perms: bigint) =>
    hasPermission(perms, PermissionFlagsBits.ManageMessages),
  
  // 创建线程
  canCreateThreads: (perms: bigint) =>
    hasPermission(perms, PermissionFlagsBits.CreatePublicThreads),
  
  // 管理线程
  canManageThreads: (perms: bigint) =>
    hasPermission(perms, PermissionFlagsBits.ManageThreads),
  
  // 管理员
  isAdmin: (perms: bigint) =>
    hasPermission(perms, PermissionFlagsBits.Administrator),
};

// 获取用户在频道的权限
async function getChannelPermissions(
  guildId: string,
  channelId: string,
  userId: string,
  client: Client
): Promise<bigint> {
  // 1. 获取用户角色
  const member = await client.rest.get(
    `/guilds/${guildId}/members/${userId}`
  );
  
  // 2. 获取频道权限覆盖
  const channel = await client.rest.get(`/channels/${channelId}`);
  
  // 3. 计算最终权限
  let permissions = BigInt(0);
  
  // @everyone 角色权限
  const everyoneRole = await client.rest.get(
    `/guilds/${guildId}/roles/${guildId}`
  );
  permissions |= BigInt(everyoneRole.permissions);
  
  // 用户角色权限
  for (const roleId of member.roles) {
    const role = await client.rest.get(
      `/guilds/${guildId}/roles/${roleId}`
    );
    permissions |= BigInt(role.permissions);
  }
  
  // 频道权限覆盖
  for (const overwrite of channel.permission_overwrites || []) {
    if (
      overwrite.id === userId ||
      member.roles.includes(overwrite.id)
    ) {
      permissions &= ~BigInt(overwrite.deny);
      permissions |= BigInt(overwrite.allow);
    }
  }
  
  return permissions;
}
```

### 10.2.2 角色管理

```typescript
// 角色管理器
class RoleManager {
  // 创建角色
  async createRole(
    guildId: string,
    name: string,
    color: number,
    permissions: bigint,
    client: Client
  ) {
    return await client.rest.post(`/guilds/${guildId}/roles`, {
      body: {
        name,
        color,
        permissions: permissions.toString(),
        hoist: true, // 在成员列表中单独显示
        mentionable: true, // 允许被@提及
      },
    });
  }
  
  // 分配角色给用户
  async assignRole(
    guildId: string,
    userId: string,
    roleId: string,
    client: Client
  ) {
    await client.rest.put(
      `/guilds/${guildId}/members/${userId}/roles/${roleId}`
    );
  }
  
  // 移除用户角色
  async removeRole(
    guildId: string,
    userId: string,
    roleId: string,
    client: Client
  ) {
    await client.rest.delete(
      `/guilds/${guildId}/members/${userId}/roles/${roleId}`
    );
  }
  
  // 获取用户最高角色
  async getHighestRole(
    guildId: string,
    userId: string,
    client: Client
  ) {
    const member = await client.rest.get(
      `/guilds/${guildId}/members/${userId}`
    );
    
    const roles = await Promise.all(
      member.roles.map(roleId =>
        client.rest.get(`/guilds/${guildId}/roles/${roleId}`)
      )
    );
    
    // 按位置排序，返回最高角色
    return roles.sort((a, b) => b.position - a.position)[0];
  }
}

// 命令权限检查
async function checkCommandPermission(
  interaction: Interaction,
  requiredPermission: bigint,
  client: Client
): Promise<boolean> {
  const member = interaction.member;
  
  if (!member) {
    // 私信中，检查是否是所有者
    return interaction.user.id === config.ownerId;
  }
  
  // 检查是否是管理员
  if (
    hasPermission(
      BigInt(member.permissions),
      PermissionFlagsBits.Administrator
    )
  ) {
    return true;
  }
  
  // 检查特定权限
  return hasPermission(
    BigInt(member.permissions),
    requiredPermission
  );
}
```

### 10.2.3 频道权限覆盖

```typescript
// 设置频道权限覆盖
async function setChannelPermission(
  channelId: string,
  targetId: string, // 用户ID或角色ID
  targetType: 'role' | 'member',
  allow: bigint,
  deny: bigint,
  client: Client
) {
  const type = targetType === 'role' ? 0 : 1;
  
  await client.rest.put(
    `/channels/${channelId}/permissions/${targetId}`,
    {
      body: {
        type,
        allow: allow.toString(),
        deny: deny.toString(),
      },
    }
  );
}

// 创建私有频道（仅特定角色可见）
async function createPrivateChannel(
  guildId: string,
  name: string,
  allowedRoleIds: string[],
  client: Client
) {
  // 1. 创建频道
  const channel = await client.rest.post(`/guilds/${guildId}/channels`, {
    body: {
      name,
      type: ChannelType.GuildText,
      permission_overwrites: [
        // 拒绝 @everyone
        {
          id: guildId,
          type: 0,
          allow: '0',
          deny: PermissionFlagsBits.ViewChannel.toString(),
        },
        // 允许指定角色
        ...allowedRoleIds.map(roleId => ({
          id: roleId,
          type: 0,
          allow: PermissionFlagsBits.ViewChannel.toString(),
          deny: '0',
        })),
      ],
    },
  });
  
  return channel;
}
```

---

## 10.3 高级消息组件

### 10.3.1 复杂 Embed 构建

```typescript
import { EmbedBuilder, ActionRowBuilder } from '@buape/carbon';

// 构建复杂的帮助文档 Embed
function createHelpEmbed(category: string, commands: Command[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`📚 帮助文档 - ${category}`)
    .setColor(0x5865F2) // Discord 蓝色
    .setTimestamp()
    .setFooter({
      text: '使用 /help [命令名] 查看详细说明',
      iconURL: 'https://...',
    });
  
  // 按功能分组
  const groups = groupBy(commands, 'group');
  
  for (const [groupName, groupCommands] of Object.entries(groups)) {
    const value = groupCommands
      .map(cmd => `
**/${cmd.name}** - ${cmd.description}
${cmd.examples?.map(e => `• \`${e}\``).join('\n') || ''}
      `.trim())
      .join('\n\n');
    
    embed.addFields({
      name: `📂 ${groupName}`,
      value: value.slice(0, 1024), // 字段限制
      inline: false,
    });
  }
  
  return embed;
}

// 构建状态监控 Embed
function createStatusMonitorEmbed(systemStatus: SystemStatus): EmbedBuilder {
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'degraded': return '🟡';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };
  
  return new EmbedBuilder()
    .setTitle('🦀 OpenClaw 系统状态')
    .setDescription(`最后更新: <t:${Math.floor(Date.now() / 1000)}:R>`)
    .setColor(systemStatus.overall === 'online' ? 0x57F287 : 0xED4245)
    .setThumbnail('https://...')
    .addFields(
      {
        name: `${getStatusEmoji(systemStatus.gateway)} Gateway`,
        value: `
延迟: ${systemStatus.gatewayLatency}ms
连接数: ${systemStatus.connections}
        `.trim(),
        inline: true,
      },
      {
        name: `${getStatusEmoji(systemStatus.ai)} AI 服务`,
        value: `
模型: ${systemStatus.model}
队列: ${systemStatus.queueLength}/${systemStatus.maxQueue}
        `.trim(),
        inline: true,
      },
      {
        name: `${getStatusEmoji(systemStatus.memory)} 记忆系统`,
        value: `
文件: ${systemStatus.memoryFiles}
向量: ${systemStatus.vectorCount}
        `.trim(),
        inline: true,
      },
      {
        name: '📊 资源使用',
        value: `
CPU: ${systemStatus.cpuUsage}%
内存: ${systemStatus.memoryUsage}MB
        `.trim(),
        inline: false,
      }
    )
    .setImage('https://.../status-graph.png'); // 可以附加图表
}

// 构建分页 Embed
function createPaginatedEmbed(
  items: unknown[],
  page: number,
  perPage: number,
  title: string
): { embed: EmbedBuilder; totalPages: number } {
  const totalPages = Math.ceil(items.length / perPage);
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  
  const embed = new EmbedBuilder()
    .setTitle(`${title} (第 ${page}/${totalPages} 页)`)
    .setColor(0x5865F2);
  
  for (const item of pageItems) {
    // 添加项目到 embed
  }
  
  return { embed, totalPages };
}
```

### 10.3.2 动态组件更新

```typescript
// 更新已有的消息组件
async function updateMessageComponents(
  channelId: string,
  messageId: string,
  newComponents: ActionRowBuilder<ButtonBuilder>[],
  client: Client
) {
  await client.rest.patch(
    `/channels/${channelId}/messages/${messageId}`,
    {
      body: {
        components: newComponents.map(c => c.toJSON()),
      },
    }
  );
}

// 禁用已点击的按钮
async function disableClickedButton(
  interaction: Interaction,
  client: Client
) {
  const message = interaction.message;
  
  // 复制原有组件
  const newComponents = message.components.map(row => {
    const newRow = new ActionRowBuilder<ButtonBuilder>();
    
    for (const component of row.components) {
      const button = new ButtonBuilder(component);
      
      // 禁用被点击的按钮
      if (component.custom_id === interaction.data.custom_id) {
        button.setDisabled(true);
        button.setStyle(ButtonStyle.Secondary);
      }
      
      newRow.addComponents(button);
    }
    
    return newRow;
  });
  
  await updateMessageComponents(
    message.channel_id,
    message.id,
    newComponents,
    client
  );
}

// 添加加载状态
async function showLoadingState(
  interaction: Interaction,
  client: Client
) {
  const loadingRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('loading')
        .setLabel('⏳ 处理中...')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  
  await client.rest.patch(
    `/channels/${interaction.channel_id}/messages/${interaction.message.id}`,
    {
      body: {
        components: [loadingRow.toJSON()],
      },
    }
  );
}
```

### 10.3.3 消息模板系统

```typescript
// 消息模板
interface MessageTemplate {
  content?: string;
  embeds?: EmbedBuilder[];
  components?: ActionRowBuilder<ButtonBuilder>[];
  attachments?: AttachmentBuilder[];
}

// 模板引擎
class MessageTemplateEngine {
  private templates = new Map<string, MessageTemplate>();
  
  register(name: string, template: MessageTemplate) {
    this.templates.set(name, template);
  }
  
  render(name: string, variables: Record<string, unknown>): MessageTemplate {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    
    // 替换变量
    const content = template.content?.replace(
      /\{\{(\w+)\}\}/g,
      (match, key) => String(variables[key] ?? match)
    );
    
    return {
      ...template,
      content,
    };
  }
}

// 使用示例
const templates = new MessageTemplateEngine();

templates.register('welcome', {
  content: '欢迎 {{username}} 加入服务器！',
  embeds: [
    new EmbedBuilder()
      .setTitle('🎉 新成员')
      .setDescription('请阅读规则后开始交流'),
  ],
});

// 渲染
const message = templates.render('welcome', {
  username: 'JohnDoe',
});
```

---

## 10.4 自动化工作流

### 10.4.1 自动归档线程

```typescript
// 自动归档管理器
class AutoArchiveManager {
  private checkInterval: NodeJS.Timeout;
  
  start(client: Client) {
    // 每小时检查一次
    this.checkInterval = setInterval(() => {
      this.checkAndArchiveThreads(client);
    }, 60 * 60 * 1000);
  }
  
  private async checkAndArchiveThreads(client: Client) {
    // 获取所有活跃的线程
    const activeThreads = await client.rest.get(
      '/users/@me/guilds/*/threads/active'
    );
    
    for (const thread of activeThreads.threads) {
      // 检查最后活动时间
      const lastActivity = new Date(thread.thread_metadata?.archive_timestamp);
      const daysSinceActivity = 
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      
      // 超过7天无活动，发送提醒
      if (daysSinceActivity > 7) {
        await this.sendArchiveWarning(thread, client);
      }
      
      // 超过14天无活动，自动归档
      if (daysSinceActivity > 14) {
        await this.archiveThread(thread, client);
      }
    }
  }
  
  private async sendArchiveWarning(thread: Thread, client: Client) {
    await client.rest.post(`/channels/${thread.id}/messages`, {
      body: {
        content: '⚠️ 此线程将在7天后自动归档。如需保持活跃，请发送消息。',
      },
    });
  }
  
  private async archiveThread(thread: Thread, client: Client) {
    await client.rest.patch(`/channels/${thread.id}`, {
      body: { archived: true },
    });
  }
}
```

### 10.4.2 消息审核系统

```typescript
// 消息审核器
class MessageModerator {
  private badWords = new Set(['spam', 'badword']);
  
  async moderateMessage(
    message: DiscordMessage,
    client: Client
  ): Promise<boolean> {
    // 检查敏感词
    if (this.containsBadWords(message.content)) {
      await this.handleBadWord(message, client);
      return false;
    }
    
    // 检查垃圾信息
    if (this.isSpam(message)) {
      await this.handleSpam(message, client);
      return false;
    }
    
    // 检查链接
    if (this.containsSuspiciousLinks(message.content)) {
      await this.handleSuspiciousLink(message, client);
      return false;
    }
    
    return true;
  }
  
  private containsBadWords(content: string): boolean {
    const lower = content.toLowerCase();
    return Array.from(this.badWords).some(word => 
      lower.includes(word)
    );
  }
  
  private async handleBadWord(
    message: DiscordMessage,
    client: Client
  ) {
    // 删除消息
    await client.rest.delete(
      `/channels/${message.channel_id}/messages/${message.id}`
    );
    
    // 警告用户
    await client.rest.post(`/channels/${message.channel_id}/messages`, {
      body: {
        content: `<@${message.author.id}> 请文明用语！`,
      },
    });
  }
  
  private isSpam(message: DiscordMessage): boolean {
    // 检查重复内容
    // 检查发送频率
    // 等等
    return false;
  }
}
```

### 10.4.3 定时任务集成

```typescript
// Discord 定时任务
interface DiscordScheduledTask {
  id: string;
  channelId: string;
  cronExpression: string;
  message: string;
  enabled: boolean;
}

class DiscordScheduler {
  private tasks = new Map<string, DiscordScheduledTask>();
  private cronJobs = new Map<string, CronJob>();
  
  addTask(task: DiscordScheduledTask, client: Client) {
    this.tasks.set(task.id, task);
    
    if (task.enabled) {
      this.scheduleTask(task, client);
    }
  }
  
  private scheduleTask(task: DiscordScheduledTask, client: Client) {
    const job = new CronJob(task.cronExpression, async () => {
      try {
        await client.rest.post(`/channels/${task.channelId}/messages`, {
          body: { content: task.message },
        });
      } catch (error) {
        console.error(`Failed to send scheduled message:`, error);
      }
    });
    
    job.start();
    this.cronJobs.set(task.id, job);
  }
  
  removeTask(taskId: string) {
    const job = this.cronJobs.get(taskId);
    if (job) {
      job.stop();
      this.cronJobs.delete(taskId);
    }
    this.tasks.delete(taskId);
  }
}

// 使用示例
const scheduler = new DiscordScheduler();

// 每天早上9点发送日报
scheduler.addTask({
  id: 'daily-report',
  channelId: '123456789',
  cronExpression: '0 9 * * *',
  message: '📊 早上好！今日数据已更新。',
  enabled: true,
}, client);
```

---

## 10.5 最佳实践

### 10.5.1 错误处理与重试

```typescript
// 带重试的 API 调用
async function callDiscordAPIWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      
      // 检查是否是可重试错误
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // 指数退避
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof DiscordAPIError) {
    // 5xx 错误和速率限制可重试
    return error.status >= 500 || error.code === 429;
  }
  return false;
}
```

### 10.5.2 性能优化

```typescript
// 批量消息发送
async function sendBulkMessages(
  channelId: string,
  messages: string[],
  client: Client
) {
  // 使用队列避免速率限制
  const queue = new PQueue({ concurrency: 1, interval: 1000 });
  
  for (const content of messages) {
    queue.add(() =>
      client.rest.post(`/channels/${channelId}/messages`, {
        body: { content },
      })
    );
  }
  
  await queue.onIdle();
}

// 缓存常用数据
class DiscordCache {
  private guildCache = new Map<string, Guild>();
  private channelCache = new Map<string, Channel>();
  private userCache = new Map<string, User>();
  
  async getGuild(guildId: string, client: Client): Promise<Guild> {
    if (this.guildCache.has(guildId)) {
      return this.guildCache.get(guildId)!;
    }
    
    const guild = await client.rest.get(`/guilds/${guildId}`);
    this.guildCache.set(guildId, guild);
    
    // 5分钟后过期
    setTimeout(() => this.guildCache.delete(guildId), 5 * 60 * 1000);
    
    return guild;
  }
}
```

### 10.5.3 日志与监控

```typescript
// Discord 事件日志
class DiscordEventLogger {
  log(event: string, data: unknown) {
    console.log(`[Discord] ${event}:`, JSON.stringify(data));
  }
  
  logMessageReceived(message: DiscordMessage) {
    this.log('MESSAGE_RECEIVED', {
      id: message.id,
      author: message.author.id,
      channel: message.channel_id,
      contentLength: message.content?.length,
    });
  }
  
  logInteraction(interaction: Interaction) {
    this.log('INTERACTION', {
      id: interaction.id,
      type: interaction.type,
      user: interaction.member?.user?.id,
      command: interaction.data?.name,
    });
  }
  
  logError(error: Error, context: string) {
    this.log('ERROR', {
      context,
      message: error.message,
      stack: error.stack,
    });
  }
}
```

---

## 本章小结

通过本章的学习，你应该掌握了：

1. **线程高级管理** - 创建、生命周期、论坛频道
2. **权限系统** - 计算、角色管理、频道覆盖
3. **高级组件** - 复杂 Embed、动态更新、模板系统
4. **自动化** - 自动归档、消息审核、定时任务
5. **最佳实践** - 错误处理、性能优化、日志监控

---

*下一章：第 11 章 记忆系统（AI Agent 篇）*
