# 第 19 章：安全与权限

> 本章将深入解析 OpenClaw 的安全机制，包括认证、权限控制、数据安全和审计日志。

---

## 19.1 认证机制

### 19.1.1 API 密钥认证

```typescript
// /src/auth/api-key.ts

interface ApiKey {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}

class ApiKeyManager {
  private db: Database;
  private keyPrefix = 'oc_';
  
  // 生成新密钥
  async generateKey(
    name: string,
    permissions: string[]
  ): Promise<{ id: string; key: string }> {
    const id = generateId();
    const key = this.generateSecureKey();
    
    // 哈希存储
    const hashedKey = await bcrypt.hash(key, 10);
    
    await this.db.run(
      `INSERT INTO api_keys (id, key_hash, name, permissions, created_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, hashedKey, name, JSON.stringify(permissions), new Date(), true]
    );
    
    // 只返回一次完整密钥
    return {
      id,
      key: `${this.keyPrefix}${key}`,
    };
  }
  
  // 验证密钥
  async validateKey(key: string): Promise<ApiKey | null> {
    // 移除前缀
    const cleanKey = key.startsWith(this.keyPrefix)
      ? key.slice(this.keyPrefix.length)
      : key;
    
    // 查找所有活跃密钥
    const keys = await this.db.all(
      'SELECT * FROM api_keys WHERE is_active = true'
    );
    
    for (const record of keys) {
      const match = await bcrypt.compare(cleanKey, record.key_hash);
      
      if (match) {
        // 检查过期
        if (record.expires_at && new Date(record.expires_at) < new Date()) {
          return null;
        }
        
        // 更新最后使用时间
        await this.db.run(
          'UPDATE api_keys SET last_used_at = ? WHERE id = ?',
          [new Date(), record.id]
        );
        
        return {
          id: record.id,
          key: '',  // 不返回密钥
          name: record.name,
          permissions: JSON.parse(record.permissions),
          createdAt: new Date(record.created_at),
          expiresAt: record.expires_at ? new Date(record.expires_at) : undefined,
          lastUsedAt: new Date(),
          isActive: record.is_active,
        };
      }
    }
    
    return null;
  }
  
  // 撤销密钥
  async revokeKey(keyId: string): Promise<void> {
    await this.db.run(
      'UPDATE api_keys SET is_active = false WHERE id = ?',
      [keyId]
    );
  }
  
  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}

// 中间件
function apiKeyAuth(manager: ApiKeyManager) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-api-key'] as string;
    
    if (!key) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const apiKey = await manager.validateKey(key);
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // 附加到请求
    req.apiKey = apiKey;
    next();
  };
}
```

### 19.1.2 JWT 认证

```typescript
// /src/auth/jwt.ts

interface JwtPayload {
  sub: string;        // 用户 ID
  iss: string;        // 签发者
  iat: number;        // 签发时间
  exp: number;        // 过期时间
  permissions: string[];
}

class JwtManager {
  private secret: string;
  private expiresIn = '24h';
  
  constructor(secret: string) {
    this.secret = secret;
  }
  
  // 生成令牌
  generateToken(
    userId: string,
    permissions: string[]
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      iss: 'openclaw',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      permissions,
    };
    
    return jwt.sign(payload, this.secret);
  }
  
  // 验证令牌
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      throw new Error('Invalid token');
    }
  }
  
  // 刷新令牌
  refreshToken(token: string): string {
    const payload = this.verifyToken(token);
    
    // 生成新令牌
    return this.generateToken(payload.sub, payload.permissions);
  }
}

// 中间件
function jwtAuth(manager: JwtManager) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    try {
      const payload = manager.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ error: (error as Error).message });
    }
  };
}
```

### 19.1.3 OAuth 集成

```typescript
// /src/auth/oauth.ts

interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

class OAuthManager {
  private providers = new Map<string, OAuthProvider>();
  private redirectUri: string;
  
  constructor(redirectUri: string) {
    this.redirectUri = redirectUri;
  }
  
  // 注册提供商
  registerProvider(name: string, config: OAuthProvider): void {
    this.providers.set(name, config);
  }
  
  // 生成授权 URL
  getAuthorizeUrl(providerName: string, state: string): string {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    
    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: provider.scopes.join(' '),
      state,
    });
    
    return `${provider.authorizeUrl}?${params.toString()}`;
  }
  
  // 处理回调
  async handleCallback(
    providerName: string,
    code: string
  ): Promise<OAuthUser> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    
    // 交换令牌
    const tokenResponse = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    // 获取用户信息
    const userResponse = await fetch(provider.userInfoUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    
    const userData = await userResponse.json();
    
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar_url,
      provider: providerName,
      accessToken: tokenData.access_token,
    };
  }
}

