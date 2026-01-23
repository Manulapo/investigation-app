import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
    const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
    const showInstallButton = ref(false)
    const isInstalled = ref(false)

    const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault()

        // Stash the event so it can be triggered later
        deferredPrompt.value = e as BeforeInstallPromptEvent

        // Show your custom install button
        showInstallButton.value = true
    }

    const handleAppInstalled = () => {
        // Hide the install button
        showInstallButton.value = false
        isInstalled.value = true
        deferredPrompt.value = null
    }

    const installPWA = async () => {
        if (!deferredPrompt.value) {
            return
        }

        // Show the install prompt
        await deferredPrompt.value.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.value.userChoice

        console.log(`User response to the install prompt: ${outcome}`)

        // Clear the deferredPrompt so it can only be used once
        deferredPrompt.value = null

        if (outcome === 'accepted') {
            showInstallButton.value = false
        }
    }

    onMounted(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            isInstalled.value = true
            showInstallButton.value = false
            return
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)
    })

    onUnmounted(() => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
    })

    return {
        showInstallButton,
        isInstalled,
        installPWA
    }
}
