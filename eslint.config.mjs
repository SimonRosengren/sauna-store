// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Project-specific rule overrides go here.
  {
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  }
)
