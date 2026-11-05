# Celebration Animation Feature

## Overview

The celebration animation provides positive visual feedback when users interact with feedback cards and send messages in the assessment workspace.

## Features

### Visual Animation

- **Confetti-style celebration** with 12 bouncing dots
- **Colorful dots** in green, blue, yellow, and pink
- **Staggered animation** with 0.1s delays between dots
- **Somersaulting Dott.it icon** that rotates 360° with scaling effects
- **2-second duration** before auto-hiding
- **Non-blocking overlay** that doesn't interfere with UI interactions

### Trigger Points

The celebration animation activates when:

1. **Sending messages**

   - Clicking the send button in the feedback history thread
   - Pressing Enter to send a message
   - **NEW**: Triggers both overlay celebration and sidebar Dott.it icon somersault

2. **Adding new feedback cards**

   - Clicking "Add Strength" button
   - Clicking "Add Suggestion" button

3. **Saving edited feedback cards**

   - Completing edits to existing feedback cards
   - Pressing Enter to save changes

4. **Adding feedback from AI messages**
   - Clicking on feedback items in AI assistant responses
   - Adding AI-generated feedback to the feedback section

## Technical Implementation

### State Management

```typescript
const [showCelebration, setShowCelebration] = useState(false)
```

### Animation Component

```tsx
{
  showCelebration && (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Confetti Animation */}
        <div className="flex space-x-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const colors = ['bg-green-400', 'bg-blue-400', 'bg-yellow-400', 'bg-pink-400']
            const colorClass = colors[i % 4]
            return (
              <div
                key={i}
                className={`size-3 rounded-full animate-bounce ${colorClass}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s',
                }}
              />
            )
          })}
        </div>
        
        {/* Somersaulting Dott.it Icon */}
        <div className="absolute top-4 left-4">
          <div className="animate-somersault">
            <img
              src="/dottit-logo.png"
              alt="Dott.it"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### CSS Animation

```css
@keyframes somersault {
  0% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(90deg) scale(1.1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  75% {
    transform: rotate(270deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.animate-somersault {
  animation: somersault 1s ease-in-out;
}
```

### Message Sending Trigger

```typescript
const handleSendMessage = async () => {
  if (!inputValue.trim()) return

  // ... message processing logic ...

  // Trigger celebration animation when message is sent
  setShowCelebration(true)
  setTimeout(() => setShowCelebration(false), 2000)

  // Dispatch custom event to trigger Dott.it icon somersault in sidebar
  const event = new CustomEvent('dott-celebration', { detail: { type: 'message-sent' } })
  window.dispatchEvent(event)

  // ... rest of function ...
}
```

### Sidebar Icon Animation

```typescript
// In AppSidebar component
const [isCelebrating, setIsCelebrating] = useState(false)

useEffect(() => {
  const handleCelebration = (event: CustomEvent) => {
    if (event.detail?.type === 'message-sent') {
      setIsCelebrating(true)
      setTimeout(() => setIsCelebrating(false), 1000)
    }
  }

  window.addEventListener('dott-celebration', handleCelebration as EventListener)
  
  return () => {
    window.removeEventListener('dott-celebration', handleCelebration as EventListener)
  }
}, [])

// Apply animation class conditionally
className={`object-contain w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 ${isCelebrating ? 'animate-somersault' : ''}`}
```

## User Experience

- **Positive reinforcement** for successful actions
- **Non-intrusive** design that doesn't disrupt workflow
- **Consistent timing** across all trigger points
- **Accessible** with proper z-index layering

## Files Modified

- `components/feedback-history-thread-view.tsx` - Main implementation
