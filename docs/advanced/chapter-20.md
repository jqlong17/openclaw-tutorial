# 第 20 章：性能优化

> 本章将深入解析 OpenClaw 的性能优化策略，包括监控、缓存、并发和资源管理。

---

## 20.1 性能监控

### 20.1.1 指标收集

```typescript
// /src/metrics/collector.ts

interface PerformanceMetrics {
  // 系统指标
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
    loadAverage: number[];
  };
  
  // 应用指标
  application: {
    activeConnections: number;
    requestRate: number;
    errorRate: number;
    averageResponseTime: number;
  };
  
  // 业务指标
  business: {
    messagesProcessed: number;
    agentExecutions: number;
    toolCalls: number;
    cacheHitRate: number;
  };
}

class MetricsCollector {
  private metrics: Partial<PerformanceMetrics> = {};
  private exporters: MetricsExporter[] = [];
  private collectInterval: NodeJS.Timeout;
  
  constructor(intervalMs: number = 10000) {
    this.collectInterval = setInterval(() => {
      this.collect();
    }, intervalMs);
  }
  
  // 收集指标
  private async collect(): Promise<void> {
    this.metrics = {
      system: await this.collectSystemMetrics(),
      application: await this.collectApplicationMetrics(),
      business: await this.collectBusinessMetrics(),
    };
    
    // 导出到所有 exporter
    for (const exporter of this.exporters) {
      await exporter.export(this.metrics as PerformanceMetrics);
    }
  }
  
  private async collectSystemMetrics() {
    const usage = process.cpuUsage();
    const mem = process.memoryUsage();
    
    return {
      cpuUsage: (usage.user + usage.system) / 1000000,  // 转换为秒
      memoryUsage: mem.heapUsed / 1024 / 1024,  // MB
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
    };
  }
  
  private async collectApplicationMetrics() {
    // 从请求拦截器获取
    return {
      activeConnections: this.getActiveConnections(),
      requestRate: this.calculateRequestRate(),
      errorRate: this.calculateErrorRate(),
      averageResponseTime: this.calculateAverageResponseTime(),
    };
  }
  
  private async collectBusinessMetrics() {
    return {
      messagesProcessed: this.counters.messagesProcessed.get(),
      agentExecutions: this.counters.agentExecutions.get(),
      toolCalls: this.counters.toolCalls.get(),
      cacheHitRate: this.cache.getHitRate(),
    };
  }
  
  // 注册 exporter
  registerExporter(exporter: MetricsExporter): void {
    this.exporters.push(exporter);
  }
  
  // 获取当前指标
  getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics;
  }
}

// Prometheus Exporter
class PrometheusExporter implements MetricsExporter {
  private port: number;
  
  async export(metrics: PerformanceMetrics): Promise<void> {
    // 启动 HTTP 端点供 Prometheus 抓取
    // /metrics 返回 Prometheus 格式的指标
  }
}

// InfluxDB Exporter
class InfluxDBExporter implements MetricsExporter {
  async export(metrics: PerformanceMetrics): Promise<void> {
    // 写入 InfluxDB
  }
}
```

### 20.1.2 链路追踪

