import { useState } from 'react'
import questionsData from './questions.json'

function App() {
  const [questions] = useState(questionsData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSelections, setUserSelections] = useState({}); // { index: { selectedIndices: [], isAnswered: bool, isCorrect: bool } }

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

  const handleSubmit = () => {
    if (currentSelection.selectedIndices.length === 0) {
      alert("Please select at least one option.");
      return;
    }

    // Check Logic
    // 1. Get correct keys
    const correctKeys = currentQuestion.correctAnswer.split(/[,，\s]+/).map(s => s.trim().toUpperCase()[0]);

    // 2. Get user keys
    // Assumes options are plain strings like "A. ...", "B. ..."
    const userKeys = currentSelection.selectedIndices.map(i => {
      const optionText = currentQuestion.options[i];
      return optionText.trim().charAt(0).toUpperCase();
    });

    // 3. Compare
    const isCorrect = (correctKeys.length === userKeys.length) &&
      correctKeys.every(k => userKeys.includes(k));

    setUserSelections(prev => ({
      ...prev,
      [currentIndex]: {
        ...currentSelection,
        isAnswered: true,
        isCorrect: isCorrect
      }
    }));
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  function checkIsMultiSelect(answerString) {
    if (!answerString) return false;
    if (answerString.includes(',') || answerString.includes('，')) return true;
    return false;
  }

  return (
    <div className="app-container">
      <header>
        <h1>AI-900 Practice</h1>
        <div id="question-counter">Question {currentIndex + 1} / {questions.length}</div>
      </header>

      <div id="quiz-container">
        <div className="question-card">
          <div className="question-text">
            <span className="question-topic">Topic {currentQuestion.topic}</span>
            {currentQuestion.question}
          </div>

          <div className="options-container">
            {currentQuestion.options && currentQuestion.options.map((option, idx) => {
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

          {currentSelection.isAnswered && (
            <div className={`feedback ${currentSelection.isCorrect ? 'correct' : 'incorrect'}`}>
              <strong>{currentSelection.isCorrect ? '回答正确！' : '回答错误。'}</strong>
              <div className="explanation">
                <strong>解析：</strong><br />
                {currentQuestion.explanation || 'No explanation available.'}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer>
        <button
          className="nav-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Previous
        </button>

        {!currentSelection.isAnswered ? (
          <button
            className="action-btn"
            onClick={handleSubmit}
            disabled={currentSelection.isAnswered}
          >
            Submit Answer
          </button>
        ) : (
          <button className="action-btn" disabled>
            已提交
          </button>
        )}

        <button
          className="nav-btn"
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
        >
          Next
        </button>
      </footer>
    </div>
  )
}

export default App
