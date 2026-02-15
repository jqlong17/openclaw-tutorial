import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OpenClaw 学习教程',
  description: '从入门到企业级的 OpenClaw 完整学习指南',
  lang: 'zh-CN',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c3c3c' }],
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '教程', link: '/guide/chapter-01' },
    ],
    
    sidebar: [
      {
        text: '基础入门',
        collapsed: false,
        items: [
          { text: '第1章：OpenClaw概览', link: '/guide/chapter-01' },
          { text: '第2章：环境搭建与安装', link: '/guide/chapter-02' },
          { text: '第3章：第一个Agent', link: '/guide/chapter-03' },
        ]
      },
      {
        text: '核心概念',
        collapsed: false,
        items: [
          { text: '第4章：消息传输流程', link: '/guide/chapter-04' },
          { text: '第5章：网关架构', link: '/guide/chapter-05' },
          { text: '第6章：通道抽象层', link: '/guide/chapter-06' },
        ]
      },
      {
        text: '平台集成',
        collapsed: false,
        items: [
          { text: '第7章：Discord集成', link: '/guide/chapter-07' },
          { text: '第8章：Discord高级功能', link: '/guide/chapter-08' },
          { text: '第9章：Telegram集成', link: '/guide/chapter-09' },
          { text: '第10章：飞书集成', link: '/guide/chapter-10' },
          { text: '第11章：iMessage集成', link: '/guide/chapter-11' },
        ]
      },
      {
        text: 'AI Agent',
        collapsed: false,
        items: [
          { text: '第12章：Agent运行器', link: '/agent/chapter-12' },
          { text: '第13章：工具系统', link: '/agent/chapter-13' },
          { text: '第14章：记忆系统（RAG）', link: '/agent/chapter-14' },
          { text: '第15章：媒体理解', link: '/agent/chapter-15' },
        ]
      },
      {
        text: '高级特性',
        collapsed: false,
        items: [
          { text: '第16章：定时任务系统', link: '/advanced/chapter-16' },
          { text: '第17章：插件系统', link: '/advanced/chapter-17' },
          { text: '第18章：多节点部署', link: '/advanced/chapter-18' },
          { text: '第19章：安全与权限', link: '/advanced/chapter-19' },
          { text: '第20章：性能优化', link: '/advanced/chapter-20' },
        ]
      },
      {
        text: '实践项目',
        collapsed: false,
        items: [
          { text: '第21章：入门项目', link: '/projects/chapter-21' },
          { text: '第22章：进阶级项目', link: '/projects/chapter-22' },
          { text: '第23章：高级项目', link: '/projects/chapter-23' },
          { text: '第24章：企业智能中台', link: '/projects/chapter-24' },
        ]
      },
    ],
    
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 OpenClaw Tutorial'
    },
    
    editLink: {
      pattern: 'https://github.com/jqlong17/openclaw-tutorial/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/openclaw/openclaw' },
    ],
    
    outline: {
      label: '页面导航'
    },
    
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
  
  markdown: {
    lineNumbers: true,
  },
  
  base: '/',
  cleanUrls: true,
  lastUpdated: true,
})