// Discord OAuth 配置示例
const discordOAuth: OAuthProvider = {
  name: 'discord',
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  authorizeUrl: 'https://discord.com/oauth2/authorize',
  tokenUrl: 'https://discord.com/api/oauth2/token',
  userInfoUrl: 'https://discord.com/api/users/@me',
  scopes: ['identify', 'email'],
};
```

---

## 19.2 权限控制

### 19.2.1 RBAC 模型

```typescript
// /src/auth/rbac.ts

interface Role {
  id: string;
  name: string;
  permissions: string[];
  inherits?: string[];  // 继承其他角色
}

interface User {
  id: string;
  roles: string[];
  permissions: string[];  // 直接权限
}

class RBACManager {
  private roles = new Map<string, Role>();
  private users = new Map<string, User>();
  
  // 定义角色
  defineRole(role: Role): void {
    this.roles.set(role.id, role);
  }
  
  // 初始化默认角色
  initDefaultRoles(): void {
    this.defineRole({
      id: 'admin',
      name: 'Administrator',
      permissions: ['*'],  // 所有权限
    });
    
    this.defineRole({
      id: 'operator',
      name: 'Operator',
      permissions: [
        'agent:read',
        'agent:write',
        'message:send',
        'channel:read',
      ],
    });
    
    this.defineRole({
      id: 'viewer',
      name: 'Viewer',
      permissions: [
        'agent:read',
        'channel:read',
      ],
    });
  }
  
  // 检查权限
  hasPermission(userId: string, permission: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const allPermissions = this.getUserPermissions(user);
    
    // 检查具体权限
    if (allPermissions.includes(permission)) {
      return true;
    }
    
    // 检查通配符权限
    const parts = permission.split(':');
    for (let i = parts.length - 1; i >= 0; i--) {
      const wildcard = parts.slice(0, i).join(':') + ':*';
      if (allPermissions.includes(wildcard)) {
        return true;
      }
    }
    
    // 检查超级权限
    return allPermissions.includes('*');
  }
  
  // 获取用户的所有权限（包括继承）
  private getUserPermissions(user: User): string[] {
    const permissions = new Set(user.permissions);
    
    for (const roleId of user.roles) {
      const rolePermissions = this.getRolePermissions(roleId);
      rolePermissions.forEach(p => permissions.add(p));
    }
    
    return Array.from(permissions);
  }
  
  // 获取角色的所有权限（包括继承）
  private getRolePermissions(roleId: string): string[] {
    const role = this.roles.get(roleId);
    if (!role) return [];
    
    const permissions = new Set(role.permissions);
    
    // 递归获取继承的权限
    if (role.inherits) {
      for (const parentId of role.inherits) {
        const parentPermissions = this.getRolePermissions(parentId);
        parentPermissions.forEach(p => permissions.add(p));
      }
    }
    
    return Array.from(permissions);
  }
}

// 权限检查中间件
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rbac = req.app.get('rbac') as RBACManager;
    const userId = req.user?.sub;
    
    if (!userId || !rbac.hasPermission(userId, permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    next();
  };
}
```

### 19.2.2 资源级权限

```typescript
// /src/auth/resource-acl.ts

interface ResourceACL {
  resourceType: string;
  resourceId: string;
  owner: string;
  permissions: Array<{
    subject: string;  // 用户或角色
    actions: string[]; // read, write, delete, execute
  }>;
}

class ResourceACLManager {
  private db: Database;
  
  // 创建资源 ACL
  async createACL(
    resourceType: string,
    resourceId: string,
    owner: string
  ): Promise<void> {
    await this.db.run(
      `INSERT INTO resource_acl (resource_type, resource_id, owner, permissions)
       VALUES (?, ?, ?, ?)`,
      [resourceType, resourceId, owner, JSON.stringify([])]
    );
  }
  
  // 授权
  async grant(
    resourceType: string,
    resourceId: string,
    subject: string,
    actions: string[]
  ): Promise<void> {
    const acl = await this.getACL(resourceType, resourceId);
    
    // 查找或创建 subject 的权限
    let entry = acl.permissions.find(p => p.subject === subject);
    
    if (entry) {
      // 合并权限
      entry.actions = [...new Set([...entry.actions, ...actions])];
    } else {
      acl.permissions.push({ subject, actions });
    }
    
    await this.saveACL(acl);
  }
  
