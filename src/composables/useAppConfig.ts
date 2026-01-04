import { ref, reactive } from 'vue'

const appConfig = reactive({
  title: 'Vanity\'s Love',
  version: '1.0.0',
  lockCode: '50125'
})

export function useAppConfig() {
  return {
    config: appConfig
  }
}
