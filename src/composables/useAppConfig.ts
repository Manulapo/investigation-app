import { ref, reactive } from 'vue'

const appConfig = reactive({
  title: 'Progetto Detective',
  version: '1.0.0',
  lockCode: '0000'
})

export function useAppConfig() {
  return {
    config: appConfig
  }
}
