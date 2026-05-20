# Spec: The Wall — global champs feed

## Objetivo

Uma página `/wall` onde **qualquer champ logado** pode postar foto + texto sobre
seu exercício e ver, no mesmo lugar, os posts de **todos os outros champs** num
feed cronológico — sem precisar pertencer a um Club ou Challenge específico.

É a **praça pública** do LGC: o lugar onde a Brilliance Tree mostra cara em
escala global, não fechada em silos de grupo. Champs novos chegam, veem a wall
cheia de outros champs reais postando, e sentem "isto aqui é uma comunidade que
existe."

## Contexto

- **Schema atual já cobre 100%** do que precisamos:
  - `activities` — o check-in em si (type, duration, mood, intensity, notes)
  - `check_in_photos` — fotos atreladas a uma activity
  - `comments` — comentários atrelados a uma activity
  - `activity_groups` — cross-posting de uma activity pra N groups
  - `groups` — Clubs e Challenges com RLS por membership
  - `profiles` — display_name + avatar
- **Componentes prontos**: `src/components/FeedCard.tsx` renderiza
  fotos + meta + comentários colapsáveis. Reutilizar 100%.
- **Libs prontas**: `src/lib/feed.ts` já tem `fetchGroupFeed`, `postComment`,
  `uploadCheckInPhoto`, `postActivityToGroups`.
- **Restrição crítica do owner**: "tem que aproveitar o schema atual" —
  decisão de design: **The Wall será modelada como um Club especial do sistema**
  (slug `the-wall`, `is_public=true`, owner = um system user ou o admin),
  onde **todo champ é automaticamente adicionado** quando faz signup.
  Zero mudanças de schema. Composer faz cross-post pro Wall por padrão.
- **Spec paralelo**: `spec-strava.md` (device sync via Strava) está pausado,
  voltamos depois.

## Tom & Copy

A Wall não é "feed" e não é "timeline" — palavras de produto. É **a praça da
tribo**. Linguagem de espelho coletivo, não de métrica.

- **Eyebrow / tagline da página**: "Mostrando o movimento da tribo champs"
  *(ou em EN: "The movement of the champs tribe")*
- **H1**: "The Wall" — direto, sem ornamento
- **Composer placeholder**: "Share today's move with the tribe…"
- **Botão de publicar**: "Share with the champs"
- **Empty state (feed vazio)**: "Be the first to show up for the tribe."
- **Empty comment thread**: "Send some encouragement →"

Evitar a todo custo: *"likes"*, *"followers"*, *"trending"*, *"feed"*,
*"timeline"*, *"posts"*, *"engagement"*. Preferir: *tribe, champs, the wall,
move, show up, share, encouragement.*

## Restrições

- **Web only**, mesmo stack (TanStack Router + Supabase + RLS + framer-motion)
- **Zero alterações de schema** — só seed de uma linha em `groups` + trigger
  pra auto-join novos usuários ao Wall
- **Brilliance Tree philosophy** intacta:
  - Sem **like count** visível
  - Sem **ranking** de posts ("top of the day", "most popular")
  - Sem **reactions** com contagem
  - Apenas **comentários de encorajamento** (que já existem)
- **Posts são activities** — entram no streak/total/days do champ
  exatamente como qualquer outro check-in (não duplica esforço)
- **Composer mínimo**: foto + texto. Se champ quiser preencher type/duração/mood,
  a opção existe num "expand details" — mas o caminho mais curto é foto + texto
  e seguir a vida
- **Pelo menos um de**: foto OU texto. Não aceitar post completamente vazio
- **Sem app nativo, sem novas dependências pesadas**

## Critérios de Aceite

- [ ] Rota **`/wall`** existe, requer auth, presente na nav principal
- [ ] Existe um Club system com slug `the-wall` no `groups`, `is_public=true`,
      `name='The Wall'`
- [ ] **Auto-join no signup**: trigger `handle_new_user()` (já existe) é
      estendido pra também inserir o novo user em `group_members` do Wall
- [ ] **Backfill**: todos os usuários existentes hoje viram membros do Wall
- [ ] Página `/wall` mostra:
  - **Composer no topo**: foto (opcional) + textarea (opcional, max 600 chars)
    + botão "Share with the champs". Por padrão usa Walking/30min/Moderate/
    Energized como metadata. "Add details" expandível pra customizar
  - **Feed cronológico** abaixo, reusando `FeedCard.tsx` — mostra posts de
    todos os champs (porque todos são membros do Wall)
- [ ] Posts publicados na Wall **também aparecem no `/history`** do champ
      e **contam pra streak**
- [ ] Champ pode **deletar o próprio post** (botão sutil no FeedCard quando
      `meId === item.user_id`)
- [ ] **Sem like counts**, sem ranking, sem "trending"
- [ ] Composer com **foto E texto vazios → desabilita o botão Share**
- [ ] Funciona em mobile (composer empilhado, feed em coluna única)
- [ ] **Copy hits the right notes**: eyebrow "Mostrando o movimento da tribo
      champs", H1 "The Wall", placeholder/CTA conforme seção Tom & Copy.
      Sem usar "feed", "timeline", "posts", "likes" em texto visível
- [ ] Owner testa qualitativamente no Lovable e aprova

## Fora do Escopo

- **Edit de post** após publicar (delete + repostar)
- **Reactions / likes / kudos** — explicitamente nunca; choca com a filosofia
- **Tags / hashtags / mentions**
- **Perfil público individual** (`/champs/:slug`) — spec separado se precisar
- **Notificação quando alguém comenta** — defer pra Phase 2
- **Moderação / report** — defer (Aidan + admin sweep manual no admin panel
  por enquanto se aparecer algo ruim)
- **Visibilidade granular** (público / só amigos / só grupo) — Wall é
  binário: pra ele ou não
- **Pinning de posts** — sem destaque
- **Filtros do feed** ("só fotos", "só do dia") — feed é cronológico puro
- **Strava sync** (`spec-strava.md` pausado)
- **Refactor de Groups, Stories, Community ou About** — esta feature
  adiciona; não toca o que tá funcionando
