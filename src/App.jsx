import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Quiz from './pages/Quiz'
import OtherQuiz from './pages/OtherQuiz'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Analytics: Log daily visit (Debounced)
  useEffect(() => {
    if (session?.user) {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `daily_visit_${session.user.id}`;
      const lastLog = localStorage.getItem(storageKey);

      if (lastLog === today) {
        console.log('[Analytics] Visit already logged for today. Skipping.');
        return;
      }

      // Optimistic local update
      localStorage.setItem(storageKey, today);

      // Fire and forget (low priority)
      supabase
        .from('daily_visits')
        .insert({ user_id: session.user.id })
        .then(({ error }) => {
          if (error) {
            console.error('[Analytics] Failed to log visit:', error);
            // Optional: Revert local storage if strict, but for analytics it's fine to skip
          } else {
            console.log('[Analytics] Visit logged successfully.');
          }
        });
    }
  }, [session]);

  if (loading) {
    return <div className="app-container">Loading...</div>
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route path="/" element={session ? <Quiz session={session} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
        <Route path="/other" element={session ? <OtherQuiz /> : <Navigate to="/login" />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
