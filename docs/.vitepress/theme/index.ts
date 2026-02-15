import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h('div', { class: 'giscus-wrapper' }, [
        h('script', {
          src: 'https://giscus.app/client.js',
          'data-repo': 'jqlong17/openclaw-tutorial',
          'data-repo-id': 'R_kgDORQtucA',
          'data-category': 'General',
          'data-category-id': 'DIC_kwDORQtucM4C2fme',
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