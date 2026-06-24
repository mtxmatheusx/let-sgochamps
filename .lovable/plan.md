## Objetivo

Habilitar perfis editáveis (foto + bio + links) com uma página de networking onde os champs descobrem uns aos outros, e fechar as 3 pendências da varredura anterior.

---

## 1. Perfis editáveis

**Backend (migração)**
- Estender `public.profiles` com: `bio` (texto curto), `location`, `website_url`, `instagram_handle`, `favorite_movement`, `is_discoverable` (boolean, default true — controla se aparece no diretório).
- Bucket Storage `avatars` (público) + políticas RLS: leitura pública, upload/update/delete só do próprio usuário na pasta `{user_id}/`.
- RPC `search_champs(q text, limit_n int)`: lista perfis discoverable com nome, avatar, bio curta, localização, contagem de check-ins e streak — uma única chamada para a página de networking.
- RPC `get_public_profile(p_user_id uuid)`: perfil + últimos 10 check-ins públicos + grupos públicos em comum.

**Frontend**
- Nova rota `/profile` (editar o meu): foto (upload pro bucket `avatars` com preview e crop simples via `object-fit`), nome de exibição, bio (300 char), localização, site, Instagram, movimento favorito, toggle "aparecer no diretório". Salva em `profiles`.
- Nova rota `/champs` (diretório/networking): grid de cards com foto, nome, bio, streak, botão "Ver perfil". Busca por nome/localização. Vazio gracioso quando ninguém marcou discoverable.
- Nova rota `/champs/$userId` (perfil público): hero com foto + bio + links, stats (streak, total minutes, dias ativos), últimos check-ins, grupos públicos em comum.
- Link "My profile" no menu do Layout (desktop e mobile sheet). Link "Champs" no nav principal.

---

## 2. Pendências da varredura

- Criar tabela `weekly_messages` (week_start, message, author_note) + RLS pública só de leitura + linha seed da semana atual com mensagem do Aidan.
- Criar RPC `get_community_weekly_stats` (SECURITY DEFINER) que agrega total_minutes, active_champs, sessions_logged da semana ISO atual.
- Inserir owner do clube global "The Wall" em `group_members` como `owner`, para o roll-call e feed funcionarem.

---

## Detalhes técnicos

```text
profiles (estendida)
 ├─ bio text                       (max 300)
 ├─ location text
 ├─ website_url text
 ├─ instagram_handle text
 ├─ favorite_movement text
 └─ is_discoverable bool default true

storage: avatars/  (public read, owner-only write em {auth.uid}/...)

RPCs novos (SECURITY DEFINER, search_path=public)
 ├─ search_champs(q text default '', limit_n int default 60)
 ├─ get_public_profile(p_user_id uuid)
 └─ get_community_weekly_stats()

weekly_messages
 ├─ week_start date PRIMARY KEY
 ├─ message text not null
 └─ author_note text
RLS: SELECT to anon+authenticated; INSERT/UPDATE/DELETE só service_role.
```

Rotas novas em `src/routes/`: `profile.tsx`, `champs.index.tsx`, `champs.$userId.tsx`. Helpers em `src/lib/profiles.ts`. Upload de avatar via `supabase.storage.from('avatars').upload(...)`. Cache invalida `['profile', userId]` e `['champs']` após save.

Telas mantêm o design system existente (glass, ios spring, animações já padronizadas).

---

## Fora do escopo (perguntar depois se quiser)

- Seguir / mensagens diretas entre champs (requer tabelas `follows` e `messages` + realtime).
- Verified badge / staff.
- Notificações de novo seguidor.