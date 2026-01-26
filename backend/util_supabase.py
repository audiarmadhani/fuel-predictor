import os
from supabase import create_client

SUPABASE_URL = os.getenv("https://ogtqwxjoztohigpknjro.supabase.co")
SUPABASE_KEY = os.getenv("sb_secret_63jrFib062H-6pFrJ4aYwQ_FMb5snwz")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)