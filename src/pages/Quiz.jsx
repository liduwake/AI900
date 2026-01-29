import { useState, useEffect } from 'react'
import questionsData from '../questions.json'
import { supabase } from '../lib/supabase'
import { syncManager } from '../lib/sync'
import { useNavigate, useLocation } from 'react-router-dom'

// Mode: 'standard' or 'mistakes'
const location = useLocation();
const mode = location.state?.mode || 'standard';
const [mistakeIndices, setMistakeIndices] = useState([]);
const [isLoadingMistakes, setIsLoadingMistakes] = useState(mode === 'mistakes');

// Fetch mistakes if in mistake mode
useEffect(() => {
    if (mode === 'mistakes' && session?.user) {
        async function fetchMistakes() {
            const { data, error } = await supabase
                .from('mistakes')
                .select('question_index')
                .eq('user_id', session.user.id);

            if (!error && data) {
                // Extract unique indices and look for valid ones (not deleted from json)
                const indices = [...new Set(data.map(d => d.question_index))].sort((a, b) => a - b);
                setMistakeIndices(indices);
            }
            setIsLoadingMistakes(false);
        }
        fetchMistakes();
    }
}, [mode, session]);

// Initialize currentIndex based on mode
const [currentIndex, setCurrentIndex] = useState(() => {
    if (mode === 'mistakes') return 0; // Temp placeholder, will effect-update later
    const savedIndex = localStorage.getItem('quiz_currentIndex');
    return savedIndex ? parseInt(savedIndex, 10) : 0;
});

// EFFECT: When mistake indices load, snap to the first mistake
useEffect(() => {
    if (mode === 'mistakes' && !isLoadingMistakes && mistakeIndices.length > 0) {
        // Check if current index is already a mistake (rare), else snap to first
        if (!mistakeIndices.includes(currentIndex)) {
            setCurrentIndex(mistakeIndices[0]);
        }
    }
}, [mode, isLoadingMistakes, mistakeIndices]);

const [userSelections, setUserSelections] = useState(() => {
    const savedSelections = localStorage.getItem('quiz_userSelections');
    return savedSelections ? JSON.parse(savedSelections) : {};
});

// Save state (only for Standard Mode)
useEffect(() => {
    if (mode === 'standard') {
        localStorage.setItem('quiz_currentIndex', currentIndex);
    }
}, [currentIndex, mode]);

useEffect(() => {
    localStorage.setItem('quiz_userSelections', JSON.stringify(userSelections));
}, [userSelections]);

// Navigation constraints
useEffect(() => {
    if (mode === 'standard') {
        const excludedJson = localStorage.getItem('quiz_excludedIndices');
        const excludedIndices = excludedJson ? JSON.parse(excludedJson) : [];
        if (excludedIndices.includes(currentIndex)) {
            if (currentIndex < questionsData.length - 1) {
                setCurrentIndex(c => c + 1);
            }
        }
    }
}, [currentIndex, mode]);

const currentQuestion = questionsData[currentIndex];

if (!currentQuestion) {
    return <div className="app-container">Loading or No Questions Remaining...</div>;
}

const currentSelection = userSelections[currentIndex] || { selectedIndices: [], isAnswered: false, isCorrect: null };

const handleOptionClick = (optionIndex) => {
    if (currentSelection.isAnswered) return;

    const isMultiSelect = checkIsMultiSelect(currentQuestion.correctAnswer);
    let newSelectedIndices;

    if (isMultiSelect) {
        if (currentSelection.selectedIndices.includes(optionIndex)) {
            newSelectedIndices = currentSelection.selectedIndices.filter(i => i !== optionIndex);
        } else {
            newSelectedIndices = [...currentSelection.selectedIndices, optionIndex];
        }
    } else {
        newSelectedIndices = [optionIndex];
    }

    setUserSelections(prev => ({
        ...prev,
        [currentIndex]: {
            ...currentSelection,
            selectedIndices: newSelectedIndices
        }
    }));
};

const handleSubmit = async () => {
    if (currentSelection.selectedIndices.length === 0) {
        alert("Please select at least one option.");
        return;
    }

    let correctKeys;
    const answer = currentQuestion.correctAnswer.trim();

    // Handle compact "ABC" format for multiple choice
    if (/^[A-Z]+$/.test(answer) && answer.length > 1) {
        correctKeys = answer.split('');
    } else {
        // Handle "A", "A, B", or fallback
        correctKeys = answer.split(/[,，\s]+/).map(s => s.trim().toUpperCase()[0]);
    }

    // Get user keys
    const userKeys = currentSelection.selectedIndices.map(i => {
        const optionText = currentQuestion.options[i];
        return optionText.trim().charAt(0).toUpperCase();
    });

    const isCorrect = (correctKeys.length === userKeys.length) &&
        correctKeys.every(k => userKeys.includes(k));

    // Update Local State
    setUserSelections(prev => ({
        ...prev,
        [currentIndex]: {
            ...currentSelection,
            isAnswered: true,
            isCorrect: isCorrect
        }
    }));

    // Log Mistake (Refactored for Offline/Batching)
    if (!isCorrect && session?.user) {
        const wrongAnswerText = currentSelection.selectedIndices.map(i => currentQuestion.options[i]).join('; ');

        syncManager.addMistake({
            user_id: session.user.id,
            question_index: currentIndex,
            question_text: currentQuestion.question.substring(0, 100) + "...",
            wrong_answer: wrongAnswerText
        });
    }
};

