import { ref } from 'vue'
import phoneNumbers from '../data/phoneNumbers.json'

export type CallStatus = 'idle' | 'dialing' | 'rejected' | 'not-found'

export function usePhone() {
  const callStatus = ref<CallStatus>('idle')
  const dialedNumber = ref('')
  const contactName = ref('')

  function findContact(number: string) {
    return phoneNumbers.find(contact => contact.number === number)
  }

  async function makeCall(number: string) {
    dialedNumber.value = number
    callStatus.value = 'dialing'

    // Simulate dialing for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 4000))

    const contact = findContact(number)

    if (contact) {
      contactName.value = contact.name
      callStatus.value = 'rejected'
    } else {
      callStatus.value = 'not-found'
    }
  }

  function resetCall() {
    callStatus.value = 'idle'
    dialedNumber.value = ''
    contactName.value = ''
  }

  return {
    callStatus,
    dialedNumber,
    contactName,
    makeCall,
    resetCall,
    findContact
  }
}
