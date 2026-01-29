import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Quiz from './pages/Quiz'
import Dashboard from './pages/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. Monitor Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Track Site Visits (Debounced: Max 1 per day)
  useEffect(() => {
    const logVisit = async () => {
      if (!session?.user?.id) return;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const storageKey = `visit_log_${session.user.id}`;
      const lastLog = localStorage.getItem(storageKey);

      // Optimization: If already logged today, SKIP network request entirely
      if (lastLog === today) {
        console.log('[Analytics] Visit already logged for today. Skipping.');
        return;
      }

      console.log('[Analytics] Logging daily visit...');
      const { error } = await supabase.from('daily_visits').insert({
        user_id: session.user.id,
        visit_date: today
      });

      // If success or "duplicate key" violation (meaning DB already has it), update local storage
      // Error code 23505 is PostgreSQL unique_violation
      if (!error || error.code === '23505') {
        localStorage.setItem(storageKey, today);
      } else {
        console.error('[Analytics] Failed to log visit:', error);
      }
    };

    logVisit();
  }, [session]);

  if (loading) {
    return <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <nav style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '10px' }}>
        {session && <Link to="/dashboard" style={{ textDecoration: 'none', color: '#0078D4' }}>Dashboard</Link>}
        {session && <Link to="/" style={{ textDecoration: 'none', color: '#0078D4' }}>Quiz</Link>}
      </nav>

      <Routes>
        <Route
          path="/"
          element={session ? <Quiz session={session} /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/dashboard"
          element={session ? <Dashboard session={session} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
