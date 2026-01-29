import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Anon Key")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Listen for auth changes and handle redirect on login
supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Auth]', event, session)

    if (event === 'SIGNED_IN' && session) {
        // Redirect to home if sitting on login page with hash or just generally to clear hash
        // Using window.location.href forces a clear reload which ensures state is picked up
        // Only redirect if we are specifically on the login page or have a hash to clear?
        // User instruction was specific:
        if (window.location.hash && window.location.hash.includes('access_token')) {
            window.location.href = import.meta.env.BASE_URL
        }
    }
})

// Debug helper
window.__sb = supabase