```typescript
// /src/tracing/tracer.ts

interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  tags: Record<string, string>;
  logs: Array<{ timestamp: number; message: string }>;
}

class Tracer {
  private spans = new Map<string, Span>();
  private exporter: SpanExporter;
  
  // 开始追踪
  startSpan(name: string, parentId?: string): string {
    const span: Span = {
      id: generateId(),
      traceId: parentId 
        ? this.spans.get(parentId)!.traceId 
        : generateId(),
      parentId,
      name,
      startTime: Date.now(),
      tags: {},
      logs: [],
    };
    
    this.spans.set(span.id, span);
    
    return span.id;
  }
  
  // 结束追踪
  endSpan(spanId: string): void {
    const span = this.spans.get(spanId);
    if (!span) return;
    
    span.endTime = Date.now();
    
    // 如果是根 span，导出整个链路
    if (!span.parentId) {
      this.exportTrace(span.traceId);
    }
  }
  
  // 添加标签
  setTag(spanId: string, key: string, value: string): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }
  
  // 记录日志
  log(spanId: string, message: string): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
      });
    }
  }
  
  private exportTrace(traceId: string): void {
    const traceSpans = Array.from(this.spans.values())
      .filter(s => s.traceId === traceId);
    
    this.exporter.export(traceSpans);
    
    // 清理
    for (const span of traceSpans) {
      this.spans.delete(span.id);
    }
  }
}

// 使用装饰器自动追踪
function Trace(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const spanName = name || `${target.constructor.name}.${propertyKey}`;
      const spanId = tracer.startSpan(spanName);
      
      try {
        tracer.setTag(spanId, 'args', JSON.stringify(args));
        
        const result = await original.apply(this, args);
        
        tracer.setTag(spanId, 'status', 'success');
        return result;
        
      } catch (error) {
        tracer.setTag(spanId, 'status', 'error');
        tracer.setTag(spanId, 'error', (error as Error).message);
        throw error;
        
      } finally {
        tracer.endSpan(spanId);
      }
    };
  };
}
```

### 20.1.3 性能分析

```typescript
// /src/profiling/profiler.ts

class PerformanceProfiler {
  private isProfiling = false;
  private profileData: ProfileData[] = [];
  
  // 启动 CPU 分析
  startCPUProfile(): void {
    this.isProfiling = true;
    // 使用 v8-profiler-next
    require('v8-profiler-next').startProfiling('cpu');
  }
  
  // 停止 CPU 分析
  stopCPUProfile(): object {
    this.isProfiling = false;
    const profile = require('v8-profiler-next').stopProfiling('cpu');
    
    return profile.export();
  }
  
  // 内存快照
  takeHeapSnapshot(): object {
    return require('v8').writeHeapSnapshot();
  }
  
  // 分析事件循环延迟
  measureEventLoopLag(): Promise<number> {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      
      setImmediate(() => {
        const end = process.hrtime.bigint();
        const lag = Number(end - start) / 1000000;  // 转换为毫秒
        resolve(lag);
      });
    });
  }
}
```

---

## 20.2 缓存策略

### 20.2.1 多级缓存

```typescript
// /src/cache/multi-level-cache.ts

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

class MultiLevelCache<T> {
  private l1: Map<string, CacheEntry<T>>;  // 内存缓存
  private l2: RedisClient;                  // Redis 缓存
  private l3?: CacheStorage;                // 本地文件缓存
  
  private l1MaxSize = 1000;
  private defaultTTL = 3600000;  // 1小时
  
  constructor(redis: RedisClient) {
    this.l1 = new Map();
    this.l2 = redis;
  }
  
  // 获取缓存
  async get(key: string): Promise<T | null> {
    // L1: 内存
    const l1Entry = this.l1.get(key);
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      return l1Entry.value;
    }
    
    // L2: Redis
    const l2Value = await this.l2.get(key);
    if (l2Value) {
      const entry: CacheEntry<T> = JSON.parse(l2Value);
      
      // 回填 L1
      this.setL1(key, entry);
      
      return entry.value;
    }
    
    return null;
  }
  
  // 设置缓存
  async set(
    key: string,
    value: T,
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + (options.ttl || this.defaultTTL),
      tags: options.tags || [],
    };
    
    // L1
    this.setL1(key, entry);
    
    // L2
    await this.l2.setex(
      key,
      Math.floor((options.ttl || this.defaultTTL) / 1000),
      JSON.stringify(entry)
    );
  }
  
  // 按标签清除
  async invalidateByTag(tag: string): Promise<void> {
    // 清除 L1
    for (const [key, entry] of this.l1) {
      if (entry.tags.includes(tag)) {
        this.l1.delete(key);
      }
    }
    
    // 清除 L2（需要维护标签索引）
    const keys = await this.l2.smembers(`tag:${tag}`);
    for (const key of keys) {
      await this.l2.del(key);
    }
    await this.l2.del(`tag:${tag}`);
  }
  
  private setL1(key: string, entry: CacheEntry<T>): void {
    // LRU 淘汰
    if (this.l1.size >= this.l1MaxSize) {
      const firstKey = this.l1.keys().next().value;
      this.l1.delete(firstKey);
    }
    
    this.l1.set(key, entry);
  }
}
```

