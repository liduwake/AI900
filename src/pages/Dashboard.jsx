import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard({ session }) {
    const [mistakeCount, setMistakeCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchStats() {
            if (!session?.user) return;

            const { count, error } = await supabase
                .from('mistakes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id);

            if (!error) {
                setMistakeCount(count);
            }
            setLoading(false);
        }
        fetchStats();
    }, [session]);

    return (
        <div className="app-container">
            <header>
                <h1>User Dashboard</h1>
            </header>

            <div style={{ textAlign: 'left' }}>
                <p>Welcome, {session?.user?.email}</p>

                <div className="card" style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', marginTop: '20px' }}>
                    <h2>Statistics</h2>
                    {loading ? <p>Loading...</p> : (
                        <p>Total Mistakes Recorded: <strong>{mistakeCount}</strong></p>
                    )}
                    <br />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="action-btn" onClick={() => navigate('/')}>Resume Standard Quiz</button>
                        <button className="action-btn" style={{ backgroundColor: '#d9534f' }} onClick={() => navigate('/', { state: { mode: 'mistakes' } })}>Review Mistakes</button>
                    </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <button className="nav-btn" onClick={() => supabase.auth.signOut()}>Sign Out</button>
                </div>
            </div>
        </div>
    )
}
