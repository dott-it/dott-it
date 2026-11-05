# V2 Tests Directory

Esta pasta contém todos os testes unitários e de integração para a aplicação V2.

## Estrutura de Pastas

```
__tests__/
├── README.md                    # Este arquivo
├── components/                  # Testes de componentes React
│   ├── buttons/                # Testes de componentes de botões
│   │   ├── button-compounds.test.tsx
│   │   └── google-button.test.tsx
│   ├── feedback/               # Testes de componentes de feedback
│   │   └── assessment-card.test.tsx
│   ├── forms/                  # Testes de componentes de formulários
│   │   └── form-field.test.tsx
│   ├── typography/             # Testes de componentes de tipografia
│   │   └── typography.test.tsx
│   └── ui/                     # Testes de outros componentes UI
├── hooks/                      # Testes de React hooks
│   └── use-google-auth.test.tsx
└── pages/                      # Testes de páginas/rotas
    └── login-page-google.test.tsx
```

## Convenções de Nomenclatura

- **Arquivos de teste**: `[nome-do-componente].test.tsx`
- **Pastas**: Use kebab-case (ex: `form-field`, `assessment-card`)
- **Imports**: Use caminhos relativos começando da pasta `__tests__`

## Executando os Testes

### Todos os testes

```bash
npm run test:unit
```

### Testes específicos por categoria

```bash
# Testes de componentes
npm run test:unit -- app/v2/__tests__/components

# Testes de hooks
npm run test:unit -- app/v2/__tests__/hooks

# Testes de páginas
npm run test:unit -- app/v2/__tests__/pages
```

### Testes específicos por subcategoria

```bash
# Apenas testes de botões
npm run test:unit -- app/v2/__tests__/components/buttons

# Apenas testes de formulários
npm run test:unit -- app/v2/__tests__/components/forms
```

## Padrões de Teste

### Componentes UI

- Teste a renderização básica
- Teste props e variantes
- Teste interações do usuário
- Teste acessibilidade quando aplicável

### Hooks

- Teste o estado inicial
- Teste mudanças de estado
- Teste efeitos colaterais
- Teste error handling

### Páginas

- Teste a renderização da página
- Teste navegação e roteamento
- Teste integração com componentes

## Ferramentas Utilizadas

- **Jest**: Framework de testes
- **React Testing Library**: Utilitários para testar componentes React
- **@testing-library/jest-dom**: Matchers customizados para Jest
- **@testing-library/user-event**: Simulação de eventos do usuário

## Configuração

- **jest.config.js**: Configuração principal do Jest
- **jest.setup.js**: Setup global para todos os testes
- **tsconfig.test.json**: Configuração TypeScript específica para testes
