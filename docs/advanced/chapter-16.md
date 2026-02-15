# 第 16 章：定时任务系统

> 本章将深入解析 OpenClaw 的定时任务系统，包括 Cron 表达式、任务配置、隔离执行和监控等。

---

## 16.1 Cron 基础

### 16.1.1 Cron 表达式

Cron 表达式用于定义任务的执行时间：

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 7, 0和7都代表周日)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**常用表达式示例**：

| 表达式 | 说明 |
|--------|------|
| `0 9 * * *` | 每天上午9点 |
| `0 */6 * * *` | 每6小时 |
| `0 9 * * 1` | 每周一上午9点 |
| `0 9 1 * *` | 每月1日上午9点 |
| `*/5 * * * *` | 每5分钟 |
| `0 9-17 * * 1-5` | 工作日9点到17点每小时 |

**特殊字符**：

| 字符 | 含义 |
|------|------|
| `*` | 任意值 |
| `,` | 列表分隔符（如 `1,3,5`） |
| `-` | 范围（如 `1-5`） |
| `/` | 步进（如 `*/5`） |
| `?` | 不指定（用于日期或星期） |
| `L` | 最后（如 `L` 表示最后一天） |
| `W` | 最近工作日 |

### 16.1.2 任务类型

OpenClaw 支持两种定时任务类型：

```typescript
// /src/cron/types.ts

enum CronJobType {
  SYSTEM_EVENT = 'systemEvent',  // 系统事件
  AGENT_TURN = 'agentTurn',      // Agent 执行
}

interface CronJob {
  id: string;
  name: string;
  schedule: CronSchedule;
  type: CronJobType;
  payload: SystemEventPayload | AgentTurnPayload;
  enabled: boolean;
  sessionTarget: 'main' | 'isolated';
}

// 系统事件类型
interface SystemEventPayload {
  kind: 'systemEvent';
  text: string;  // 触发消息内容
}

// Agent 执行类型
interface AgentTurnPayload {
  kind: 'agentTurn';
  message: string;  // 给 Agent 的消息
  model?: string;
  thinking?: string;
  timeoutSeconds?: number;
}
```

### 16.1.3 时区处理

```typescript
// /src/cron/timezone.ts

class CronTimezoneHandler {
  private timezone: string;
  
  constructor(timezone: string = 'UTC') {
    this.timezone = timezone;
  }
  
  // 将 Cron 表达式转换为本地时间
  getNextRunTime(cronExpr: string): Date {
    const interval = parseExpression(cronExpr, {
      tz: this.timezone,
    });
    
    return interval.next().toDate();
  }
  
  // 检查当前时间是否匹配
  matchesNow(cronExpr: string): boolean {
    const now = new Date();
    const cron = parseExpression(cronExpr, {
      tz: this.timezone,
      currentDate: now,
    });
    
    const next = cron.next().toDate();
    const prev = cron.prev().toDate();
    
    // 如果上一次执行就在最近一分钟内
    return now.getTime() - prev.getTime() < 60000;
  }
  
  // 获取用户友好的下次执行时间描述
  getNextRunDescription(cronExpr: string): string {
    const next = this.getNextRunTime(cronExpr);
    
    return formatDistanceToNow(next, {
      addSuffix: true,
      locale: this.getLocale(),
    });
  }
}
```

---

## 16.2 任务配置

### 16.2.1 添加定时任务