### 20.2.2 智能缓存

```typescript
// /src/cache/smart-cache.ts

class SmartCache {
  private cache: MultiLevelCache<unknown>;
  private accessPatterns = new Map<string, AccessPattern>();
  
  // 自适应 TTL
  async getWithAdaptiveTTL<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.cache.get(key);
    if (cached) {
      this.recordAccess(key, 'hit');
      return cached as T;
    }
    
    this.recordAccess(key, 'miss');
    
    const value = await fetcher();
    
    // 根据访问模式计算 TTL
    const pattern = this.accessPatterns.get(key);
    const ttl = this.calculateTTL(pattern);
    
    await this.cache.set(key, value, { ttl });
    
    return value;
  }
  
  private calculateTTL(pattern?: AccessPattern): number {
    if (!pattern) return 3600000;  // 默认 1 小时
    
    // 高频访问：长缓存
    if (pattern.hitRate > 0.8) {
      return 24 * 3600000;  // 24 小时
    }
    
    // 低频访问：短缓存
    if (pattern.hitRate < 0.2) {
      return 300000;  // 5 分钟
    }
    
    return 3600000;
  }
  
  // 预加载
  async preload(keys: string[], fetcher: (key: string) => Promise<unknown>): Promise<void> {
    // 并行预加载
    await Promise.all(
      keys.map(async (key) => {
        const value = await fetcher(key);
        await this.cache.set(key, value);
      })
    );
  }
}
```

### 20.2.3 缓存一致性

```typescript
// /src/cache/consistency.ts

class CacheConsistencyManager {
  private cache: MultiLevelCache<unknown>;
  private eventBus: EventEmitter;
  
  constructor(cache: MultiLevelCache<unknown>, eventBus: EventEmitter) {
    this.cache = cache;
    this.eventBus = eventBus;
    
    // 监听失效事件
    this.eventBus.on('cache:invalidate', (event) => {
      this.handleInvalidation(event);
    });
  }
  
  // 写穿透
  async writeThrough<T>(
    key: string,
    value: T,
    writeToDB: () => Promise<void>
  ): Promise<void> {
    // 先写数据库
    await writeToDB();
    
    // 再更新缓存
    await this.cache.set(key, value);
    
    // 广播失效事件
    this.eventBus.emit('cache:invalidate', {
      key,
      source: process.env.NODE_ID,
    });
  }
  
  // 读修复
  async readRepair<T>(
    key: string,
    readFromDB: () => Promise<T>
  ): Promise<T> {
    const cached = await this.cache.get(key);
    
    if (cached) {
      // 异步验证缓存一致性
      this.verifyConsistency(key, cached, readFromDB);
      return cached as T;
    }
    
    // 回源
    const value = await readFromDB();
    await this.cache.set(key, value);
    
    return value;
  }
  
  private async verifyConsistency<T>(
    key: string,
    cached: T,
    readFromDB: () => Promise<T>
  ): Promise<void> {
    try {
      const dbValue = await readFromDB();
      
      if (JSON.stringify(cached) !== JSON.stringify(dbValue)) {
        // 不一致，更新缓存
        await this.cache.set(key, dbValue);
      }
    } catch (error) {
      console.error('Read repair failed:', error);
    }
  }
  
  private async handleInvalidation(event: InvalidationEvent): Promise<void> {
    // 不处理自己发出的事件
    if (event.source === process.env.NODE_ID) return;
    
    // 清除本地缓存
    await this.cache.del(event.key);
  }
}
```

---

## 20.3 并发优化

### 20.3.1 连接池

