document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizContainer = document.getElementById('quiz-container');
    const questionCounter = document.getElementById('question-counter');
    const totalQuestions = document.getElementById('total-questions');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    // --- App State ---
    let allQuestions = [];
    // Storage format: { questionIndex: { selectedIndices: [], isCorrect: boolean/null, isAnswered: boolean } }
    let userSelections = {}; 
    let currentIndex = 0;

    // --- Initialization ---
    function initialize() {
        console.log("Initializing AI-900 practice tool...");
        
        // 1. Fetch JSON data
        fetch('questions.json')
            .then(response => {
                if (!response.ok) throw new Error("Failed to load questions.json");
                return response.json();
            })
            .then(data => {
                allQuestions = data;
                if (allQuestions.length > 0) {
                    totalQuestions.textContent = allQuestions.length;
                    renderQuestion(currentIndex);
                    setupButtonEvents();
                } else {
                    quizContainer.innerHTML = "<p>Question bank is empty.</p>";
                }
            })
            .catch(err => {
                quizContainer.innerHTML = `<p style="color:red">Error: ${err.message}<br>Please ensure python -m http.server is running.</p>`;
                console.error(err);
            });
    }

    // --- Rendering Functions ---
    function renderQuestion(index) {
        const question = allQuestions[index];
        if (!question) return;

        currentIndex = index;
        questionCounter.textContent = index + 1;

        // Render HTML (Adapted for the div structure in style.css)
        let optionsHtml = '';
        if (question.options && question.options.length > 0) {
            optionsHtml = question.options.map((option, i) => `
                <div class="option" data-index="${i}">
                    ${option}
                </div>
            `).join('');
        } else {
            optionsHtml = `<p style="color:#666; font-style:italic">This question type (${question.type}) does not support interactive options. Please view the answer directly.</p>`;
        }

        quizContainer.innerHTML = `
            <div class="question-card">
                <div class="question-text">
                    <span style="font-size: 0.8em; color: #666; display:block; margin-bottom:5px;">Topic ${question.topic}</span>
                    ${question.question}
                </div>
                <div class="options-container">
                    ${optionsHtml}
                </div>
                <div class="feedback-container"></div>
            </div>
        `;

        // Restore previous selection state
        restoreSelection(index);
        
        // Bind click events if not already answered
        if (!userSelections[index]?.isAnswered) {
            document.querySelectorAll('.option').forEach(optionEl => {
                optionEl.addEventListener('click', () => handleOptionSelect(optionEl, index));
            });
        }
        
        updateButtonStates();
    }
    
    // --- State Restoration ---
    function restoreSelection(index) {
        const state = userSelections[index];
        if (!state) return;

        const options = document.querySelectorAll('.option');
        
        // Restore selection highlighting
        state.selectedIndices.forEach(i => {
            if(options[i]) options[i].classList.add('selected');
        });

        // If submitted, show feedback and lock options
        if (state.isAnswered) {
            displayFeedback(state.isCorrect, allQuestions[index].explanation);
            
            // Lock options and apply colors based on correctness
            options.forEach((opt, i) => {
                opt.style.pointerEvents = 'none'; // Disable clicks
                
                // Visual aid: Green if selected & correct, Red if selected & wrong
                if (state.selectedIndices.includes(i)) {
                    if (state.isCorrect) opt.classList.add('correct'); 
                    else opt.classList.add('incorrect');
                }
            });
            submitBtn.textContent = "已提交"; // "Submitted"
            submitBtn.disabled = true;
        }
    }
    
    function displayFeedback(isCorrect, explanation) {
        const feedbackContainer = document.querySelector('.feedback-container');
        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        const feedbackText = isCorrect ? '回答正确！' : '回答错误。'; // "Correct!" : "Wrong."
        
        // Use classes defined in style.css (.feedback)
        feedbackContainer.innerHTML = `
            <div class="feedback ${feedbackClass}">
                <strong>${feedbackText}</strong>
                <div class="explanation">
                    <strong>解析：</strong><br>${explanation || 'No explanation available.'}
                </div>
            </div>
        `;
    }

    // --- Event Handling ---
    function handleOptionSelect(selectedEl, index) {
        const question = allQuestions[index];
        const isMultiSelect = checkIsMultiSelect(question.correctAnswer);
        
        if (!isMultiSelect) {
            // Single choice logic: clear other selections
            document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
            selectedEl.classList.add('selected');
        } else {
            // Multi choice logic: toggle selection
            selectedEl.classList.toggle('selected');
        }

        // Temporarily save current selection state (for navigation memory before submission)
        updateCurrentSelectionState(index, false);
    }

    // Helper: Update state in memory
    function updateCurrentSelectionState(index, isSubmitted, isCorrectResult = null) {
        const selectedEls = document.querySelectorAll('.option.selected');
        const selectedIndices = Array.from(selectedEls).map(el => parseInt(el.dataset.index));

        userSelections[index] = {
            selectedIndices: selectedIndices,
            isAnswered: isSubmitted,
            isCorrect: isCorrectResult
        };
    }

    function setupButtonEvents() {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < allQuestions.length - 1) {
                renderQuestion(currentIndex + 1);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                renderQuestion(currentIndex - 1);
            }
        });
        
        submitBtn.addEventListener('click', checkAnswer);
    }
    
    function updateButtonStates() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === allQuestions.length - 1;
        
        // If answered, disable the submit button
        if (userSelections[currentIndex]?.isAnswered) {
            submitBtn.disabled = true;
            submitBtn.textContent = "已提交"; // "Submitted"
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = "提交答案"; // "Submit Answer"
        }
    }

    // --- Core Logic: Check Answer ---
    function checkAnswer() {
        const question = allQuestions[currentIndex];
        const selectedEls = document.querySelectorAll('.option.selected');
        
        if (selectedEls.length === 0) {
            alert("Please select at least one option.");
            return;
        }

        // 1. Get correct answer keys (e.g., "A, C" -> ['A', 'C'])
        // Clean string, remove spaces, split by comma
        const correctKeys = question.correctAnswer.split(/[,，\s]+/).map(s => s.trim().toUpperCase()[0]);

        // 2. Get user selected keys
        const userKeys = [];
        selectedEls.forEach(el => {
            // Assumes option text starts with "A. Description...", taking the first char
            const text = el.innerText.trim();
            if (text) userKeys.push(text.charAt(0).toUpperCase());
        });

        // 3. Compare sets
        // Logic: Length must match, and every user key must exist in correct keys
        const isCorrect = (correctKeys.length === userKeys.length) && 
                          correctKeys.every(k => userKeys.includes(k));

        // 4. Update state and show feedback
        updateCurrentSelectionState(currentIndex, true, isCorrect);
        
        displayFeedback(isCorrect, question.explanation);
        
        // Disable interactions
        document.querySelectorAll('.option').forEach(el => el.style.pointerEvents = 'none');
        updateButtonStates();
    }

    // Helper: Determine if question is multi-select
    // Heuristic: If answer string contains a comma, treat as multi-select
    function checkIsMultiSelect(answerString) {
        if (!answerString) return false;
        if (answerString.includes(',') || answerString.includes('，')) return true;
        return false;
    }

    // --- Start App ---
    initialize();
});