```typescript
// /src/cron/service/cron-service.ts

class CronService {
  private jobs = new Map<string, CronJob>();
  private scheduler: Scheduler;
  
  constructor(private config: CronConfig) {
    this.scheduler = new Scheduler();
  }
  
  // 添加定时任务
  async addJob(job: CronJob): Promise<void> {
    // 验证 Cron 表达式
    if (!this.validateCronExpression(job.schedule.expr)) {
      throw new Error(`Invalid cron expression: ${job.schedule.expr}`);
    }
    
    // 验证任务类型
    if (!this.validateJobPayload(job)) {
      throw new Error(`Invalid job payload for type: ${job.type}`);
    }
    
    // 保存到数据库
    await this.saveJobToDatabase(job);
    
    // 添加到调度器
    if (job.enabled) {
      this.scheduleJob(job);
    }
    
    this.jobs.set(job.id, job);
    
    console.log(`Added cron job: ${job.name} (${job.schedule.expr})`);
  }
  
  // 配置示例
  async createExampleJobs(): Promise<void> {
    // 每日早报
    await this.addJob({
      id: 'daily-briefing',
      name: '每日早报',
      schedule: {
        kind: 'cron',
        expr: '0 9 * * *',
        tz: 'Asia/Shanghai',
      },
      type: 'agentTurn',
      payload: {
        kind: 'agentTurn',
        message: '请生成今日早报，包括：1.今日日程 2.重要邮件提醒 3.待办事项',
      },
      enabled: true,
      sessionTarget: 'isolated',
    });
    
    // 每周总结
    await this.addJob({
      id: 'weekly-summary',
      name: '每周总结',
      schedule: {
        kind: 'cron',
        expr: '0 18 * * 5',  // 每周五18点
        tz: 'Asia/Shanghai',
      },
      type: 'agentTurn',
      payload: {
        kind: 'agentTurn',
        message: '请生成本周工作总结',
        model: 'kimi-coding/k2p5',
      },
      enabled: true,
      sessionTarget: 'isolated',
    });
    
    // 心跳检查
    await this.addJob({
      id: 'heartbeat-check',
      name: '心跳检查',
      schedule: {
        kind: 'every',
        everyMs: 30 * 60 * 1000,  // 每30分钟
      },
      type: 'systemEvent',
      payload: {
        kind: 'systemEvent',
        text: 'HEARTBEAT_CHECK',
      },
      enabled: true,
      sessionTarget: 'main',
    });
    
    // 一次性任务
    await this.addJob({
      id: 'reminder-meeting',
      name: '会议提醒',
      schedule: {
        kind: 'at',
        at: '2024-12-25T14:00:00+08:00',
      },
      type: 'systemEvent',
      payload: {
        kind: 'systemEvent',
        text: '会议将在15分钟后开始',
      },
      enabled: true,
      sessionTarget: 'main',
    });
  }
  
  private validateCronExpression(expr: string): boolean {
    try {
      parseExpression(expr);
      return true;
    } catch {
      return false;
    }
  }
  
  private validateJobPayload(job: CronJob): boolean {
    switch (job.type) {
      case 'systemEvent':
        return job.payload.kind === 'systemEvent' && 
               typeof job.payload.text === 'string';
      
      case 'agentTurn':
        return job.payload.kind === 'agentTurn' && 
               typeof job.payload.message === 'string';
      
      default:
        return false;
    }
  }
}
```

### 16.2.2 任务管理

```typescript
// /src/cron/service/job-management.ts

class JobManager {
  // 更新任务
  async updateJob(
    jobId: string,
    updates: Partial<CronJob>
  ): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    // 合并更新
    const updatedJob = { ...job, ...updates };
    
    // 如果调度变更，重新调度
    if (updates.schedule || updates.enabled !== undefined) {
      this.unscheduleJob(jobId);
      
      if (updatedJob.enabled) {
        this.scheduleJob(updatedJob);
      }
    }
    
    // 保存到数据库
    await this.saveJobToDatabase(updatedJob);
    
    this.jobs.set(jobId, updatedJob);
  }
  
  // 删除任务
  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    // 取消调度
    this.unscheduleJob(jobId);
    
    // 从数据库删除
    await this.deleteJobFromDatabase(jobId);
    
    this.jobs.delete(jobId);
    
    console.log(`Removed cron job: ${job.name}`);
  }
  
  // 暂停任务
  async pauseJob(jobId: string): Promise<void> {
    await this.updateJob(jobId, { enabled: false });
  }
  
  // 恢复任务
  async resumeJob(jobId: string): Promise<void> {
    await this.updateJob(jobId, { enabled: true });
  }
  
  // 立即执行任务
  async runJobNow(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    console.log(`Manually triggering job: ${job.name}`);
    
    await this.executeJob(job);
  }
  
  // 获取任务列表
  async listJobs(): Promise<CronJob[]> {
    return Array.from(this.jobs.values());
  }
  
  // 获取任务执行历史
  async getJobRuns(
    jobId: string,
    limit: number = 10
  ): Promise<JobRun[]> {
    return await this.database.query(
      `SELECT * FROM cron_runs 
       WHERE job_id = ? 
       ORDER BY started_at DESC 
       LIMIT ?`,
      [jobId, limit]
    );
  }
}
```

### 16.2.3 任务调度

