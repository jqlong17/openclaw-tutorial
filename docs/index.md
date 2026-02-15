---
layout: home

hero:
  name: ""
  text: ""
  tagline: ""
---

<div class="hero-container">
  <!-- 主视觉区域 -->
  <div class="hero-section">
    <div class="hero-badge">
      🚀 v2.0 正式发布
    </div>
    
    <h1 class="hero-title">
      构建
      <span class="gradient-text">多平台 AI Agent</span>
      <br/>
      从未如此简单
    </h1>
    
    <p class="hero-description">
      OpenClaw 是专为 AI Agent 设计的网关层框架。
      <br/>
      一套代码，同时接入 Discord、Telegram、飞书等平台。
      <br/>
      内置企业级特性，让 AI 应用从原型到生产只需一步。
    </p>
    
    <div class="hero-actions">
      <a href="/guide/chapter-02" class="btn btn-primary">
        <span class="btn-icon">🚀</span>
        10 分钟开始
      </a>
      <a href="https://github.com/openclaw/openclaw" class="btn btn-secondary" target="_blank">
        <span class="btn-icon">⭐</span>
        GitHub Star
      </a>
      <a href="/guide/" class="btn btn-ghost">
        浏览文档 →
      </a>
    </div>
  </div>

  <!-- 信任背书 -->
  <div class="trust-section">
    <p class="trust-label">适用于</p>
    <div class="trust-tags">
      <span class="trust-tag">👤 个人开发者</span>
      <span class="trust-tag">🏢 企业用户</span>
      <span class="trust-tag">🚀 创业公司</span>
      <span class="trust-tag">🏛️ 开源社区</span>
    </div>
  </div>

  <!-- 核心特性卡片 -->
  <div class="features-section">
    <h2 class="section-title">
      为什么选择
      <span class="highlight">OpenClaw</span>？
    </h2>
    
    <div class="features-grid">      <div class="feature-card featured">
        <div class="feature-icon">🎯</div>
        <h3>多平台统一接入</h3>
        <p>一套代码同时服务 Discord、Telegram、飞书、iMessage。用户从哪个平台来，体验完全一致。</p>
        <div class="feature-meta">支持 10+ 平台 →</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>AI Agent 框架</h3>
        <p>内置工具调用、记忆系统、多模态理解。让 AI 不仅能聊天，还能真正帮你完成任务。</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🏢</div>
        <h3>企业级就绪</h3>
        <p>网关层设计、多节点部署、安全权限、监控运维。从个人项目到企业级应用无缝扩展。</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">💰</div>
        <h3>成本可控</h3>
        <p>智能限流、模型降级、包月套餐支持。避免 AI 调用成本失控，适合大规模部署。</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🔌</div>
        <h3>生态丰富</h3>
        <p>官方支持 10+ 平台，社区贡献 50+ 工具插件。快速对接现有系统。</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📦</div>
        <h3>私有化部署</h3>
        <p>数据完全自主可控，支持本地部署、私有云、混合云。满足企业合规要求。</p>
      </div>
    </div>
  </div>

  <!-- 对比表格 -->
  <div class="comparison-section">
    <h2 class="section-title">与其他方案对比</h2>
    
    <div class="comparison-table-wrapper">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>特性</th>
            <th>ChatGPT</th>
            <th>OpenAI API</th>
            <th>Coze/扣子</th>
            <th class="highlight-col">OpenClaw</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>多平台接入</td>
            <td>❌ 仅网页</td>
            <td>❌ 需自建</td>
            <td>⚠️ 有限</td>
            <td class="highlight-col">✅ 全平台</td>
          </tr>
          <tr>
            <td>开发成本</td>
            <td>-</td>
            <td>高</td>
            <td>低</td>
            <td class="highlight-col">中</td>
          </tr>
          <tr>
            <td>自定义能力</td>
            <td>❌ 无</td>
            <td>✅ 完整</td>
            <td>⚠️ 受限</td>
            <td class="highlight-col">✅ 完整</td>
          </tr>
          <tr>
            <td>企业级特性</td>
            <td>❌ 无</td>
            <td>❌ 需自建</td>
            <td>⚠️ 部分</td>
            <td class="highlight-col">✅ 内置</td>
          </tr>
          <tr>
            <td>私有化部署</td>
            <td>❌ 不可</td>
            <td>✅ 可</td>
            <td>❌ 不可</td>
            <td class="highlight-col">✅ 支持</td>
          </tr>
          <tr>
            <td>数据可控</td>
            <td>❌ 不可</td>
            <td>✅ 可</td>
            <td>❌ 不可</td>
            <td class="highlight-col">✅ 完全可控</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <p class="comparison-summary">
      <strong>OpenClaw 的定位</strong>：
      比直接调用 API 更简单，比低代码平台更灵活，比通用网关更懂 AI。
    </p>
  </div>

  <!-- 架构图 -->
  <div class="architecture-section">
    <h2 class="section-title">架构设计</h2>
    
    <div class="architecture-diagram">
      <pre>┌─────────────────────────────────────────────────────────┐
