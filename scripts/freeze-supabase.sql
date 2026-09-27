-- Run once in the original Supabase SQL editor immediately before final export.
-- Preserves data and existing grants. Immutable old Netlify deploys cannot write.
BEGIN;
CREATE FUNCTION public.red_contract_migration_read_only_20260927()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The Red Contract has moved to Cloudflare; source is read-only'
    USING ERRCODE = '25006';
END;
$$;
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['questionnaire_questions','questionnaire_choices',
    'invitation_codes','invitation_results','mini_game_scores','site_events']
  LOOP
    EXECUTE format('CREATE TRIGGER red_contract_migration_read_only_20260927 BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.red_contract_migration_read_only_20260927()', target);
  END LOOP;
END;
$$;
COMMIT;
SELECT c.relname AS frozen_table, t.tgenabled FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE t.tgname = 'red_contract_migration_read_only_20260927' ORDER BY c.relname;
