import { supabase } from '../lib/supabase'
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react' // Using Mail as placeholder for Google if needed, or just text

// Helper for Social Login
const handleLogin = async (provider) => {
    // Construct the redirect URL dynamically based on the current environment and base path
    const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();

    const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: redirectTo,
        }
    })
    if (error) console.error('Login error:', error.message)
}

export default function Login() {
    return (
        <div className="app-container" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h1>Sign In</h1>
            <p>Login to track your progress, review mistakes, and manage your study plan.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button className="action-btn" onClick={() => handleLogin('google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    Google
                </button>

                <button className="action-btn" onClick={() => handleLogin('facebook')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Facebook size={20} /> Facebook
                </button>

                <button className="action-btn" onClick={() => handleLogin('twitter')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Twitter size={20} /> X (Twitter)
                </button>

                {/* Note: Instagram login usually requires business account setup or specific scopes, using standard provider string */}
                <button className="action-btn" onClick={() => handleLogin('instagram')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Instagram size={20} /> Instagram
                </button>
            </div>
        </div>
    )
}