│  用户接入层（Discord / Telegram / 飞书 / iMessage）        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  OpenClaw Gateway（网关层）                               │
│  ├─ 多平台统一接入                                        │
│  ├─ 智能路由 & 负载均衡                                    │
│  ├─ 限流熔断 & 安全防护                                    │
│  └─ 监控运维 & 日志追踪                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  AI Agent 运行时                                         │
│  ├─ 角色设定（SOUL.md）                                   │
│  ├─ 工具系统（Tools）                                     │
│  ├─ 记忆系统（Memory）                                    │
│  └─ 多模态理解（Vision/Audio）                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  基础设施层（LLM / 向量数据库 / 文件存储 / 外部 API）        │
└─────────────────────────────────────────────────────────┘</pre>
    </div>
    
    <p class="architecture-desc">
      网关层统一处理多平台接入，Agent 层专注 AI 能力，基础设施层提供底层支持。
      <br/>
      分层设计让系统更易扩展、更易维护。
    </p>
  </div>

  <!-- 统计数据 -->
  <div class="stats-section">
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-number">10+</div>
        <div class="stat-label">支持平台</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-number">50+</div>
        <div class="stat-label">社区插件</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-number">24</div>
        <div class="stat-label">教程章节</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-number">100%</div>
        <div class="stat-label">开源免费</div>
      </div>
    </div>
  </div>

  <!-- 快速开始 -->
  <div class="quickstart-section">
    <h2 class="section-title">5 分钟快速开始</h2>
    
    <div class="quickstart-content">
      <pre class="code-block"><code># 安装 CLI
npm install -g @openclaw/cli

# 创建项目
openclaw init my-agent && cd my-agent

# 配置模型（推荐 MiniMax 包月）
echo "MINIMAX_API_KEY=your-key" > .env

# 启动开发服务器
openclaw dev

# 现在可以在终端与 Agent 对话了！</code></pre>
    </div>
  </div>

  <!-- CTA -->
  <div class="cta-section">
    <h2>准备好开始了吗？</h2>
    <p>加入数千名开发者，用 OpenClaw 构建你的 AI Agent</p>
    
    <div class="cta-actions">
      <a href="/guide/chapter-01" class="btn btn-primary">
        阅读完整教程
      </a>
      <a href="https://discord.gg/clawd" class="btn btn-secondary" target="_blank">
        加入 Discord 社区
      </a>
    </div>
  </div>

</div>

<style>
.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero-section {
  text-align: center;
  padding: 60px 0 40px;
}

.hero-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  color: var(--vp-c-text-1);
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  max-width: 600px;
  margin: 0 auto 32px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 48px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.btn-ghost {
  color: var(--vp-c-text-2);
}

.trust-section {
  text-align: center;
  padding: 40px 0;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
}

.trust-label {
  font-size: 14px;
  color: var(--vp-c-text-3);
  margin-bottom: 16px;
}

.trust-tags {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.trust-tag {
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 20px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.features-section {
  padding: 80px 0;
}

.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 48px;
  color: var(--vp-c-text-1);
}

.highlight {
  color: #667eea;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.feature-card {
  padding: 32px;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.feature-card.featured {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-color: rgba(102, 126, 234, 0.3);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--vp-c-text-1);
}

.feature-card p {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin-bottom: 16px;
}

.feature-meta {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.comparison-section {
  padding: 80px 0;
  background: var(--vp-c-bg-soft);
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
}

.comparison-table-wrapper {
  overflow-x: auto;
  margin-bottom: 24px;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.comparison-table th,
.comparison-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

.comparison-table th {
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.comparison-table td {
  color: var(--vp-c-text-2);
}

.highlight-col {
  background: rgba(102, 126, 234, 0.05);
  font-weight: 500;
}

.comparison-summary {
  text-align: center;
  color: var(--vp-c-text-2);
}

.architecture-section {
  padding: 80px 0;
}

.architecture-diagram {
  max-width: 700px;
  margin: 0 auto 32px;
}

.architecture-diagram pre {
  background: var(--vp-c-bg-soft);
  padding: 24px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}

.architecture-desc {
  text-align: center;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.stats-section {
  padding: 60px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-number {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  opacity: 0.9;
}

.quickstart-section {
  padding: 80px 0;
}

.quickstart-content {
  max-width: 700px;
  margin: 0 auto;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 24px;
  border-radius: 12px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
}

.cta-section {
  text-align: center;
  padding: 80px 0;
  background: var(--vp-c-bg-soft);
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
}

.cta-section h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--vp-c-text-1);
}

.cta-section p {
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
}

.cta-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
