## Goal

Make the count-up dos números bater com o ritmo geral do app — nem rápido demais (parece glitch), nem lento demais (fica solto do resto da animação).

## Diagnóstico do ritmo atual

Olhei os timings em volta para escolher uma duração que conversa com tudo:

- Bento cards entram com spring iOS (~0.4s perceptível)
- Hero headline: spring suave (~0.5s)
- Segmented pill desliza em ~0.3s
- Anel de streak (SVG): spring ~0.6s
- Count-up dos números hoje: **1.6s** ← destoa, fica "andando sozinho" depois que o resto já parou

A regra Apple é: animações terminam **juntas**. Quando o card termina de entrar, o número já tem que estar quase parando.

## Mudanças

### 1. `src/hooks/useCountUp.ts`
- Duração padrão: **1.6s → 1.1s** (alinha com o tempo de entrada + leitura do anel de streak)
- Mantém `easeOutExpo` (settle suave continua sendo a assinatura premium)
- Mantém animação a partir do valor anterior quando muda (não reseta pra 0)

### 2. `src/routes/index.tsx` — Hero stats bar
Hoje os números em "5 days · 120 min · 12" no hero desktop aparecem **estáticos** enquanto os do bento contam. Isso quebra a harmonia: o olho vê duas regiões com o mesmo tipo de dado se comportando diferente.

Aplicar `useCountUp` no `StatPill` para os valores numéricos (`streak`, `totalMinutes`, `daysShowedUp`) — começam a contar junto com a entrada do hero (~0.24s delay), terminam ~1.3s depois. Sincroniza com o bento que entra logo abaixo.

### 3. Anel de streak (`ActivityRing`)
Verificar se a duração do preenchimento do arco SVG bate com o count-up (1.1s). Se estiver diferente, alinhar — o número e o anel têm que parar no mesmo frame.

## Fora de escopo

- Não mexer no Log/History agora (você não pediu, e a página principal é onde a harmonia mais importa)
- Não trocar o easing (easeOutExpo está perfeito pra Apple feel)
- Não animar números pequenos tipo "5 sessions logged" no footer da tabela (ruído visual, não vale)

## Resultado esperado

Você abre a home, e numa janela de ~1.3s **tudo** acontece em coro: hero entra, bento sobe, anel preenche, números (hero + bento) sobem do zero, segmented pill se posiciona — e tudo para junto. Depois, silêncio total. É isso que faz parecer iOS 26 de verdade.
