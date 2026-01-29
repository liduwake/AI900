import { useState, useEffect } from 'react';
import questionsData from '../questions.json';
import { useNavigate } from 'react-router-dom';

export default function OtherQuiz() {
    const [excludedIds, setExcludedIds] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const savedExcludes = localStorage.getItem('quiz_excludedIndices');
        if (savedExcludes) {
            // Sort indices numerically
            setExcludedIds(JSON.parse(savedExcludes).sort((a, b) => a - b));
        }
    }, []);

    const handleRestore = (indexToRestore) => {
        const newExcludes = excludedIds.filter(id => id !== indexToRestore);
        setExcludedIds(newExcludes);
        localStorage.setItem('quiz_excludedIndices', JSON.stringify(newExcludes));
    };

    const handleClearAll = () => {
        if (confirm('Are you sure you want to clear all excluded questions? They will return to the main quiz.')) {
            setExcludedIds([]);
            localStorage.removeItem('quiz_excludedIndices');
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1>Other Quiz Bank</h1>
                <button className="nav-btn" onClick={() => navigate('/')}>Back to Main Quiz</button>
            </header>

            <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <p>This bank contains questions you removed from the main quiz.</p>

                {excludedIds.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        No questions in this bank.
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <button className="nav-btn" onClick={handleClearAll} style={{ fontSize: '0.9em', color: '#a94442' }}>
                                Restore All to Main Quiz
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '10px' }}>
                            {excludedIds.map(index => {
                                const q = questionsData[index];
                                return (
                                    <div key={index} style={{
                                        padding: '15px',
                                        border: '1px solid #eee',
                                        borderRadius: '5px',
                                        backgroundColor: '#fafafa',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <strong>Question {index + 1}</strong> (Topic {q.topic})
                                            <div style={{ fontSize: '0.9em', color: '#555', marginTop: '5px' }}>
                                                {q.question.substring(0, 60)}...
                                            </div>
                                        </div>
                                        <button
                                            className="nav-btn"
                                            style={{ fontSize: '0.8em' }}
                                            onClick={() => handleRestore(index)}
                                        >
                                            Restore
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
