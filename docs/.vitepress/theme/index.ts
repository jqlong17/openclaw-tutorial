import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h('div', { class: 'giscus-wrapper' }, [
        h('div', { class: 'giscus' }),
        h('script', {
          src: 'https://giscus.app/client.js',
          'data-repo': 'jqlong17/openclaw-tutorial',
          'data-repo-id': 'R_kgDOOG某某某某',
          'data-category': 'Comments',
          'data-category-id': 'DIC_kwDOOG某某某某',
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