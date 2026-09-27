-- Emergency rollback ONLY. After Cloudflare accepts writes, reconcile new rows first.
-- Never leave both databases writable with clients using different backends.
BEGIN;
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['questionnaire_questions','questionnaire_choices',
    'invitation_codes','invitation_results','mini_game_scores','site_events']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS red_contract_migration_read_only_20260927 ON public.%I', target);
  END LOOP;
END;
$$;
DROP FUNCTION IF EXISTS public.red_contract_migration_read_only_20260927();
COMMIT;
