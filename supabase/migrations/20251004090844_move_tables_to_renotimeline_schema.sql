-- Tables are already in renotimeline_schema (created there in initial migration)
-- This migration file was originally empty because the move was already done
-- No-op migration to maintain migration history integrity

-- Verify renotimeline_schema exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'renotimeline_schema') THEN
    RAISE EXCEPTION 'renotimeline_schema does not exist';
  END IF;
END $$;

-- Confirm tables are in correct schema
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name) INTO missing_tables
  FROM (
    VALUES
      ('projects'), ('tasks'), ('subtasks'),
      ('workflow_definitions'), ('custom_field_definitions')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'renotimeline_schema'
    AND table_name = expected.table_name
  );

  IF missing_tables IS NOT NULL THEN
    RAISE NOTICE 'Note: Some tables not found in renotimeline_schema: %', missing_tables;
  ELSE
    RAISE NOTICE 'All core tables verified in renotimeline_schema';
  END IF;
END $$;