const handleExclude = () => {
    if (confirm('Move this question to "Other Quiz" bank? It will be hidden from this view.')) {
        const excludedJson = localStorage.getItem('quiz_excludedIndices');
        const excludedIndices = excludedJson ? JSON.parse(excludedJson) : [];
        const newExcludes = [...excludedIndices, currentIndex];
        localStorage.setItem('quiz_excludedIndices', JSON.stringify(newExcludes));

        // Move to next question automatically
        if (currentIndex < questionsData.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // If last question, just reload to trigger effect
            window.location.reload();
        }
    }
}

const handlePrev = () => {
    // Find previous non-excluded index
    let newIndex = currentIndex - 1;
    const excludedJson = localStorage.getItem('quiz_excludedIndices');
    const excludedIndices = excludedJson ? JSON.parse(excludedJson) : [];

    while (newIndex >= 0 && excludedIndices.includes(newIndex)) {
        newIndex--;
    }

    if (newIndex >= 0) setCurrentIndex(newIndex);
};

const handleNext = () => {
    // Find next non-excluded index
    let newIndex = currentIndex + 1;
    const excludedJson = localStorage.getItem('quiz_excludedIndices');
    const excludedIndices = excludedJson ? JSON.parse(excludedJson) : [];

    while (newIndex < questionsData.length && excludedIndices.includes(newIndex)) {
        newIndex++;
    }

    if (newIndex < questionsData.length) setCurrentIndex(newIndex);
};

function checkIsMultiSelect(answerString) {
    if (!answerString) return false;
    // Format: "A,B" or "A, B"
    if (answerString.includes(',') || answerString.includes('，')) return true;
    // Format: "ABC" (Compact keys, strictly uppercase letters)
    if (/^[A-Z]+$/.test(answerString) && answerString.length > 1) return true;

    return false;
}

return (
    <div className="app-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1>AI-900 Practice</h1>
                <div id="question-counter">
                    Question {currentIndex + 1} / {questionsData.length}
                    <span style={{ marginLeft: '10px', fontSize: '0.8em' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/other'); }} style={{ color: '#666' }}>
                            (View Other/Excluded)
                        </a>
                        {' | '}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} style={{ color: '#666' }}>
                            (Mistakes)
                        </a>
                    </span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="nav-btn" style={{ fontSize: '0.8em', padding: '5px 10px' }} onClick={handleExclude} title="Remove from this bank">
                    Move to Other
                </button>
                <button className="nav-btn" style={{ fontSize: '0.8em', padding: '5px 10px' }} onClick={() => supabase.auth.signOut()}>Sign Out</button>
            </div>
        </header>

        <div id="quiz-container">
            <div className="question-card">
                <div className="question-text">
                    <span className="question-topic">Topic {currentQuestion.topic}</span>
                    {currentQuestion.question}
                </div>

                {/* RENDER OPTIONS OR STUDY MODE */}
                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    <div className="options-container">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = currentSelection.selectedIndices.includes(idx);
                            const isAnswered = currentSelection.isAnswered;
                            let className = "option";

                            if (isSelected) className += " selected";
                            if (isAnswered) {
                                className += " disabled";
                                if (isSelected) {
                                    className += currentSelection.isCorrect ? " correct" : " incorrect";
                                }
                            }

                            return (
                                <div
                                    key={idx}
                                    className={className}
                                    onClick={() => handleOptionClick(idx)}
                                >
                                    {option}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="study-mode" style={{ margin: '20px 0', padding: '15px', background: '#f8f9fa', border: '1px dashed #ccc', borderRadius: '8px' }}>
                        <p><em>This question involves visual content (Hotspot/Drag & Drop) not available in text format.</em></p>
                        {!currentSelection.isAnswered ? (
                            <button className="action-btn" onClick={() => {
                                // Mark as answered (correct by default for study mode to not engage mistake logic)
                                setUserSelections(prev => ({
                                    ...prev,
                                    [currentIndex]: {
                                        selectedIndices: [],
                                        isAnswered: true,
                                        isCorrect: true // Don't log as mistake since they can't answer it
                                    }
                                }));
                            }}>
                                Reveal Answer
                            </button>
                        ) : (
                            <p><strong>Answer Revealed</strong></p>
                        )}
                    </div>
                )}

                {currentSelection.isAnswered && (
                    <div className={`feedback ${currentSelection.isCorrect ? 'correct' : 'natural'}`} style={{ marginTop: '20px' }}>
                        <div style={{ color: '#2c3e50' }}>
                            <strong>Correct Answer:</strong>
                            {/* Only show the simple Correct Answer line if it's SHORT (likely a Letter A/B/C) */}
                            {/* If it's long (Study Mode), we merge it into explanation below for better reading */}
                            {currentQuestion.correctAnswer.length < 10 && (
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: 'none', border: 'none', padding: 0 }}>{currentQuestion.correctAnswer}</pre>
                            )}
                        </div>
                        <div className="explanation" style={{ marginTop: '15px' }}>
                            <strong>Explanation:</strong><br />
                            {currentQuestion.correctAnswer.length >= 10 && (
                                <div style={{ marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
                                    {currentQuestion.correctAnswer}
                                </div>
                            )}
                            {currentQuestion.explanation || ''}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <footer>
            <div className="footer-content">
                <button className="nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>Previous</button>

                {/* Only show Submit if it's a normal question and not yet answered */}
                {currentQuestion.options && currentQuestion.options.length > 0 && !currentSelection.isAnswered && (
                    <button className="action-btn" onClick={handleSubmit}>Submit Answer</button>
                )}

                {/* Visual spacer if submit is hidden */}
                {(currentSelection.isAnswered || !currentQuestion.options || currentQuestion.options.length === 0) && <div style={{ width: '10px' }}></div>}

                <button className="nav-btn" onClick={handleNext} disabled={currentIndex === questionsData.length - 1}>Next</button>
            </div>
        </footer>
    </div>
)
}
