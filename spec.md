# Spec: Device sync (web-only) — Strava as the universal bridge

## Objetivo

Permitir que champs conectem uma fonte externa de dados de atividade (relógio,
app de fitness) ao Let's Go Champs e tenham seus treinos importados como
check-ins automaticamente — sem precisar logar manualmente, e sem que o LGC
precise virar app nativo.

A meta não é "Apple Health no web" literalmente (não existe API web do HealthKit
— a única forma seria shipping um wrapper iOS, o que viola a restrição). A meta
é **eliminar a fricção do log manual** para os champs que já usam wearables.

## Contexto

- **Restrição absoluta**: web-only (sem Capacitor, sem app nativo, sem extensão de
  browser). Tudo precisa rodar dentro do que Lovable + Vite + React + Supabase
  já suportam.
- **Tabela `activities`** já existe (`src/lib/activities.ts`) com colunas
  `user_id, type, duration, intensity, mood, date, notes`. Toda atividade
  importada vira uma linha aqui — mesma forma, mesmo schema, mesmo feed.
- **Schema v2 de groups** já está deployado (Phase 1+2 — Clubs, Challenges, feed,
  photos, comments, roll call). Atividades importadas devem poder ser
  cross-posted para grupos como qualquer outro check-in.
- **Brilliance Tree philosophy**: a importação é opt-in, gentil, e não compete
  com o log manual. Continua existindo o "log a new move" tradicional, com a
  reflexão sobre intensidade + mood que é parte da identidade do app.

### Por que Strava (e não Apple Health diretamente)

Strava é o **bridge de facto** para wearables no ecossistema iOS/Android:
- A maioria dos iPhone users que tem Apple Watch já tem Apple Health ↔ Strava
- Garmin, Fitbit, Polar, Wahoo, Suunto, Coros — todos sincronizam pra Strava
- **OAuth web nativo** + REST API + free tier generoso (rate limits razoáveis)
- Webhook subscriptions pra atualização em tempo real (atividade nova no Strava
  vira check-in no LGC sem polling)

Uma única integração com Strava resolve ~80% do caso de uso "tenho um relógio
e quero que conte automaticamente" sem que o LGC precise virar app nativo.

## Restrições

- **Web-only**: nenhum código nativo. Toda a integração deve rodar no servidor
  Supabase (Edge Functions) + cliente React.
- **Brilliance Tree philosophy preservada**:
  - Importação **opt-in**, controlada pelo champ
  - O champ continua podendo **editar** mood/intensity/notes depois (Strava
    não traz isso — preencher com defaults sensatos e marcar como `synced`)
  - Sem leaderboard de "quem mais treina" — atividades importadas entram no
    mesmo feed/roll-call sem destaque especial
  - Possibilidade de **desconectar** a qualquer momento
- **Sem novas dependências pagas**: Strava API é free. Webhooks opcionais.
- **Não pode forçar onboarding**: champ pode ignorar a integração para sempre,
  o app continua 100% funcional sem ela.
- **Privacidade**: tokens armazenados criptografados no Supabase, nunca
  expostos ao cliente; refresh tokens rotacionados conforme spec do Strava.

## Decisões locked-in (após Q&A)

- **Provider**: Strava (confirmed) — bridge universal pra Apple Watch / Garmin / Fitbit / Polar / Coros / etc.
- **Tipos de atividade**: **expandir** a lista atual de 6 para 12 tipos cobrindo
  o repertório do Strava. Lista nova: Walking, Running, Cycling, Yoga,
  Stretching, Strength Training, **Swimming**, **Pilates**, **HIIT**, **Rowing**,
  **Dance**, **Other**. *Sem Hiking* (decisão explícita do champ owner).
- **Cadência de sync**: **Pull on app open** + botão manual "Sync now".
  Webhook fica explicitamente fora deste corte porque (a) duplica o trabalho de
  expor/manter Edge Function público com validação de assinatura, (b) ganho marginal
  pequeno — champs abrem o app diariamente, latência aceitável, (c) podemos
  adicionar webhook depois sem refactor da arquitetura.

## Critérios de Aceite

- [ ] Champ logado vê uma seção **"Connected devices"** no Dashboard (card
      colapsável) e em uma página `/settings/connections` dedicada
- [ ] Clicar em **"Connect Strava"** abre o OAuth do Strava (redirect, não popup)
- [ ] Callback do Strava (Edge Function) troca o code por tokens e salva
      criptografado em `device_connections` (chave por user_id)
- [ ] Após autorizar, o LGC mostra **"Connected · last sync: …"** com botão
      **"Sync now"**
- [ ] **Backfill inicial**: atividades dos últimos **14 dias** do Strava são
      importadas como check-ins do champ
- [ ] Importações aparecem no `/history`, contam para **streak + total minutes
      + sessions**, e entram no roll-call/stats de grupos onde o champ é membro
- [ ] **Sync on app open**: quando champ abre o LGC e a última sync foi há
      > 30 min, dispara pull automático silencioso no background
- [ ] Atividade importada tem **badge sutil** "↻ Strava" no feed/history
- [ ] Champ pode **editar** intensity/mood/notes em atividade importada
      (duration/type/date ficam read-only — vem do device)
- [ ] **Disconnect** remove tokens + para de importar; atividades já
      importadas permanecem (champ pode deletá-las uma a uma se quiser)
- [ ] **Sem duplicatas**: upsert pela coluna `external_id` (strava activity id)
      + `provider` (`'strava'`) — unique constraint
- [ ] **Mapeamento de tipos Strava → LGC**: Walk→Walking, Run/TrailRun/VirtualRun→Running,
      Ride/EBikeRide/VirtualRide/MountainBikeRide→Cycling, Swim→Swimming,
      Yoga→Yoga, Pilates→Pilates, WeightTraining→Strength Training,
      Workout/HIIT/Crossfit→HIIT, Rowing→Rowing, Dance→Dance, qualquer outro→Other
- [ ] Champ testa o fluxo no Lovable e aprova qualitativamente

## Fora do Escopo

- **Apple Health diretamente** — fica documentado como "futuro com app nativo"
- **Google Fit / Health Connect** — Phase 2 (mesmo padrão de provider,
  schema já preparado pra suportar)
- **Manual Apple Health XML upload** — possível alternativa futura, fora deste spec
- **Webhook do Strava** — fora deste corte (decisão acima). Tudo via pull
  on app open + botão manual
- **Hiking** — removido explicitamente da lista expandida de tipos
- **Importar treinos de mais de 14 dias atrás** — janela fechada pra evitar
  inundar o histórico do champ com dados antigos
- **Re-fetch retroativo on reconnect** — se champ desconecta e reconecta, não
  voltamos a importar atividades antigas (só dali pra frente)
- **Photos do Strava** — não puxamos imagens das atividades importadas
- **Comments/kudos do Strava** — não importados; o feed/comments do LGC é a
  conversa que importa aqui
- **Touchar schema atual de groups/feed/comments** — atividades importadas se
  encaixam no schema existente sem mudanças estruturais
- **Estilizar / refatorar qualquer outra coisa do app** — esta feature
  adiciona; não toca o que já tá funcionando