```typescript
// /src/cron/service/scheduler.ts

class Scheduler {
  private scheduledTasks = new Map<string, ScheduledTask>();
  
  scheduleJob(job: CronJob): void {
    const task = this.createScheduledTask(job);
    
    switch (job.schedule.kind) {
      case 'cron':
        this.scheduleCronJob(job, task);
        break;
      
      case 'at':
        this.scheduleOneTimeJob(job, task);
        break;
      
      case 'every':
        this.scheduleIntervalJob(job, task);
        break;
    }
    
    this.scheduledTasks.set(job.id, task);
  }
  
  private scheduleCronJob(job: CronJob, task: ScheduledTask): void {
    const interval = parseExpression(job.schedule.expr, {
      tz: job.schedule.tz,
    });
    
    const scheduleNext = () => {
      const next = interval.next().toDate();
      const delay = next.getTime() - Date.now();
      
      task.timeoutId = setTimeout(async () => {
        await this.executeJob(job);
        scheduleNext();  // 调度下一次
      }, delay);
    };
    
    scheduleNext();
  }
  
  private scheduleOneTimeJob(job: CronJob, task: ScheduledTask): void {
    const targetTime = new Date(job.schedule.at!).getTime();
    const delay = targetTime - Date.now();
    
    if (delay <= 0) {
      console.warn(`Job ${job.id} scheduled time has passed`);
      return;
    }
    
    task.timeoutId = setTimeout(async () => {
      await this.executeJob(job);
      // 一次性任务，执行后自动删除
      await this.removeJob(job.id);
    }, delay);
  }
  
  private scheduleIntervalJob(job: CronJob, task: ScheduledTask): void {
    const interval = job.schedule.everyMs!;
    
    task.intervalId = setInterval(async () => {
      await this.executeJob(job);
    }, interval);
  }
  
  unscheduleJob(jobId: string): void {
    const task = this.scheduledTasks.get(jobId);
    if (!task) return;
    
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }
    
    if (task.intervalId) {
      clearInterval(task.intervalId);
    }
    
    this.scheduledTasks.delete(jobId);
  }
}
```

---

## 16.3 隔离执行

### 16.3.1 主会话 vs 隔离会话

| 特性 | 主会话 (main) | 隔离会话 (isolated) |
|------|---------------|---------------------|
| **上下文** | 共享主会话历史 | 独立上下文 |
| **记忆** | 可访问 MEMORY.md | 仅访问每日记忆 |
| **并发** | 串行执行 | 并行执行 |
| **用例** | 提醒、通知 | 定时报告、批量任务 |
| **隔离性** | 低 | 高 |

### 16.3.2 隔离执行实现

