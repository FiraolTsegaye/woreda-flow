import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rbubgpvcbdhikhvlchwe.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidWJncHZjYmRoaWtodmxjaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTQzMTQsImV4cCI6MjA4OTQ5MDMxNH0.XO7G72hOdWEgUptcG-ZV9mmhSttuOzM5Tjih767cAGc"

export const supabase = createClient(supabaseUrl, supabaseKey)