  // 撤销权限
  async revoke(
    resourceType: string,
    resourceId: string,
    subject: string,
    actions?: string[]
  ): Promise<void> {
    const acl = await this.getACL(resourceType, resourceId);
    
    const entryIndex = acl.permissions.findIndex(p => p.subject === subject);
    
    if (entryIndex === -1) return;
    
    if (actions) {
      // 撤销特定权限
      const entry = acl.permissions[entryIndex];
      entry.actions = entry.actions.filter(a => !actions.includes(a));
      
      if (entry.actions.length === 0) {
        acl.permissions.splice(entryIndex, 1);
      }
    } else {
      // 撤销所有权限
      acl.permissions.splice(entryIndex, 1);
    }
    
    await this.saveACL(acl);
  }
  
  // 检查权限
  async can(
    subject: string,
    action: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    const acl = await this.getACL(resourceType, resourceId);
    
    // 检查是否是所有者
    if (acl.owner === subject) {
      return true;
    }
    
    // 检查直接权限
    const entry = acl.permissions.find(p => p.subject === subject);
    if (entry?.actions.includes(action)) {
      return true;
    }
    
    // 检查角色权限
    const subjectRoles = await this.getSubjectRoles(subject);
    for (const role of subjectRoles) {
      const roleEntry = acl.permissions.find(p => p.subject === `role:${role}`);
      if (roleEntry?.actions.includes(action)) {
        return true;
      }
    }
    
    return false;
  }
}
```

---

## 19.3 数据安全

### 19.3.1 敏感数据加密

```typescript
// /src/security/encryption.ts

class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor(masterKey: string) {
    // 从主密钥派生加密密钥
    this.key = crypto.scryptSync(masterKey, 'salt', 32);
  }
  
  // 加密
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // 组合：iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  // 解密
  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // 哈希敏感字段
  hashField(value: string): string {
    return crypto.createHmac('sha256', this.key).update(value).digest('hex');
  }
}

// 使用示例
const encryption = new DataEncryption(process.env.MASTER_KEY!);

// 加密 API 密钥
const encryptedKey = encryption.encrypt('sk-abc123');

// 解密使用
const decryptedKey = encryption.decrypt(encryptedKey);
```

### 19.3.2 环境变量管理

```typescript
// /src/config/secrets.ts

class SecretsManager {
  private secrets = new Map<string, string>();
  private encryption: DataEncryption;
  
  constructor() {
    this.encryption = new DataEncryption(process.env.MASTER_KEY!);
    this.loadFromEnvironment();
  }
  
  private loadFromEnvironment(): void {
    // 从环境变量加载
    const prefix = 'OPENCLAW_SECRET_';
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const secretName = key.slice(prefix.length).toLowerCase();
        this.secrets.set(secretName, value!);
      }
    }
  }
  
  // 获取密钥
  get(name: string): string | undefined {
    return this.secrets.get(name);
  }
  
  // 设置密钥（加密存储）
  async set(name: string, value: string): Promise<void> {
    const encrypted = this.encryption.encrypt(value);
    
    // 存储到安全存储
    await this.saveToSecureStore(name, encrypted);
    
    this.secrets.set(name, value);
  }
  
  // 从文件加载密钥
  async loadFromFile(path: string): Promise<void> {
    const content = await readFile(path, 'utf-8');
    const secrets = JSON.parse(content);
    
    for (const [name, encryptedValue] of Object.entries(secrets)) {
      const decrypted = this.encryption.decrypt(encryptedValue as string);
      this.secrets.set(name, decrypted);
    }
  }
  
  // 保存到文件
  async saveToFile(path: string): Promise<void> {
    const secrets: Record<string, string> = {};
    
    for (const [name, value] of this.secrets) {
      secrets[name] = this.encryption.encrypt(value);
    }
    
    await writeFile(path, JSON.stringify(secrets, null, 2));
    
    // 设置文件权限（仅所有者可读写）
    await chmod(path, 0o600);
  }
}
```

### 19.3.3 输入验证

```typescript
// /src/security/validation.ts

import { z } from 'zod';

// 消息验证 schema
const messageSchema = z.object({
  content: z.string()
    .min(1)
    .max(4000)
    .refine(val => !this.containsDangerousContent(val), {
      message: 'Content contains dangerous patterns',
    }),
  channel: z.enum(['discord', 'telegram', 'slack']),
  to: z.string().min(1),
  replyTo: z.string().optional(),
});

// 配置验证 schema
const configSchema = z.object({
  gateway: z.object({
    port: z.number().int().min(1).max(65535),
    host: z.string().ip(),
  }),
  agents: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    model: z.string(),
  })),
});

class InputValidator {
  // 验证消息
  validateMessage(data: unknown): z.infer<typeof messageSchema> {
    return messageSchema.parse(data);
  }
  
  // 验证配置
  validateConfig(data: unknown): z.infer<typeof configSchema> {
    return configSchema.parse(data);
  }
  