```typescript
// /src/cron/isolated-agent/isolated-runner.ts

class IsolatedAgentRunner {
  private workspaceDir: string;
  
  constructor(config: { workspaceDir: string }) {
    this.workspaceDir = config.workspaceDir;
  }
  
  async run(
    job: CronJob,
    delivery: DeliveryConfig
  ): Promise<JobResult> {
    // 创建隔离工作区
    const isolatedWorkspace = await this.createIsolatedWorkspace(job.id);
    
    try {
      // 准备环境
      await this.prepareEnvironment(isolatedWorkspace, job);
      
      // 执行 Agent
      const result = await this.executeAgent(
        isolatedWorkspace,
        job.payload as AgentTurnPayload
      );
      
      // 发送结果
      if (delivery.mode === 'announce') {
        await this.announceResult(result, delivery);
      }
      
      return {
        success: true,
        output: result,
      };
      
    } catch (error) {
      console.error(`Isolated job ${job.id} failed:`, error);
      
      return {
        success: false,
        error: (error as Error).message,
      };
      
    } finally {
      // 清理工作区
      await this.cleanupWorkspace(isolatedWorkspace);
    }
  }
  
  private async createIsolatedWorkspace(jobId: string): Promise<string> {
    const workspacePath = join(
      this.workspaceDir,
      'isolated',
      `${jobId}_${Date.now()}`
    );
    
    await mkdir(workspacePath, { recursive: true });
    
    // 创建基础结构
    await mkdir(join(workspacePath, 'memory'), { recursive: true });
    
    return workspacePath;
  }
  
  private async prepareEnvironment(
    workspace: string,
    job: CronJob
  ): Promise<void> {
    // 复制必要的配置文件
    const configFiles = ['SOUL.md', 'IDENTITY.md'];
    
    for (const file of configFiles) {
      const source = join(this.workspaceDir, file);
      const target = join(workspace, file);
      
      try {
        await copyFile(source, target);
      } catch {
        // 文件可能不存在，忽略
      }
    }
    
    // 创建 AGENTS.md（简化版）
    await writeFile(
      join(workspace, 'AGENTS.md'),
      this.generateIsolatedAgentsMd(job)
    );
    
    // 复制今日记忆
    const today = format(new Date(), 'yyyy-MM-dd');
    const memorySource = join(this.workspaceDir, 'memory', `${today}.md`);
    const memoryTarget = join(workspace, 'memory', `${today}.md`);
    
    try {
      await copyFile(memorySource, memoryTarget);
    } catch {
      // 今日记忆可能不存在，创建空文件
      await writeFile(memoryTarget, `# ${today}\n\n`);
    }
  }
  
  private async executeAgent(
    workspace: string,
    payload: AgentTurnPayload
  ): Promise<string> {
    // 启动 Agent 进程
    const agent = new AgentRunner({
      workspaceDir: workspace,
      model: payload.model,
      thinking: payload.thinking,
    });
    
    await agent.initialize();
    
    // 执行消息
    const response = await agent.processMessage({
      content: payload.message,
      timestamp: Date.now(),
    });
    
    await agent.cleanup();
    
    return response.content;
  }
  
  private async announceResult(
    result: string,
    delivery: DeliveryConfig
  ): Promise<void> {
    // 发送到指定频道
    await message.send({
      channel: delivery.channel,
      to: delivery.to,
      message: result,
    });
  }
  
  private async cleanupWorkspace(workspace: string): Promise<void> {
    // 保留日志和输出
    const logsDir = join(this.workspaceDir, 'isolated_logs');
    await mkdir(logsDir, { recursive: true });
    
    // 移动重要文件
    const basename = basename(workspace);
    await rename(
      join(workspace, 'memory'),
      join(logsDir, `${basename}_memory`)
    ).catch(() => {});
    
    // 删除工作区
    await rm(workspace, { recursive: true, force: true });
  }
  
  private generateIsolatedAgentsMd(job: CronJob): string {
    return `# AGENTS.md - Isolated Execution

This is an isolated execution environment for cron job: ${job.name}

## Constraints

- You are running in an isolated session
- MEMORY.md is NOT available for security reasons
- Only today's memory file is accessible
- Focus on completing the specific task

## Task

${job.payload.kind === 'agentTurn' 
  ? (job.payload as AgentTurnPayload).message 
  : 'Execute scheduled task'}
`;
  }
}
```

### 16.3.3 执行环境隔离

```typescript
// /src/cron/isolated-agent/sandbox.ts

class ExecutionSandbox {
  // 资源限制
  private resourceLimits = {
    maxMemoryMB: 512,
    maxExecutionTimeMs: 5 * 60 * 1000,  // 5分钟
    maxOutputSizeMB: 10,
  };
  
  async runWithLimits(
    fn: () => Promise<unknown>
  ): Promise<unknown> {
    // 设置内存限制
    const memLimit = this.resourceLimits.maxMemoryMB * 1024 * 1024;
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, this.resourceLimits.maxExecutionTimeMs);
    });
    
    // 竞争执行
    return Promise.race([
      fn(),
      timeoutPromise,
    ]);
  }
  
  // 文件系统隔离
  createFsSandbox(workspace: string): typeof fs {
    const allowedPaths = [
      workspace,
      '/tmp',
    ];
    
    return new Proxy(fs, {
      get(target, prop) {
        const original = target[prop as keyof typeof fs];
        
        if (typeof original !== 'function') {
          return original;
        }
        
        return (...args: any[]) => {
          // 检查路径
          const pathArg = args.find(a => 
            typeof a === 'string' && (a.startsWith('/') || a.startsWith('./'))
          );
          
          if (pathArg) {
            const resolved = resolve(pathArg);
            const allowed = allowedPaths.some(p => 
              resolved.startsWith(resolve(p))
            );
            
            if (!allowed) {
              throw new Error(`Access denied: ${pathArg}`);
            }
          }
          
          return (original as Function).apply(target, args);
        };
      },
    });
  }
}
```

---

## 16.4 监控与日志

### 16.4.1 执行日志

```typescript
// /src/cron/service/logging.ts

interface JobRun {
  id: string;
  jobId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  durationMs?: number;
}

class CronLogger {
  private db: Database;
  
  async logJobStart(jobId: string): Promise<string> {
    const runId = generateId();
    
    await this.db.run(
      `INSERT INTO cron_runs (id, job_id, started_at, status)
       VALUES (?, ?, ?, ?)`,
      [runId, jobId, new Date().toISOString(), 'running']
    );
    
    console.log(`[Cron] Job ${jobId} started (run: ${runId})`);
    
    return runId;
  }
  
