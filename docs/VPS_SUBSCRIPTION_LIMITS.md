# Atualizar `useSubscriptionLimits` com bloqueio por faturas vencidas

Adicione ao hook `useSubscriptionLimits` a contagem de faturas com `status = 'overdue'` e bloqueie ações quando houver **3 ou mais** faturas vencidas.

## Mudanças na query

```typescript
// Adicionar ao queryFn, após contar properties:
const { count: overdueCount, error: overdueError } = await supabase
  .from('invoices')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'overdue');

if (overdueError) throw overdueError;

// Incluir no return:
overdueCount: overdueCount ?? 0,
```

## Novos campos na interface `SubscriptionLimits`

```typescript
overdueCount: number;
isBlockedByOverdue: boolean;
```

## Lógica de bloqueio no return

```typescript
const overdueCount = data?.overdueCount ?? 0;
const isBlockedByOverdue = overdueCount >= 3;

return {
  // ...campos existentes...
  canAddUser: !isBlockedByOverdue && (currentUsers < maxUsers),
  canAddProperty: !isBlockedByOverdue && (currentProperties < maxProperties),
  overdueCount,
  isBlockedByOverdue,
};
```

## Uso nos componentes

- **Listagem de imóveis**: se `isBlockedByOverdue`, desabilitar botão "Novo Imóvel" e mostrar label "Bloqueado - Faturas em atraso"
- **Convite de usuários**: se `!canAddUser`, exibir toast com `"Você possui ${overdueCount} faturas em atraso. Regularize seus pagamentos para convidar novos usuários."`