```typescript
// /src/concurrency/connection-pool.ts

interface PooledConnection {
  id: string;
  connection: any;
  lastUsed: number;
  isActive: boolean;
}

class ConnectionPool {
  private pool: PooledConnection[] = [];
  private waiting: Array<(resolve: (conn: PooledConnection) => void)> = [];
  
  private minConnections = 5;
  private maxConnections = 20;
  private idleTimeout = 300000;  // 5分钟
  
  constructor(private factory: () => Promise<any>) {
    // 初始化最小连接数
    this.initialize();
    
    // 定期清理空闲连接
    setInterval(() => this.cleanup(), 60000);
  }
  
  private async initialize(): Promise<void> {
    for (let i = 0; i < this.minConnections; i++) {
      await this.createConnection();
    }
  }
  
  // 获取连接
  async acquire(): Promise<PooledConnection> {
    // 查找可用连接
    const available = this.pool.find(c => !c.isActive);
    
    if (available) {
      available.isActive = true;
      available.lastUsed = Date.now();
      return available;
    }
    
    // 创建新连接（如果未达到上限）
    if (this.pool.length < this.maxConnections) {
      return await this.createConnection();
    }
    
    // 等待可用连接
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }
  
  // 释放连接
  release(connection: PooledConnection): void {
    connection.isActive = false;
    connection.lastUsed = Date.now();
    
    // 唤醒等待者
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      connection.isActive = true;
      resolve(connection);
    }
  }
  
  private async createConnection(): Promise<PooledConnection> {
    const conn = await this.factory();
    
    const pooled: PooledConnection = {
      id: generateId(),
      connection: conn,
      lastUsed: Date.now(),
      isActive: true,
    };
    
    this.pool.push(pooled);
    
    return pooled;
  }
  
  private cleanup(): void {
    const now = Date.now();
    
    // 移除超时空闲连接
    this.pool = this.pool.filter((conn) => {
      if (!conn.isActive && now - conn.lastUsed > this.idleTimeout) {
        conn.connection.close?.();
        return false;
      }
      return true;
    });
    
    // 确保最小连接数
    while (this.pool.length < this.minConnections) {
      this.createConnection();
    }
  }
}
```

### 20.3.2 限流器

```typescript
// /src/concurrency/rate-limiter.ts

interface RateLimitConfig {
  windowMs: number;      // 时间窗口
  maxRequests: number;   // 最大请求数
  keyPrefix?: string;    // 键前缀
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  
  constructor(private config: RateLimitConfig) {}
  
  // 检查是否允许请求
  async allow(key: string): Promise<RateLimitResult> {
    const fullKey = `${this.config.keyPrefix || 'rl'}:${key}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let entry = this.store.get(fullKey);
    
    if (!entry) {
      entry = { requests: [], resetTime: now + this.config.windowMs };
      this.store.set(fullKey, entry);
    }
    
    // 清理过期请求
    entry.requests = entry.requests.filter(t => t > windowStart);
    
    // 检查是否超过限制
    if (entry.requests.length >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }
    
    // 记录请求
    entry.requests.push(now);
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.requests.length,
      resetTime: entry.resetTime,
    };
  }
  
  // 滑动窗口限流
  async allowSlidingWindow(key: string): Promise<RateLimitResult> {
    // 使用 Redis 实现分布式滑动窗口
    const redis = getRedisClient();
    const fullKey = `sliding:${key}`;
    
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // 使用 Redis 有序集合
    const pipeline = redis.pipeline();
    
    // 移除过期成员
    pipeline.zremrangebyscore(fullKey, 0, windowStart);
    
    // 获取当前计数
    pipeline.zcard(fullKey);
    
    // 添加当前请求
    pipeline.zadd(fullKey, now, `${now}-${Math.random()}`);
    
    // 设置过期
    pipeline.pexpire(fullKey, this.config.windowMs);
    
    const results = await pipeline.exec();
    const currentCount = results[1][1] as number;
    
    if (currentCount >= this.config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - currentCount - 1,
    };
  }
}

// 中间件
function rateLimitMiddleware(limiter: RateLimiter) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.user?.sub || 'anonymous';
    const result = await limiter.allow(key);
    
    // 设置响应头
    res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime);
    
    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    next();
  };
}
```

### 20.3.3 批处理

```typescript
// /src/concurrency/batcher.ts