  // 检查危险内容
  private containsDangerousContent(content: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /\{\{.*\}\}/,  // 模板注入
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(content));
  }
  
  // 净化 HTML
  sanitizeHtml(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
```

---

## 19.4 审计日志

### 19.4.1 审计事件

```typescript
// /src/audit/types.ts

interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actor: {
    type: 'user' | 'system' | 'api';
    id: string;
    ip?: string;
  };
  resource: {
    type: string;
    id: string;
  };
  action: string;
  result: 'success' | 'failure';
  details: Record<string, unknown>;
  metadata: {
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
  };
}

type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'api.key.created'
  | 'api.key.revoked'
  | 'message.sent'
  | 'message.received'
  | 'agent.executed'
  | 'config.changed'
  | 'permission.granted'
  | 'permission.revoked';
```

### 19.4.2 审计日志实现

```typescript
// /src/audit/logger.ts

class AuditLogger {
  private db: Database;
  private buffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  
  constructor() {
    // 定期刷新到数据库
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000);
  }
  
  // 记录事件
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const fullEvent: AuditEvent = {
      ...event,
      id: generateId(),
      timestamp: new Date(),
    };
    
    this.buffer.push(fullEvent);
    
    // 紧急事件立即写入
    if (event.severity === 'critical') {
      this.flush();
    }
    
    // 缓冲区满时写入
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }
  
  // 刷新到数据库
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const events = this.buffer.splice(0, this.buffer.length);
    
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (
        id, timestamp, type, severity, actor_type, actor_id,
        actor_ip, resource_type, resource_id, action, result,
        details, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = this.db.transaction((events: AuditEvent[]) => {
      for (const event of events) {
        stmt.run(
          event.id,
          event.timestamp.toISOString(),
          event.type,
          event.severity,
          event.actor.type,
          event.actor.id,
          event.actor.ip,
          event.resource.type,
          event.resource.id,
          event.action,
          event.result,
          JSON.stringify(event.details),
          JSON.stringify(event.metadata)
        );
      }
    });
    
    transaction(events);
  }
  
  // 查询审计日志
  async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params: unknown[] = [];
    
    if (filters.actorId) {
      sql += ' AND actor_id = ?';
      params.push(filters.actorId);
    }
    
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    
    if (filters.startTime) {
      sql += ' AND timestamp >= ?';
      params.push(filters.startTime.toISOString());
    }
    
    if (filters.endTime) {
      sql += ' AND timestamp <= ?';
      params.push(filters.endTime.toISOString());
    }
    
    sql += ' ORDER BY timestamp DESC';
    
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    return this.db.all(sql, params);
  }
  
  // 生成审计报告
  async generateReport(
    startTime: Date,
    endTime: Date
  ): Promise<AuditReport> {
    const events = await this.query({ startTime, endTime, limit: 10000 });
    
    return {
      period: { start: startTime, end: endTime },
      totalEvents: events.length,
      byType: this.groupBy(events, 'type'),
      bySeverity: this.groupBy(events, 'severity'),
      byActor: this.groupBy(events, e => e.actor.id),
      failedActions: events.filter(e => e.result === 'failure'),
    };
  }
  
  private groupBy<T>(
    array: T[],
    key: keyof T | ((item: T) => string)
  ): Record<string, number> {
    const getter = typeof key === 'function' ? key : (item: T) => String(item[key]);
    
    return array.reduce((acc, item) => {
      const group = getter(item);
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
```

### 19.4.3 审计中间件

```typescript
// /src/audit/middleware.ts

function auditMiddleware(logger: AuditLogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // 捕获响应
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      // 记录审计事件
      logger.log({
        type: `api.${req.method.toLowerCase()}`,
        severity: res.statusCode >= 400 ? 'warning' : 'info',
        actor: {
          type: req.user ? 'user' : 'api',
          id: req.user?.sub || req.apiKey?.id || 'anonymous',
          ip: req.ip,
        },
        resource: {
          type: 'endpoint',
          id: req.path,
        },
        action: req.method,
        result: res.statusCode < 400 ? 'success' : 'failure',
        details: {
          statusCode: res.statusCode,
          duration,
          query: req.query,
        },
        metadata: {
          userAgent: req.get('user-agent'),
          requestId: req.id,
        },
      });
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
}
```

---

## 本章小结

通过本章的学习，你应该掌握了：

1. **认证机制** - API 密钥、JWT、OAuth
2. **权限控制** - RBAC 模型、资源级权限
3. **数据安全** - 加密、环境变量、输入验证
4. **审计日志** - 事件记录、查询、报告

---

*下一章：第 20 章 性能优化*
