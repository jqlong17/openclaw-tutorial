import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h('div', { class: 'giscus-container' }, [
        h('script', {
          src: 'https://giscus.app/client.js',
          'data-repo': 'yourname/openclaw-tutorial',
          'data-repo-id': 'R_kgDOLxXxxxxx',
          'data-category': 'General',
          'data-category-id': 'DIC_kwDOLxxxxxx',
          'data-mapping': 'pathname',
          'data-strict': '0',
          'data-reactions-enabled': '1',
          'data-emit-metadata': '0',
          'data-input-position': 'bottom',
          'data-theme': 'preferred_color_scheme',
          'data-lang': 'zh-CN',
          'crossorigin': 'anonymous',
          async: true
        })
      ])
    })
  }
}