class RequestBatcher<T, R> {
  private batch: Array<{ item: T; resolve: (result: R) => void }> = [];
  private timeout?: NodeJS.Timeout;
  
  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private options: {
      maxBatchSize: number;
      maxWaitMs: number;
    }
  ) {}
  
  async add(item: T): Promise<R> {
    return new Promise((resolve) => {
      this.batch.push({ item, resolve });
      
      // 达到批处理大小，立即处理
      if (this.batch.length >= this.options.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        // 设置超时
        this.timeout = setTimeout(() => this.flush(), this.options.maxWaitMs);
      }
    });
  }
  
  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    
    // 清除超时
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    
    // 取出当前批次
    const currentBatch = this.batch.splice(0, this.batch.length);
    const items = currentBatch.map(b => b.item);
    
    try {
      // 批量处理
      const results = await this.processor(items);
      
      // 分发结果
      currentBatch.forEach((b, i) => {
        b.resolve(results[i]);
      });
      
    } catch (error) {
      // 错误处理
      currentBatch.forEach((b) => {
        b.resolve(error as R);
      });
    }
  }
}

// 使用示例：批量嵌入
const embeddingBatcher = new RequestBatcher(
  async (texts: string[]) => {
    // 调用 OpenAI 批量嵌入 API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        input: texts,
        model: 'text-embedding-3-small',
      }),
    });
    
    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
  },
  { maxBatchSize: 100, maxWaitMs: 50 }
);

// 使用
const embedding = await embeddingBatcher.add('Hello world');
```

---

## 20.4 资源管理

### 20.4.1 内存管理

```typescript
// /src/resources/memory-manager.ts

class MemoryManager {
  private maxMemoryMB: number;
  private warningThreshold: number;
  
  constructor(maxMemoryMB: number = 1024) {
    this.maxMemoryMB = maxMemoryMB;
    this.warningThreshold = maxMemoryMB * 0.8;
    
    // 监控内存使用
    setInterval(() => this.checkMemory(), 30000);
  }
  
  private checkMemory(): void {
    const used = process.memoryUsage();
    const usedMB = used.heapUsed / 1024 / 1024;
    
    if (usedMB > this.maxMemoryMB) {
      console.error(`Memory limit exceeded: ${usedMB.toFixed(2)}MB`);
      this.emergencyCleanup();
    } else if (usedMB > this.warningThreshold) {
      console.warn(`Memory warning: ${usedMB.toFixed(2)}MB`);
      this.gentleCleanup();
    }
  }
  
  private gentleCleanup(): void {
    // 清理缓存
    global.gc?.();
    
    // 通知组件释放资源
    process.emit('memory:cleanup' as any);
  }
  
  private emergencyCleanup(): void {
    // 强制清理
    this.gentleCleanup();
    
    // 暂停非关键任务
    process.emit('memory:emergency' as any);
  }
  
  // 内存使用报告
  getMemoryReport(): MemoryReport {
    const usage = process.memoryUsage();
    
    return {
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      limit: this.maxMemoryMB,
      usage: usage.heapUsed / (this.maxMemoryMB * 1024 * 1024),
    };
  }
}
```

### 20.4.2 流控

```typescript
// /src/resources/backpressure.ts

class BackpressureController {
  private queueSize = 0;
  private maxQueueSize = 1000;
  private processing = 0;
  private maxConcurrency = 10;
  
  private paused = false;
  private resolvers: Array<() => void> = [];
  
  // 获取处理许可
  async acquire(): Promise<void> {
    // 检查队列大小
    if (this.queueSize >= this.maxQueueSize) {
      await this.waitForSpace();
    }
    
    // 检查并发数
    while (this.processing >= this.maxConcurrency) {
      await this.waitForSlot();
    }
    
    this.queueSize++;
    this.processing++;
  }
  
  // 释放许可
  release(): void {
    this.processing--;
    this.queueSize--;
    
    // 唤醒等待者
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve();
    }
  }
  
  private waitForSpace(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.queueSize < this.maxQueueSize) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
  
  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      this.resolvers.push(resolve);
    });
  }
}
```

---

## 本章小结

通过本章的学习，你应该掌握了：

1. **性能监控** - 指标收集、链路追踪、性能分析
2. **缓存策略** - 多级缓存、智能缓存、缓存一致性
3. **并发优化** - 连接池、限流器、批处理
4. **资源管理** - 内存管理、流控

---

*高级特性篇至此完成*
