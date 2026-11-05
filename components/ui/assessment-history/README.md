# Assessment History Components

Componentes reutilizáveis para interface de histórico de avaliação.

## Componentes

### AssessmentHistoryContainer (Principal)

Componente principal que orquestra todos os outros componentes para exibir o histórico de avaliação. Use este para substituir o componente original.

#### Teacher feedback actions (no draft state)

Teacher actions are now persisted immediately (no local draft merge):

- **Select AI suggestion**: create a new feedback section linked by `aiSuggestionsId`.
- **Unselect AI suggestion**: remove the linked feedback section.
- **Add custom strength/suggestion/comment**: create section directly in pending feedback.
- **Edit custom section**: patch section content/type.

`POST /api/feedback` and `PATCH /api/feedback/:id` require the same session auth as other write routes.

### AssessmentHistoryHeader

Header do histórico de avaliação com título e ícone.

### AssessmentHistoryDivider

Divider com data para separar seções da conversa.

### AssessmentHistoryAvatar

Avatar para diferentes tipos de usuário (aluno, IA, usuário).

### StudentMessage

Mensagem do aluno com preview colapsável e expansível.

### AIMessage

Mensagem da IA com diferentes tipos (feedback, sugestão de score, padrão).

### FeedbackBubbles

Bubbles para exibir strengths e suggestions da IA.

### FeedbackSideCard

Card lateral para exibir detalhes do feedback selecionado.

### AssessmentHistoryLoading

Indicador de loading quando o sistema está processando.

## Tipos

- `Message`: Interface para mensagens do histórico de avaliação
- `FeedbackItem`: Interface para itens de feedback
- `FeedbackCard`: Interface para cards de feedback
- `Record`: Interface para registro de avaliação

## Uso

### Uso Principal (Recomendado)

```tsx
import { AssessmentHistoryContainer } from '@/components/ui/assessment-history'

// Substitua o componente original por:
;<AssessmentHistoryContainer
  record={record}
  messages={messages}
  showStudentInfo={showStudentInfo}
  onFeedbackToggle={handleFeedbackToggle}
  onAcceptScore={handleAcceptScore}
  onSetScore={handleSetScore}
  acceptedScore={acceptedScore}
/>
```

### Uso Individual dos Componentes

```tsx
import {
  AssessmentHistoryHeader,
  AssessmentHistoryDivider,
  StudentMessage,
  AIMessage,
  FeedbackBubbles,
} from '@/components/ui/assessment-history'
```