  async logJobComplete(
    runId: string,
    output: string
  ): Promise<void> {
    const completedAt = new Date();
    
    const run = await this.db.get(
      'SELECT started_at FROM cron_runs WHERE id = ?',
      [runId]
    );
    
    const durationMs = completedAt.getTime() - 
      new Date(run.started_at).getTime();
    
    await this.db.run(
      `UPDATE cron_runs 
       SET completed_at = ?, status = ?, output = ?, duration_ms = ?
       WHERE id = ?`,
      [completedAt.toISOString(), 'completed', output, durationMs, runId]
    );
    
    console.log(`[Cron] Job completed (run: ${runId}, duration: ${durationMs}ms)`);
  }
  
  async logJobError(
    runId: string,
    error: Error
  ): Promise<void> {
    const completedAt = new Date();
    
    await this.db.run(
      `UPDATE cron_runs 
       SET completed_at = ?, status = ?, error = ?
       WHERE id = ?`,
      [completedAt.toISOString(), 'failed', error.message, runId]
    );
    
    console.error(`[Cron] Job failed (run: ${runId}):`, error);
  }
  
  // 获取执行统计
  async getJobStats(jobId: string): Promise<JobStats> {
    const stats = await this.db.get(
      `SELECT 
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
        AVG(duration_ms) as avg_duration_ms
      FROM cron_runs
      WHERE job_id = ?`,
      [jobId]
    );
    
    return {
      totalRuns: stats.total_runs,
      successfulRuns: stats.successful_runs,
      failedRuns: stats.failed_runs,
      successRate: stats.total_runs > 0 
        ? stats.successful_runs / stats.total_runs 
        : 0,
      averageDurationMs: stats.avg_duration_ms || 0,
    };
  }
}
```

### 16.4.2 失败重试

```typescript
// /src/cron/service/retry.ts

class JobRetryHandler {
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 15000];  // 1s, 5s, 15s
  
  async executeWithRetry(
    job: CronJob,
    executor: () => Promise<void>
  ): Promise<void> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await executor();
        return;  // 成功，退出
      } catch (error) {
        lastError = error as Error;
        
        console.warn(
          `[Cron] Job ${job.id} attempt ${attempt + 1} failed:`,
          lastError.message
        );
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelays[attempt];
          console.log(`[Cron] Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
    
    // 所有重试失败
    throw new Error(
      `Job ${job.id} failed after ${this.maxRetries + 1} attempts: ${lastError!.message}`
    );
  }
}
```

### 16.4.3 告警通知

```typescript
// /src/cron/service/alerts.ts

class CronAlertManager {
  // 连续失败告警
  async checkConsecutiveFailures(jobId: string): Promise<void> {
    const recentRuns = await this.db.all(
      `SELECT status FROM cron_runs
       WHERE job_id = ?
       ORDER BY started_at DESC
       LIMIT 3`,
      [jobId]
    );
    
    const allFailed = recentRuns.every(r => r.status === 'failed');
    
    if (allFailed && recentRuns.length >= 3) {
      await this.sendAlert({
        type: 'consecutive_failures',
        jobId,
        message: `Job ${jobId} has failed 3 times in a row`,
        severity: 'warning',
      });
    }
  }
  
  // 执行时间过长告警
  async checkExecutionTime(
    jobId: string,
    durationMs: number
  ): Promise<void> {
    const threshold = 5 * 60 * 1000;  // 5分钟
    
    if (durationMs > threshold) {
      await this.sendAlert({
        type: 'long_execution',
        jobId,
        message: `Job ${jobId} took ${durationMs}ms to complete`,
        severity: 'info',
      });
    }
  }
  
  private async sendAlert(alert: Alert): Promise<void> {
    // 发送通知
    await message.send({
      channel: 'discord',
      to: 'admin-channel',
      message: `🚨 Cron Alert: ${alert.message}`,
    });
    
    // 记录到数据库
    await this.db.run(
      `INSERT INTO cron_alerts (type, job_id, message, severity, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [alert.type, alert.jobId, alert.message, alert.severity, new Date()]
    );
  }
}
```

---

## 本章小结

通过本章的学习，你应该掌握了：

1. **Cron 基础** - 表达式语法、任务类型、时区处理
2. **任务配置** - 添加、更新、删除、执行任务
3. **隔离执行** - 主会话 vs 隔离会话、环境隔离
4. **监控日志** - 执行日志、失败重试、告警通知

---

*下一章：第 17 章 插件系统*
