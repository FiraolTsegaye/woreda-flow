
Goal: Fix the SQL syntax error and get your queue app working again.

What went wrong:
- You are still in the Policy Builder.
- The `USING (...)` field only accepts a boolean expression (like `true`), not full SQL statements.
- `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` must be run in the SQL Editor, not inside a policy.

Plan (do exactly this):
1) Open Supabase → SQL Editor (not Table Policy form).
2) Run this as a standalone statement:
```sql
ALTER TABLE public.queues DISABLE ROW LEVEL SECURITY;
```
3) Do not create a policy called “Disable RLS” — that is invalid for this purpose.
4) If you previously created broken/partial policies, you can ignore them while RLS is disabled.

Verification plan:
1) Return to your app.
2) Test end-to-end:
   - Join queue from Services
   - Check “My Queue”
   - Serve next from Admin
3) If it still fails, copy the exact new error and I’ll give the next precise fix.

Technical details:
- Policy Builder fields:
  - `USING`: condition per row (e.g. `true`)
  - `WITH CHECK`: allowed values on insert/update (e.g. `true`)
- Schema command:
  - `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` is table-level config, only valid as top-level SQL.
