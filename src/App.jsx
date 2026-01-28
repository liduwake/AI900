import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Quiz from './pages/Quiz'
import Dashboard from './pages/Dashboard'

function App() {
  const [session, setSession] = useState(null)

  // 1. Monitor Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Track Site Visits (Simple Analytics)
  useEffect(() => {
    const logVisit = async () => {
      await supabase.from('site_visits').insert({
        page_path: window.location.pathname,
        user_id: session?.user?.id || null // Trace user if logged in, else null
      });
    };

    // Log once per session/load
    logVisit();
  }, [session]); // Re-log if session changes (e.g. login)

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
