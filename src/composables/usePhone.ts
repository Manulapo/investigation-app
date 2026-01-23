import { ref } from 'vue'
import registry from '../data/registry.json'
import { useGameStore } from '../stores/gameStore'
import type { Contact } from '../types'

export type CallStatus = 'idle' | 'dialing' | 'accepted' | 'rejected' | 'not-found'

export function usePhone() {
  const gameStore = useGameStore()

  const callStatus = ref<CallStatus>('idle')
  const dialedNumber = ref('')
  const contactName = ref('')
  const acceptedContactId = ref<string | null>(null)

  function findContactByPhone(number: string): Contact | undefined {
    return registry.find((contact: Contact) => contact.phoneNumber === number)
  }

  async function makeCall(number: string) {
    dialedNumber.value = number
    callStatus.value = 'dialing'

    // Simulate dialing for 4 seconds
    await new Promise(resolve => setTimeout(resolve, 4000))

    const contact = findContactByPhone(number)

    if (!contact) {
      // Number doesn't exist in registry
      callStatus.value = 'not-found'
      return
    }

    // Check if the contact is available (turn requirement met)
    if (gameStore.currentGlobalTurn >= contact.visibleAtTurn) {
      // Call accepted - contact is available
      contactName.value = contact.name
      acceptedContactId.value = contact.id
      callStatus.value = 'accepted'

      // Unlock the contact by phone call
      gameStore.unlockContactByPhone(contact.id)
    } else {
      // Call rejected - turn requirement not met
      contactName.value = contact.name
      callStatus.value = 'rejected'
    }
  }

  function resetCall() {
    callStatus.value = 'idle'
    dialedNumber.value = ''
    contactName.value = ''
    acceptedContactId.value = null
  }

  return {
    callStatus,
    dialedNumber,
    contactName,
    acceptedContactId,
    makeCall,
    resetCall,
    findContactByPhone
  }
}
