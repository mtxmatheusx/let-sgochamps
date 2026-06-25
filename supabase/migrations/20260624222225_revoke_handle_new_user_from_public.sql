-- Postgres grants EXECUTE to PUBLIC by default, which shadowed the earlier revoke.
-- handle_new_user is a signup TRIGGER (fires as owner regardless), so removing the
-- public RPC path is safe and stops it being callable via /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
