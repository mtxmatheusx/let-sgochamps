## Direção visual: iOS 26 Liquid Glass · Light Apple · SF

Vou reescrever a linguagem visual do app inteiro com base em três pilares:

1. **Liquid Glass** — superfícies translúcidas com `backdrop-filter: blur()`, bordas hairline com brilho interno (inset highlight + outer shadow muito suave), e gradientes coloridos de fundo que vazam por trás dos cards (tipo iOS 26 widgets / Control Center).
2. **Light puro Apple** — fundo `#f5f5f7`, texto `#1d1d1f`, acentos azul `#0071e3` + dourado da marca como detalhe. Cards brancos quase puros sobre orbes coloridos desfocados.
3. **SF Pro stack** — `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter Tight", system-ui` para tudo. Sem Bebas, sem Playfair. Pesos 400/600/700/800, tracking negativo nos títulos grandes (`-0.04em`).

---

### 1. Sistema de design (`src/styles.css`)

Substituir tokens por uma paleta light Apple e adicionar utilitários de glass:

- Tokens novos: `--bg: #f5f5f7`, `--surface: #ffffff`, `--text: #1d1d1f`, `--text-muted: #6e6e73`, `--hairline: rgba(0,0,0,0.08)`, `--accent: #0071e3`, `--accent-gold: #b8962e` (preservado como toque de marca).
- Stack de fonte: substituir `--font-sans`, `--font-display`, `--font-serif` por uma única stack SF system. Headings ganham `font-weight: 700` e `letter-spacing: -0.035em`.
- Utilitários:
  - `.glass` — `background: rgba(255,255,255,0.6); backdrop-filter: blur(40px) saturate(180%); border: 1px solid rgba(255,255,255,0.7); box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.06)`.
  - `.glass-dark` — variante para a navbar (translúcida sobre conteúdo escuro).
  - `.hairline` — borda 1px com a cor `--hairline`.
  - `.orb` — div circular com `filter: blur(80px)` e cores vivas (azul, gold, verde) que ficam atrás dos cards.
  - `.sf-display` — utilitário para títulos massivos com tracking apertado.

### 2. Navbar global (`src/components/Layout.tsx`)

- Translúcida fixa: `position: sticky`, `background: rgba(245,245,247,0.72)`, `backdrop-filter: blur(20px) saturate(180%)`, hairline embaixo.
- Logo "LGC" em SF semibold (sem dourado por padrão, dourado só no hover).
- Links em `text-[13px] font-medium`, com underline animado fininho (1px) em vez do gold de 2px.
- Mobile: trocar o menu hamburger por um sheet que desliza de cima com mesma estética glass.
- Footer: simplificar para uma linha de copy + links em SF caps minúsculas.

### 3. Auth (`src/routes/auth.tsx`) — atualmente "amador"

Esse é o ponto mais crítico (você está olhando ele agora):

- **Background**: três orbes coloridas desfocadas (azul, gold, verde mint) animando devagar (float infinito com framer-motion), sobre `#f5f5f7`.
- **Card central**: glassmorphism puro — `backdrop-blur(40px)`, borda branca translúcida, sombra suave, raio 24px.
- **Marca**: "Let's Go Champs" em SF heavy 28px, tracking −0.04em, cinza-quase-preto. Sem o "LGC" abreviado.
- **Title**: "Sign in." / "Create account." em SF 40px bold com tracking apertado.
- **Inputs**: altura 52px, raio 14px, fundo `rgba(0,0,0,0.04)`, sem borda visível, focus revela uma borda azul Apple `#0071e3` com glow azul translúcido. Label flutuante (estilo iOS).
- **Botão primary**: pill 52px, fundo `#0071e3` (azul Apple) por padrão; o gold continua disponível como variant secundária. Texto "Sign in" em SF semibold, sem uppercase.
- **Toggle signin/signup**: segmented control no topo (estilo iOS Settings), em vez do link de texto embaixo.
- **Mensagens**: toast iOS-style — pill flutuante translúcida no topo, não banner verde.

### 4. Dashboard (`src/routes/index.tsx`)

- **Hero**: manter o full-bleed com parallax, mas:
  - Trocar a foto Unsplash por uma composição mais clean: foto monocromática + overlay branco gradiente (do transparente no topo para `#f5f5f7` sólido embaixo, dando continuidade ao bg).
  - Headline "LET'S GO CHAMPS." em SF 700 com tracking −0.05em (não mais Bebas). Tamanho responsivo 80–180px.
  - CTA: pill azul `#0071e3` com chevron iOS (›) animado.
- **Bento grid**: refinar para parecer widgets iOS 26:
  - Cards com `.glass` em vez de branco sólido, sobre orbes coloridas no fundo.
  - Card de streak (grande): adicionar um anel de progresso SVG ao redor do número (estilo Activity Rings), animando do 0 ao valor atual.
  - Card de minutos: número gigante em SF, sublinhado por uma sparkline minimalista dos últimos 7 dias.
  - Hover: leve tilt 3D (`rotateX/rotateY` baseado na posição do mouse) + brilho interno seguindo o cursor (efeito "spotlight" tipo Apple Vision keynote).
- **Chart Recharts**: trocar barras douradas chapadas por barras com gradiente azul→roxo, raio maior, tooltip glass.
- **Banda "consistency becomes identity"**: virar uma seção full-bleed com fundo gradiente animado (azul → roxo → preto) e texto em SF heavy.

### 5. Log Movement + History

- **Log**: form em card glass, inputs no mesmo padrão iOS do auth, segmented control para escolher intensidade (Low/Moderate/High) e mood. Slider iOS-style para duration. Botão azul Apple no final.
- **History**: trocar a tabela por uma lista estilo iOS (linhas com hairline divider, chevron à direita, agrupamento por data com sticky headers translúcidos). Pills de intensidade com glass + tint colorido.

### 6. Animações (nível 5 mantido)

- `framer-motion` para parallax, reveals em cascata, número que sobe.
- Adicionar: spotlight hover nos cards (mouse-tracking), float infinito nas orbes de fundo, segmented control com `layoutId` (animação compartilhada da pílula selecionada).
- Curva padrão: `[0.22, 1, 0.36, 1]` (Apple-like ease-out exponencial).

---

### Detalhes técnicos

- Não preciso instalar nada novo (`framer-motion` já está). Vou usar SF nativo via CSS stack — não baixa fonte externa, então é instantâneo no Mac/iOS do usuário (e Inter Tight como fallback no Windows/Android).
- Atualizo `src/styles.css` (tokens + utilitários glass), `src/components/Layout.tsx` (navbar glass), `src/routes/auth.tsx` (rebuild), `src/routes/index.tsx` (refino bento + activity rings), `src/routes/log.tsx` e `src/routes/history.tsx` (linguagem iOS).
- O `useCountUp` hook permanece. Adiciono um pequeno componente `<ActivityRing>` SVG novo.
- Preservo o dourado `#b8962e` como cor de marca acessória (ainda aparece em pequenos detalhes, ex: dot de status, hover do logo) para não perder a identidade Let's Go Champs.

---

### Fora de escopo

- Não mexo na lógica de Supabase, auth flow, ou estrutura de rotas.
- Não recrio a feature de Stories (continua removida).
- Não adiciono dark mode toggle (você escolheu light puro).