

## ownership der Tabellen ändern:
```
DO $$
DECLARE
    obj RECORD;
BEGIN
    FOR obj IN
        SELECT 'table' AS typ, tablename AS name FROM pg_tables WHERE schemaname='public'
        UNION ALL
        SELECT 'sequence', sequencename FROM pg_sequences WHERE schemaname='public'
        UNION ALL
        SELECT 'view', table_name FROM information_schema.views WHERE table_schema='public'
    LOOP
        EXECUTE format(
            CASE obj.typ
                WHEN 'table' THEN 'ALTER TABLE public.%I OWNER TO hzd_website_test;'
                WHEN 'sequence' THEN 'ALTER SEQUENCE public.%I OWNER TO hzd_website_test;'
                WHEN 'view' THEN 'ALTER VIEW public.%I OWNER TO hzd_website_test;'
            END,
            obj.name
        );
    END LOOP;
END$$;
```
