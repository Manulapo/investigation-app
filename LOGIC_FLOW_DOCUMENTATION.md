# Investigation App - Complete Logic Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [Stores Architecture](#stores-architecture)
3. [Composables Architecture](#composables-architecture)
4. [Execution Flows](#execution-flows)
5. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overview

This application is an interactive investigation game where users solve puzzles through chat conversations with contacts. The game uses a turn-based progression system where solving puzzles unlocks new content and contacts.

### Core Concepts
- **Turns**: The game progresses in turns (1, 2, 3, etc.). Each turn unlocks new content
- **Puzzles**: Each contact may have puzzles that must be solved to progress
- **Narratives**: Story messages that appear at specific turns or after specific events
- **Documents**: Evidence/media that gets unlocked throughout the game
- **Contacts**: NPCs that can be unlocked via turns or phone calls

---

## Stores Architecture

### 1. GameStore (`gameStore.ts`)
**Purpose**: Manages global game state, turn progression, puzzle validation, and phone system.

#### State
```typescript
- currentGlobalTurn: number             // Current turn (level) in the game
- puzzleStatus: Record<string, PuzzleStatus>  // Status of each puzzle
- phoneUnlockedContacts: string[]       // Contacts unlocked via phone calls
- totalHintsUsed: number                // Total hints used across all puzzles
- usedHintsPerPuzzle: Record<string, number>  // Hints used per puzzle
- shownNarratives: Record<string, boolean>    // Track shown narrative messages
- callStatus: 'idle' | 'dialing' | 'accepted' | 'rejected' | 'not-found'
- dialedNumber: string
- contactName: string
- acceptedContactId: string | null
```

#### Key Actions
**Game State:**
- `advanceTurn(next)`: Advances to the next turn if higher than current
- `incrementFailed(key)`: Increments failed attempts for a puzzle
- `setLockUntil(key, untilTs)`: Locks a puzzle until timestamp
- `setPreQuestionShown(key)`: Marks pre-question as shown
- `unlockContactByPhone(contactId)`: Unlocks a contact via phone
- `useHint(puzzleKey)`: Records hint usage
- `setNarrativeShown(narrativeId)`: Marks narrative as displayed
- `resetAll()`: Resets entire game state

**Puzzle Validation (Game Engine):**
- `validateAnswer(contactId, input)`: Validates user's puzzle answer, returns result object
- `findContactFile(id)`: Finds contact data by ID
- `findTriggeredNarratives(contact, triggerMessageId)`: Finds narratives triggered by success

**Phone System:**
- `makePhoneCall(number)`: Initiates phone call to unlock contact
- `resetCall()`: Resets phone call state
- `findContactByPhone(number)`: Finds contact by phone number

#### Persistence
Persisted to localStorage with key `game-store`.

---

### 2. ChatStore (`chatStore.ts`)
**Purpose**: Manages all chat messages, conversation state, and message scheduling/sequencing.

#### State
```typescript
- chatHistories: Record<string, ContactHistory>  // All messages per contact
- hasNotification: Record<string, boolean>       // Notification flags
- delayedMessages: Map<string, any>              // Pending scheduled messages
- typingIndicators: Record<string, boolean>      // Typing status per contact
- messageSending: Record<string, boolean>        // Message sending status
```

#### Key Actions
**Basic Message Management:**
- `addMessage(contactId, msg)`: Adds a message to chat history
- `addDelayedMessage(contactId, messageData, delaySeconds)`: Schedules a delayed message
- `markMessagesAsRead(contactId)`: Marks all messages as read
- `setTyping(contactId, typing)`: Sets typing indicator
- `setMessageSending(contactId, sending)`: Sets message sending status
- `clearDelayedMessages(contactId?)`: Cancels pending messages
- `resetChatHistories()`: Clears all chat data

**Advanced Message Scheduling:**
- `queuePuzzleResponse(contactId, result)`: Queues all puzzle response messages in order (text, media, evidence, narratives)
- `loadContactMessages(contactId)`: Loads initial messages, narratives, and pre-questions when chat opens
- `handleTurnTransition(contactId, newTurn, isMessageSending)`: Schedules narratives for turn changes
- `scheduleTriggeredNarratives(triggerId)`: Schedules cross-contact triggered narratives

#### Persistence
Only `chatHistories` and `hasNotification` are persisted to localStorage.

---

### 3. NarrativeStore (`narrativeStore.ts`)
**Purpose**: Central hub for accessing contact narrative data and timeline events.

#### Key Getters (Computed)
- `findContactFile(id)`: Returns contact data from contactDataMap
- `getNarrativeMessagesForTurnStart(contactId, turnId)`: Gets narrative messages for a specific turn
- `getPuzzleForTurn(contactId, turnId)`: Returns puzzle event for a specific turn
- `getCurrentTurnForContact(contactId)`: Calculates current turn for a contact
- `checkTriggeredNarratives(contactId)`: Finds narratives triggered by completed events

#### No Persistence
This store only computes data from static JSON files and other stores.

---

### 4. UIStore (`uiStore.ts`)
**Purpose**: Manages UI-only state (notifications and image viewer).

#### State
```typescript
- toasts: Toast[]                       // Active toast notifications
- fullscreenMedia: any | null           // Currently viewed media in fullscreen
- zoomLevel: number                     // Image zoom level (1-4)
- position: { x: number, y: number }    // Pan position for zoomed images
- isDragging: boolean                   // Drag state for image panning
```

#### Key Actions
**Toast Notifications:**
- `showNotification(text, contactId?, ttl)`: Shows a toast notification
- `removeToast(id)`: Removes a specific toast
- `clearAllToasts()`: Clears all toasts

**Image Viewer:**
- `openFullscreen(media)`: Opens media in fullscreen mode
- `closeFullscreen()`: Closes fullscreen viewer
- `zoomIn()`, `zoomOut()`, `resetZoom()`: Zoom controls
- `startDrag(e)`, `onDrag(e)`, `stopDrag()`: Pan controls
- `setupDragListeners()`, `removeDragListeners()`: Event listener management

#### Persistence
Not persisted - pure UI state.

---

### 5. DocumentsStore (`documentsStore.ts`)
**Purpose**: Manages unlocked documents/evidence.

#### State
```typescript
- unlockedDocumentIds: string[]  // IDs of unlocked documents
```

#### Key Actions
- `unlockDocument(id)`: Unlocks a single document
- `unlockDocuments(ids)`: Unlocks multiple documents
- `getDocumentById(id)`: Retrieves document by ID
- `findMediaArray(mediaIds)`: Converts media IDs to media objects
- `initializeDocuments()`: Sets up initial documents

#### Persistence
Only `unlockedDocumentIds` persisted to localStorage.

---

## Composables Architecture

**IMPORTANT**: Most composables have been consolidated into stores for better clarity and single source of truth.

### Eliminated Composables (Now in Stores):
- ❌ **useGameEngine** → `gameStore.validateAnswer()`
- ❌ **useMessageQueue** → `chatStore.queuePuzzleResponse()`
- ❌ **useContactLoader** → `chatStore.loadContactMessages()`
- ❌ **useTurnTransition** → `chatStore.handleTurnTransition()`
- ❌ **useTriggeredNarratives** → `chatStore.scheduleTriggeredNarratives()`
- ❌ **usePhone** → `gameStore.makePhoneCall()`
- ❌ **useNotification** → `uiStore.showNotification()`
- ❌ **useImageViewer** → `uiStore` (openFullscreen, zoomIn, etc.)
- ❌ **useMessageScheduler** → Integrated into `chatStore` methods

### Remaining Composables:

### 1. ~~useGameEngine~~ → **NOW IN GAMESTORE**
~~**Purpose**: Core puzzle validation and game logic engine.~~

**MOVED TO**: `gameStore.validateAnswer(contactId, input)`

See GameStore documentation above for puzzle validation logic (previously in useGameEngine).

### 2. ~~useMessageQueue~~ → **NOW IN CHATSTORE**
**MOVED TO**: `chatStore.queuePuzzleResponse(contactId, result)`

See ChatStore documentation for message sequencing logic.

### 3. ~~useContactLoader~~ → **NOW IN CHATSTORE**
**MOVED TO**: `chatStore.loadContactMessages(contactId)`

See ChatStore documentation for contact loading logic.

### 4. ~~useTriggeredNarratives~~ → **NOW IN CHATSTORE**
**MOVED TO**: `chatStore.scheduleTriggeredNarratives(triggerId)`

See ChatStore documentation for triggered narrative logic.

### 5. ~~useTurnTransition~~ → **NOW IN CHATSTORE**
**MOVED TO**: `chatStore.handleTurnTransition(contactId, newTurn, isMessageSending)`

See ChatStore documentation for turn transition logic.

### 6. ~~usePhone~~ → **NOW IN GAMESTORE**
**MOVED TO**: `gameStore.makePhoneCall(number)`, `gameStore.resetCall()`, etc.

See GameStore documentation for phone call logic.

### 7. ~~useNotification~~ → **NOW IN UISTORE**
**MOVED TO**: `uiStore.showNotification(text, contactId?, ttl)`

See UIStore documentation for notification logic.

### 8. ~~useImageViewer~~ → **NOW IN UISTORE**
**MOVED TO**: `uiStore.openFullscreen()`, `uiStore.zoomIn()`, etc.

See UIStore documentation for image viewer logic.

---

## Execution Flows

### Flow 1: App Initialization

```
1. App Starts (main.ts)
   └─> Pinia stores initialized (persisted state restored from localStorage)

2. Router navigates based on lock state
   └─> If chat_locked === 'true'
       └─> Navigate to /lock (LockScreen.vue)
   └─> Else
       └─> Navigate to / (ChatList.vue)

3. ChatList.vue onMounted
   ├─> documentsStore.initializeDocuments()
   │   └─> Unlocks all documents with initial: true
   │
   └─> ensureInitialMessages()
       ├─> For each visible contact (where visibleAtTurn <= currentGlobalTurn):
       │   ├─> Check if messages.length === 0
       │   └─> If new:
       │       └─> Add ONLY initialMessage from contact data
       │           (Note: Pre-questions and narratives are handled by useContactLoader)
       │
       └─> Contacts displayed sorted by last message timestamp
```

---

### Flow 2: Opening a Chat

```
1. User clicks contact in ChatList
   └─> Router navigates to /chat/:id

2. ChatRoom.vue Setup
   ├─> contactId = computed from route params
   ├─> contact = computed from registry
   ├─> messages = computed from chatStore
   └─> currentTurn = computed from narrativeStore.getCurrentTurnForContact()

3. Watch contactId (immediate: true) triggers loadContactData()

4. useContactLoader.loadMessagesInOrder() executes:

   A. Determine State
      ├─> hasUserMessages = messages.some(msg => msg.sender === 'user')
      ├─> isNewChat = !hasUserMessages  // true if no user messages yet
      ├─> currentTurn = narrativeStore.getCurrentTurnForContact(contactId)
      └─> DELAY_INCREMENT = isNewChat ? 4000ms : 2000ms

   B. Load Initial Message (delay: 0ms - immediately)
      ├─> Check if msg_initial_{contactId} exists in messages
      ├─> If not exists and not shown:
      │   ├─> chatStore.addMessage() - adds immediately
      │   └─> gameStore.setNarrativeShown('initial_{contactId}')
      └─> delay += DELAY_INCREMENT (now 4s or 2s)

   C. Load Narrative Messages (with delays)
      ├─> narrativeStore.getNarrativeMessagesForTurnStart(contactId, currentTurn)
      │   └─> Filters: type === 'narrative' && turnId === currentTurn && triggerAfter === null
      ├─> For each narrative message:
      │   ├─> Check if narrative_initial_{currentTurn}_{index} not shown
      │   ├─> setTimeout(() => addMessage(), delay)
      │   ├─> gameStore.setNarrativeShown(narrativeId)
      │   └─> delay += DELAY_INCREMENT
      └─> For each narrative media:
          ├─> documentsStore.unlockDocuments(mediaIds)
          ├─> setTimeout(() => addMessage(media), delay)
          └─> delay += DELAY_INCREMENT

   D. Load Triggered Narratives (with delays)
      ├─> narrativeStore.checkTriggeredNarratives(contactId)
      │   └─> Finds narratives where triggerAfter message exists in ANY contact's history
      ├─> For each triggered event:
      │   ├─> For each message:
      │   │   ├─> Check if narrative_triggered_{eventId}_{index} not shown
      │   │   ├─> setTimeout(() => addMessage(), delay)
      │   │   └─> delay += DELAY_INCREMENT
      │   └─> For each media:
      │       ├─> documentsStore.unlockDocuments(mediaIds)
      │       ├─> setTimeout(() => addMessage(media), delay)
      │       └─> delay += DELAY_INCREMENT

   E. Load Pre-Question (with delay)
      ├─> narrativeStore.getPuzzleForTurn(contactId, currentTurn)
      ├─> puzzleKey = `${contactId}_${currentTurn}`
      ├─> If puzzle exists and preQuestion not shown:
      │   ├─> gameStore.setPreQuestionShown(puzzleKey, true)
      │   ├─> setTimeout(() => addMessage(preQuestion), delay)
      │   └─> delay += DELAY_INCREMENT

   F. Manage Typing Indicator
      ├─> If delay > 0:
      │   ├─> chatStore.setTyping(contactId, true)
      │   └─> setTimeout(() => setTyping(false), delay)
      └─> Return contactData

5. Messages appear in order with proper delays
   └─> User sees: Initial → Narratives → Media → Triggered → Pre-question
```

**Key Difference from Old Flow**:
- Single unified function `loadMessagesInOrder()` handles all message scheduling
- No separate scheduler composable - delay logic is inline
- Explicit order: Initial (0s) → Narratives (4s/2s each) → Triggered → PreQuestion
- ChatList only adds initial message for preview, not pre-questions

---

### Flow 3: Answering a Puzzle

```
1. User types answer and presses send (e.g., "T5: dissanguamento")
   └─> ChatRoom.handleSendMessage(userMsg) called

2. Add User Message
   ├─> messageQueue.addUserMessage(userMsg)
   │   └─> chatStore.addMessage(contactId, {sender: 'user', content: userMsg})
   └─> Set isMessageSending = true, isTyping = true

3. Wait 1.5 seconds (simulated processing delay)

4. Parse and Validate Input
   └─> useGameEngine.parseInput(contactId, userMsg)
       ├─> Extract turn number and answer using regex
       ├─> Find puzzle for that turn
       ├─> Check if locked (cooldown active)
       ├─> Validate answer against keywords
       └─> Return result object

5. Add Main Response
   └─> messageQueue.addMainResponse(result)
       ├─> chatStore.addMessage(contactId, {content: result.text, sender: 'contact'})
       └─> Start delay counter at 2 seconds

6. Queue Puzzle Response Messages (in order)
   └─> messageQueue.queuePuzzleResponseMessages(result)
       Queues in this exact order with 2s delays:
       1. Additional textMessages (if any)
       2. Success media OR mediaId
       3. evidenceText
       4. evidenceTextMessages
       5. narrativeMessages
       6. narrativeMedia

7. Calculate Total Delay and Hide Typing Indicator
   ├─> totalDelay = messageQueue.calculateTotalDelay(result)
   └─> setTimeout(() => isTyping = false, totalDelay)

8. Handle Success or Failure

   A. If Success:
      ├─> messageQueue.handleSuccessActions(result, totalDelay)
      │   └─> After all messages sent, show notification if any
      ├─> isMessageSending = false
      └─> After (totalDelay + 1s):
          └─> useTriggeredNarratives.checkAndScheduleTriggeredNarratives(result.messageId)
              For each contact:
              ├─> Find events where triggerAfter === result.messageId
              ├─> Check if contact has user messages (is opened)
              ├─> If opened: Schedule triggered narratives with 2s delays
              └─> If not opened: Skip (will be handled by loadMessagesInOrder)

   B. If Failure:
      ├─> messageQueue.handleFailureActions(result)
      │   └─> If locked, show cooldown notification
      └─> isMessageSending = false

9. Scroll to bottom
```

**Message Order for Successful Puzzle Response**:
```
1. Main response.text (immediately)
2. [After 2s] Additional text messages
3. [After 2s] Media documents
4. [After 2s] Evidence text
5. [After 2s] Evidence messages
6. [After 2s] Narrative messages
7. [After 2s] Narrative media
8. [After 1s] Notification shown (if any)
9. [After 1s] Triggered narratives in other contacts (if any, only if those contacts are opened)
```
      │   └─> Analyzes message history to find highest completed turn
      │   └─> Returns max(globalTurn, nextTurn)
      └─> contactData = narrativeStore.findContactFile(contactId)

   B. Check if Typing Indicator Needed
      ├─> narrativeData = getNarrativeMessagesForTurnStart(contactId, currentTurn)
      ├─> triggeredData = checkTriggeredNarratives(contactId)
      └─> If narratives exist: chatStore.setTyping(contactId, true)

   C. Load Initial Message (isNewChat = true)
      ├─> scheduler.scheduleMessage()
      │   ├─> Check: !gameStore.isNarrativeShown(`initial_${contactId}`)
      │   ├─> If not shown:
      │   │   ├─> chatStore.addDelayedMessage(contactId, messageData, delay)
      │   │   │   └─> Schedules message with setTimeout(delay * 1000)
      │   │   └─> gameStore.setNarrativeShown(`initial_${contactId}`, true)
      │   └─> scheduler.incrementDelay(true)  // delay += 2s
      └─> Message appears after delay

   D. Load Turn Narratives
      ├─> narrativeData = getNarrativeMessagesForTurnStart(contactId, currentTurn)
      │   └─> Filters timeline for: type === 'narrative' && turnId === currentTurn && triggerAfter === null
      │
      └─> For each narrative message:
          ├─> scheduler.scheduleTextMessages(narrativeData.messages, 'narrative_initial', currentTurn, true)
          │   ├─> For each message:
          │   │   ├─> Check: !gameStore.isNarrativeShown(`narrative_initial_${currentTurn}_${index}`)
          │   │   ├─> Schedule with current delay
          │   │   ├─> Mark as shown
          │   │   └─> Increment delay by 2s
          │   └─> Messages appear one by one with 2s between
          │
          └─> scheduler.scheduleMediaMessages(narrativeData.mediaIds, 'narrative_initial', currentTurn, true)
              ├─> documentsStore.unlockDocuments(mediaIds)
              └─> Schedule each media with delays

   E. Load Triggered Narratives
      ├─> triggeredData = narrativeStore.checkTriggeredNarratives(contactId)
      │   └─> Searches all timeline events where:
      │       └─> type === 'narrative' && triggerAfter exists in any chat history
      │
      └─> If triggered narratives found:
          └─> Schedule with prefix `narrative_triggered_{eventId}`

   F. Load PreQuestion
      ├─> Find first puzzle in timeline (for new chat)
      ├─> Check: !gameStore.isPreQuestionShown(puzzleKey)
      └─> If not shown:
          ├─> Mark as shown immediately: gameStore.setPreQuestionShown(puzzleKey, true)
          ├─> Schedule message with setTimeout
          └─> Increment delay

   G. Hide Typing Indicator
      ├─> totalDelay = scheduler.getTotalDelayMs(true)
      └─> setTimeout(() => chatStore.setTyping(contactId, false), totalDelay)

5. Messages Appear Sequentially
   └─> Each delayed message appears at its scheduled time
   └─> chatStore.addMessage() called for each
   └─> Watch on messages.length triggers scrollToBottom()
```

---

### Flow 3: Opening a Chat (Existing)

```
1. User clicks contact with existing messages

2. ChatRoom.vue Setup (same as Flow 2)

3. useContactLoader.loadContactData() executes:

   A. Determine State
      ├─> isNewChat = false (messages exist)
      └─> currentTurn = narrativeStore.getCurrentTurnForContact(contactId)

   B. Skip Initial Message (already exists)
      
   C. Account for Existing Initial Message
      └─> scheduler.incrementDelay(false)  // Adjust delay counter

   D. Load Turn Narratives (same as Flow 2)
      └─> Check gameStore.isNarrativeShown() prevents duplicates

   E. Load Triggered Narratives (same as Flow 2)
      └─> Check gameStore.isNarrativeShown() prevents duplicates

   F. Load PreQuestion
      ├─> Uses currentTurn (not first puzzle)
      └─> Checks gameStore.isPreQuestionShown() prevents duplicates

   G. Hide Typing Indicator (same as Flow 2)

4. Only New Narratives Appear
   └─> Already shown narratives are skipped
   └─> Existing messages displayed immediately from chatStore
```

---

### Flow 4: Solving a Puzzle

```
1. User Types Answer
   └─> Example: "T1: Blue Eagle"
   └─> User presses Send in ChatInput

2. ChatRoom.handleSendMessage(userMsg) executes:

   A. Add User Message
      ├─> messageQueue.addUserMessage(userMsg)
      │   └─> chatStore.addMessage(contactId, {
      │         id: `msg_user_${Date.now()}`,
      │         content: userMsg,
      │         sender: 'user',
      │         timestamp: Date.now()
      │       })
      └─> isMessageSending.value = true
      └─> isTyping.value = true

   B. Wait 1.5 Seconds (simulated thinking)
      └─> await new Promise(resolve => setTimeout(resolve, 1500))

   C. Parse Input with useGameEngine
      ├─> result = parseInput(contactId, userMsg)
      │
      └─> useGameEngine.parseInput() Process:
          
          1. Parse Input Format
             ├─> Match against regex: ^T(\d+):\s*(.+)$
             ├─> Extract: turnId and answer text
             └─> If invalid format: return { status: 'invalid' }

          2. Find Puzzle Event
             ├─> contact = findContactFile(contactId)
             ├─> puzzleEvent = timeline.find(event => 
             │     event.type === 'puzzle' && event.turnId === turnId)
             └─> If not found: return { status: 'error' }

          3. Check PreQuestion
             ├─> key = `${contactId}_${turnId}`
             ├─> If puzzleEvent.preQuestion && !gameStore.isPreQuestionShown(key):
             │   ├─> gameStore.setPreQuestionShown(key, true)
             │   └─> return { status: 'prequestion', text: puzzleEvent.preQuestion }
             └─> (PreQuestion shown, user must try again)

          4. Check Lock Status
             ├─> If gameStore.isLocked(key):
             │   ├─> Select random penalty message
             │   └─> return { status: 'locked', text: penaltyText }
             └─> (Puzzle locked due to too many failures)

          5. Tokenize Answer
             └─> words = answer.toLowerCase().split(/\W+/).filter(Boolean)

          6. Check Solution
             ├─> solKeys = puzzleEvent.solution.keywords.map(k => k.toLowerCase())
             ├─> solved = solKeys.every(k => words.includes(k))
             │
             └─> If solved:
                 ├─> gameStore.advanceTurn(response.nextTurn || turnId + 1)
                 │   └─> currentGlobalTurn = max(currentGlobalTurn, nextTurn)
                 │
                 ├─> gameStore.resetFailed(key)
                 │
                 ├─> Find triggered narratives
                 │   └─> narrativeData = findTriggeredNarratives(contact, response.messageId)
                 │       └─> Filters timeline for: type === 'narrative' && triggerAfter === messageId
                 │
                 └─> return {
                       status: 'success',
                       text: response.text[0],
                       textMessages: response.text.slice(1),
                       mediaId: response.mediaId,
                       evidenceText: response.evidenceText[0],
                       evidenceTextMessages: response.evidenceText.slice(1),
                       messageId: response.messageId,
                       successMedia: response.successMedia,
                       notificationContact: puzzleEvent.notification?.notificationContact,
                       notificationMessage: puzzleEvent.notification?.notificationMessage,
                       narrativeMessages: narrativeData.messages,
                       narrativeMediaIds: narrativeData.mediaIds
                     }

          7. Handle Failure (if not solved)
             ├─> attempts = gameStore.incrementFailed(key)
             ├─> fallbackText = random(puzzleEvent.fallbacks)
             │
             ├─> If attempts >= maxAttempts:
             │   ├─> until = Date.now() + (penaltySeconds * 1000)
             │   ├─> gameStore.setLockUntil(key, until)
             │   ├─> lockMsg = random(penaltyResponses)
             │   └─> return { status: 'locked', text: lockMsg }
             │
             └─> return { status: 'fail', text: fallbackText }

   D. Queue Response Messages (using useMessageQueue)
      
      1. Add Main Response
         ├─> messageQueue.addMainResponse(result)
         │   └─> chatStore.addMessage(contactId, {
         │         id: result.messageId || `msg_auto_${Date.now()}`,
         │         content: result.text,
         │         sender: 'contact',
         │         timestamp: Date.now()
         │       })
         └─> messageDelayCounter = 2 (seconds)

      2. Queue Additional Text Messages
         ├─> messageQueue.queueTextMessages(result.textMessages)
         │   └─> For each message:
         │       ├─> addDelayedMessage(contactId, message, messageDelayCounter)
         │       └─> messageDelayCounter += 2
         
      3. Queue Success Media
         ├─> messageQueue.queueSuccessMedia(result.successMedia)
         │   └─> Schedules media with current delay
         
      4. Queue Evidence Documents
         ├─> messageQueue.queueMediaMessages(result.mediaId)
         │   ├─> documentsStore.unlockDocuments(mediaIds)
         │   ├─> mediaArray = documentsStore.findMediaArray(mediaId)
         │   └─> For each media:
         │       ├─> Schedule message
         │       └─> Increment delay
         
      5. Queue Evidence Text
         ├─> messageQueue.queueEvidenceText(result.evidenceText)
         └─> messageQueue.queueEvidenceMessages(result.evidenceTextMessages)
         
      6. Queue Triggered Narratives
         ├─> messageQueue.queueNarrativeMessages(result)
         │   └─> Schedules result.narrativeMessages with delays
         │
         └─> messageQueue.queueNarrativeMedia(result.narrativeMediaIds)
             ├─> documentsStore.unlockDocuments(narrativeMediaIds)
             └─> Schedule each media

      7. Calculate Total Delay
         └─> totalMessageDelay = messageDelayCounter * 1000 (ms)

   E. Hide Typing Indicator
      └─> setTimeout(() => isTyping.value = false, totalMessageDelay)

   F. Handle Success Actions (if solved)
      ├─> isMessageSending.value = false
      │
      └─> messageQueue.handleSuccessActions(result, totalMessageDelay)
          └─> setTimeout(() => {
                if (result.notificationContact && result.notificationMessage) {
                  show(result.notificationMessage, result.notificationContact)
                }
              }, totalMessageDelay + 2000)

   G. Handle Failure Actions (if not solved)
      ├─> messageQueue.handleFailureActions(result)
      │   └─> If result.status === 'locked':
      │       └─> show('🔒 Sistema Bloccato - Cooldown Attivo')
      │
      └─> isMessageSending.value = false

3. Messages Appear Sequentially
   └─> Each message appears at its scheduled time
   └─> scrollToBottom() called after each

4. Turn Advancement Triggers (if puzzle solved)
   └─> watch(currentTurn) in ChatRoom.vue detects change
   └─> useTurnTransition.handleTurnChange(newTurn) executes
       └─> See Flow 5
```

---

### Flow 5: Turn Transition

```
When currentGlobalTurn changes (after solving a puzzle):

1. Watch Detects Change
   ├─> watch(currentTurn) in ChatRoom.vue
   └─> Calls: turnTransition.handleTurnChange(newTurn)

2. useTurnTransition.handleTurnChange(newTurn) executes:

   A. Skip Conditions
      ├─> If newTurn <= 1: return (initial turn, handled by ContactLoader)
      └─> If isMessageSending.value: return (puzzle being solved)

   B. Get Narrative Data for New Turn
      ├─> narrativeData = getNarrativeMessagesForTurnStart(contactId, newTurn)
      │   └─> Returns: { messages: string[], mediaIds: string[] }
      │       └─> For events: type === 'narrative' && turnId === newTurn && triggerAfter === null
      │
      └─> triggeredData = checkTriggeredNarratives(contactId)
          └─> Returns: { messages: string[], mediaIds: string[], events: [] }
              └─> For events: type === 'narrative' && triggerAfter matches existing message

   C. Schedule Turn-Start Narrative Messages
      ├─> delay = 0
      │
      └─> For each message in narrativeData.messages:
          ├─> narrativeId = `narrative_turnstart_${newTurn}_${index}`
          │
          ├─> If !gameStore.isNarrativeShown(narrativeId):
          │   ├─> setTimeout(() => {
          │   │     chatStore.addMessage(contactId, {
          │   │       id: `msg_narrative_turnstart_${newTurn}_${index}`,
          │   │       content: message,
          │   │       sender: 'contact',
          │   │       timestamp: Date.now()
          │   │     })
          │   │     gameStore.setNarrativeShown(narrativeId, true)
          │   │   }, delay)
          │   │
          │   └─> delay += 2000
          │
          └─> Message appears after delay

   D. Schedule Turn-Start Media
      ├─> If narrativeData.mediaIds.length > 0:
      │   ├─> documentsStore.unlockDocuments(mediaIds)
      │   ├─> mediaArray = documentsStore.findMediaArray(mediaIds)
      │   │
      │   └─> For each media:
      │       ├─> narrativeMediaId = `narrative_media_turnstart_${newTurn}_${idx}`
      │       │
      │       └─> If !gameStore.isNarrativeShown(narrativeMediaId):
      │           ├─> Schedule message with delay
      │           ├─> Mark as shown
      │           └─> delay += 2000

   E. Schedule Triggered Narratives (from other contacts)
      ├─> If triggeredData.messages.length > 0:
      │   ├─> documentsStore.unlockDocuments(triggeredData.mediaIds)
      │   │
      │   └─> For each triggered message:
      │       ├─> event = triggeredData.events[0]
      │       ├─> narrativeId = `narrative_triggered_${event.id}_${index}`
      │       │
      │       └─> If !gameStore.isNarrativeShown(narrativeId):
      │           ├─> Schedule message
      │           ├─> Mark as shown
      │           └─> delay += 2000

   F. Schedule Triggered Media
      └─> Same process for triggeredData.mediaIds

3. ChatRoom Re-renders
   ├─> currentTurn computed value updates
   ├─> useContactLoader may load new preQuestion for next puzzle
   └─> Messages appear in sequence

4. All Contacts Update (via ChatList)
   └─> When user returns to ChatList, contacts show at correct turn levels
```

---

### Flow 6: Phone Call to Unlock Contact

```
1. User Navigates to /phone (PhoneDialer.vue)

2. User Enters Phone Number
   ├─> Clicks digits on Keypad component
   └─> phoneNumber ref accumulates digits

3. User Presses Call Button
   └─> handleMakeCall() executes:
       └─> makeCall(phoneNumber.value)

4. usePhone.makeCall(number) executes:

   A. Set Dialing State
      ├─> dialedNumber.value = number
      └─> callStatus.value = 'dialing'

   B. Simulate Dialing (4 seconds)
      └─> await new Promise(resolve => setTimeout(resolve, 4000))

   C. Find Contact by Phone
      ├─> contact = registry.find(c => c.phoneNumber === number)
      │
      └─> If not found:
          ├─> callStatus.value = 'not-found'
          └─> return

   D. Check Availability
      └─> If gameStore.currentGlobalTurn >= contact.visibleAtTurn:
          
          SUCCESS PATH:
          ├─> contactName.value = contact.name
          ├─> acceptedContactId.value = contact.id
          ├─> callStatus.value = 'accepted'
          │
          └─> gameStore.unlockContactByPhone(contact.id)
              └─> phoneUnlockedContacts.push(contact.id)
          
          REJECTED PATH (turn requirement not met):
          ├─> contactName.value = contact.name
          └─> callStatus.value = 'rejected'

5. Watch callStatus in PhoneDialer.vue
   └─> If status === 'accepted':
       ├─> Wait 2 seconds (show "Call Accepted" screen)
       └─> router.push({ name: 'chat', params: { id: acceptedContactId.value } })
           └─> Navigate to chat with newly unlocked contact

6. Chat Opens (Flow 2 or 3)
   └─> Contact now appears in visibleContacts list
   └─> Chat conversation begins
```

---

### Flow 7: Using Hints

```
1. User in ChatRoom viewing a puzzle

2. Hint Button Available
   ├─> isHintAvailable computed checks:
   │   ├─> currentPuzzle exists
   │   ├─> currentPuzzle.hints array exists and not empty
   │   └─> usedHints < hints.length
   └─> Hint button shown in AppHeader

3. User Clicks Hint Button
   └─> requestHint() executes:

   A. Validate Hint Available
      └─> If !isHintAvailable: return

   B. Get Puzzle and Used Hints
      ├─> puzzleKey = `${contactId}_${currentTurn}`
      ├─> usedHints = gameStore.getUsedHintsForPuzzle(puzzleKey)
      └─> hintText = currentPuzzle.hints[usedHints]

   C. Add Hint Message
      ├─> addDelayedMessage(contactId, {
      │     id: `msg_hint_${puzzleKey}_${usedHints}`,
      │     content: hintText,
      │     sender: 'contact'
      │   }, 0)  // Immediate, no delay
      │
      └─> gameStore.useHint(puzzleKey)
          ├─> usedHintsPerPuzzle[puzzleKey]++
          └─> totalHintsUsed++

   D. Show Typing Briefly
      ├─> isTyping.value = true
      └─> setTimeout(() => {
            isTyping.value = false
            scrollToBottom()
          }, 1000)

4. Hint Appears in Chat
   └─> User can read hint and try again with better answer
```

---

### Flow 8: Document/Evidence Viewing

```
1. User Receives Media Message
   └─> Can happen via:
       ├─> Solving puzzle (evidence unlocked)
       ├─> Narrative event (documents revealed)
       └─> Turn progression (automatic media delivery)

2. Message with Media Renders
   ├─> MessageBubble component receives :media prop
   └─> Media displayed as thumbnail with type indicator

3. User Clicks Media Thumbnail
   └─> @openFullscreen(media) emits to ChatRoom

4. useImageViewer.openFullscreen(media)
   ├─> fullscreenMedia.value = media
   └─> resetZoom()

5. FullscreenMediaModal Displays
   ├─> Shows full-size image/PDF
   ├─> Zoom controls available (if image)
   └─> Close button to exit

6. User Interacts
   ├─> Zoom In/Out: zoomIn(), zoomOut()
   ├─> Pan: startDrag(), onDrag(), stopDrag()
   └─> Reset: resetZoom()

7. User Closes Modal
   └─> closeFullscreen()
       └─> fullscreenMedia.value = null
```

---

### Flow 9: Game Reset

```
1. User Opens Side Menu (from ChatList)
   └─> Clicks hamburger icon in AppHeader

2. User Clicks "Reset Game"
   └─> Confirmation dialog appears

3. User Confirms Reset
   └─> resetGame() executes:

   A. Clear All Store Data
      ├─> chatStore.resetChatHistories()
      │   ├─> chatHistories = {}
      │   ├─> hasNotification = {}
      │   ├─> clearDelayedMessages()
      │   ├─> typingIndicators = {}
      │   └─> messageSending = {}
      │
      ├─> gameStore.resetAll()
      │   ├─> currentGlobalTurn = 1
      │   ├─> puzzleStatus = {}
      │   ├─> phoneUnlockedContacts = []
      │   ├─> totalHintsUsed = 0
      │   ├─> usedHintsPerPuzzle = {}
      │   └─> shownNarratives = {}
      │
      └─> documentsStore.resetDocuments()
          └─> unlockedDocumentIds = [initial documents only]

   B. Clear localStorage Flags
      ├─> localStorage.removeItem('has_been_unlocked')
      └─> localStorage.setItem('chat_locked', 'true')

   C. Navigate to Lock Screen
      ├─> closeMenu()
      └─> router.push('/lock')

4. User Re-unlocks App
   └─> Starts fresh game from turn 1
```

---

## Data Flow Diagrams

### Message Flow in Puzzle Solving

```
User Input
    ↓
handleSendMessage() in ChatRoom.vue
    ↓
┌─────────────────────┐
│  GameStore          │
│  validateAnswer()   │
│                     │
│  1. Parse format    │
│  2. Find puzzle     │
│  3. Check locks     │
│  4. Validate answer │
│  5. Return result   │
└─────────────────────┘
    ↓
┌──────────────────────────────────┐
│  ChatStore                       │
│  queuePuzzleResponse()           │
│                                  │
│  1. Adds main response           │
│  2. Queues text messages         │
│  3. Queues media documents       │
│  4. Queues evidence              │
│  5. Queues narratives            │
│  6. Returns total delay          │
└──────────────────────────────────┘
    ↓
chatStore.addDelayedMessage()
    ↓
setTimeout() for each message
    ↓
chatStore.addMessage() (when delay expires)
    ↓
Messages appear in UI (ChatRoom.vue)
    ↓
UIStore.showNotification() (if success)
```

### Store Interaction Diagram

```
┌──────────────┐
│  GameStore   │ ◄──────────────┐
│              │                │
│ - turns      │                │
│ - puzzles    │                │
│ - unlocked   │                │
└──────┬───────┘                │
       │                        │
       │ reads                  │ updates
       │                        │
       ▼                        │
┌──────────────────┐            │
│  NarrativeStore  │            │
│                  │            │
│ Computes:        │            │
│ - currentTurn    │────────────┘
│ - narratives     │
│ - puzzles        │
│ - triggered      │
└────────┬─────────┘
         │
         │ provides data to
         │
         ▼
┌─────────────────────┐
│   ChatStore         │
│                     │
│ - messages          │
│ - notifications     │
│ - typing            │
└─────────────────────┘
         │
         │ unlocks
         │
         ▼
┌─────────────────────┐
│  DocumentsStore     │
│                     │
│ - unlocked docs     │
└─────────────────────┘
```

### Component & Store Hierarchy

```
ChatRoom.vue
    │
    ├─> gameStore
    │   ├─> validateAnswer() - Validates puzzle answers
    │   └─> Game state management
    │
    ├─> chatStore
    │   ├─> loadContactMessages() - Loads initial messages, narratives, pre-questions
    │   ├─> queuePuzzleResponse() - Queues all puzzle response messages
    │   ├─> handleTurnTransition() - Schedules turn-change narratives
    │   ├─> scheduleTriggeredNarratives() - Cross-contact triggers
    │   └─> Message state management
    │
    ├─> uiStore
    │   ├─> Image viewer (fullscreen, zoom, pan)
    │   └─> showNotification() - Toast notifications
    │
    ├─> narrativeStore
    │   └─> Read-only data queries
    │
    └─> documentsStore
        └─> Document unlocking

ChatList.vue
    │
    └─> Reads from stores:
        ├─> gameStore.currentGlobalTurn
        ├─> gameStore.phoneUnlockedContacts
        └─> chatStore (for messages)

PhoneDialer.vue
    │
    └─> gameStore
        ├─> makePhoneCall() - Validates and processes phone calls
        └─> callStatus, dialedNumber, etc.

ToastNotification.vue
    │
    └─> uiStore
        └─> toasts, removeToast()
```

### Narrative Loading Decision Tree

```
Opening Chat
    │
    ├─> Is New Chat? (messages.length === 0)
    │   │
    │   YES ───┐
    │   │      │
    │   │      ├─> Load Initial Message
    │   │      │   └─> Schedule with delay
    │   │      │
    │   │      ├─> Load Turn Narratives
    │   │      │   └─> Check: !isNarrativeShown()
    │   │      │   └─> Schedule with incrementing delays
    │   │      │
    │   │      ├─> Load Triggered Narratives
    │   │      │   └─> Check: !isNarrativeShown()
    │   │      │
    │   │      └─> Load PreQuestion (first puzzle)
    │   │          └─> Check: !isPreQuestionShown()
    │   │
    │   NO ────┐
    │          │
    │          ├─> Skip Initial Message
    │          │
    │          ├─> Load Turn Narratives (current turn)
    │          │   └─> Check: !isNarrativeShown()
    │          │   └─> Only new narratives scheduled
    │          │
    │          ├─> Load Triggered Narratives
    │          │   └─> Check: !isNarrativeShown()
    │          │
    │          └─> Load PreQuestion (current puzzle)
    │              └─> Check: !isPreQuestionShown()
    │
    └─> All narratives scheduled with delays
        └─> Typing indicator shown/hidden appropriately
```

---

## Key Patterns & Principles

### 1. Deduplication via Tracking
- **Pattern**: Use `gameStore.isNarrativeShown(id)` and `gameStore.isPreQuestionShown(key)` to prevent duplicate messages
- **Why**: Same narrative could be triggered multiple times (reopening chat, turn changes)
- **Implementation**: Check before scheduling, mark as shown after scheduling

### 2. Delayed Message Sequencing
- **Pattern**: All messages scheduled with incremental delays (2 seconds between each)
- **Why**: Creates realistic conversation flow, prevents message flooding
- **Implementation**: 
  - `useMessageScheduler` for initial load
  - `useMessageQueue` for puzzle responses
  - `setTimeout()` for delivery

### 3. Turn-Based Progression
- **Pattern**: Global turn counter determines what content is visible/accessible
- **Why**: Linear narrative progression, prevents skipping ahead
- **Implementation**: 
  - `gameStore.currentGlobalTurn` as source of truth
  - `narrativeStore.getCurrentTurnForContact()` computes per-contact progress
  - Puzzles advance turn when solved

### 4. Reactive State with Computed Properties
- **Pattern**: Heavy use of `computed()` to derive state
- **Why**: Automatic reactivity, no manual updates needed
- **Examples**:
  - `currentTurn = computed(() => narrativeStore.getCurrentTurnForContact(contactId.value))`
  - `messages = computed(() => chatStore.getMessages(contactId.value))`
  - `visibleContacts = computed(() => filter by turn and phone unlock status)`

### 5. Store-Based Architecture
**Stores own their domains completely:**
- **GameStore**: Game rules, validation, puzzle logic, phone system
- **ChatStore**: All message management and scheduling
- **UIStore**: Pure UI state (notifications, image viewer)
- **NarrativeStore**: Read-only computed data from JSON files
- **DocumentsStore**: Document unlocking

Benefits:
- Single source of truth for each domain
- No indirection through composables
- Easier to test and debug
- Better DevTools integration
- Clearer data flow

### 6. Store Persistence Strategy
- **Persisted**: Game progress, chat histories, unlocked documents
- **Not Persisted**: Temporary UI state (typing indicators, delayed messages, message sending)
- **Why**: Restore game state on reload, but not transient UI artifacts

### 7. Event-Driven Narrative Triggers
- **Pattern**: Narratives can be triggered by:
  - Turn advancement (turnId match)
  - Specific message IDs (triggerAfter)
- **Why**: Flexible storytelling, cross-contact narrative threads
- **Implementation**: `checkTriggeredNarratives()` searches all chats for trigger conditions

---

## Conclusion

This application uses a **simplified, store-centric architecture** with five Pinia stores to create an interactive, turn-based investigation game. The key improvements are:

1. **Store-Based Logic**: All business logic consolidated into stores - no scattered composables
2. **Clear Ownership**: Each store owns its domain completely (GameStore = game logic, ChatStore = messages, UIStore = UI)
3. **Single Source of Truth**: Direct store method calls (`chatStore.queuePuzzleResponse()`) instead of composable indirection
4. **Better Maintainability**: Easier to test, debug, and understand data flow
5. **Reactivity**: Vue's reactivity system propagates changes automatically through computed properties

**Architecture Summary:**
- **GameStore**: Puzzle validation, phone calls, game state
- **ChatStore**: Message management, scheduling, loading, turn transitions
- **UIStore**: Notifications, image viewer (pure UI state)
- **NarrativeStore**: Read-only computed data from JSON files
- **DocumentsStore**: Document unlocking

The execution flows are streamlined: Components call store methods directly, stores handle all logic internally, and state changes propagate reactively through the UI. This creates a seamless experience where solving puzzles unlocks new content, narratives trigger automatically, and the game state persists across sessions.

