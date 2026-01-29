import { useState, useEffect } from 'react'
import questionsData from '../questions.json'
import { supabase } from '../lib/supabase'
import { syncManager } from '../lib/sync'

export default function Quiz({ session }) {
    const [questions] = useState(questionsData);

    // Initialize state from local storage or defaults
    const [currentIndex, setCurrentIndex] = useState(() => {
        const savedIndex = localStorage.getItem('quiz_currentIndex');
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    });

    const [userSelections, setUserSelections] = useState(() => {
        const savedSelections = localStorage.getItem('quiz_userSelections');
        return savedSelections ? JSON.parse(savedSelections) : {};
    });

    // Save to local storage whenever state changes
    useEffect(() => {
        localStorage.setItem('quiz_currentIndex', currentIndex);
    }, [currentIndex]);

    useEffect(() => {
        localStorage.setItem('quiz_userSelections', JSON.stringify(userSelections));
    }, [userSelections]);

    if (questions.length === 0) {
        return <div className="app-container">Loading questions...</div>;
    }

    const currentQuestion = questions[currentIndex];
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

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
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
                    <div id="question-counter">Question {currentIndex + 1} / {questions.length}</div>
                </div>
                <button className="nav-btn" style={{ fontSize: '0.8em', padding: '5px 10px' }} onClick={() => supabase.auth.signOut()}>Sign Out</button>
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
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: 'none', border: 'none', padding: 0 }}>{currentQuestion.correctAnswer}</pre>
                            </div>
                            <div className="explanation" style={{ marginTop: '15px' }}>
                                <strong>Explanation:</strong><br />
                                {currentQuestion.explanation || 'No explanation available.'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <footer>
                <button className="nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>Previous</button>

                {/* Only show Submit if it's a normal question and not yet answered */}
                {currentQuestion.options && currentQuestion.options.length > 0 && !currentSelection.isAnswered && (
                    <button className="action-btn" onClick={handleSubmit}>Submit Answer</button>
                )}

                {/* For Study Mode or Answered Questions, show Next (already there) */}
                {/* Visual spacer if submit is hidden */}
                {(currentSelection.isAnswered || !currentQuestion.options || currentQuestion.options.length === 0) && <div style={{ width: '10px' }}></div>}

                <button className="nav-btn" onClick={handleNext} disabled={currentIndex === questions.length - 1}>Next</button>
            </footer>
        </div>
    )
}
