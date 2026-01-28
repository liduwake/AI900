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
    let userSelections = {}; // Store selections: { questionId: { selection: [], isCorrect: null } }
    let currentQuestionIndex = 0;

    // --- Main Function ---
    function initialize() {
        console.log("Initializing AI-900 practice tool...");
        // The questions are now loaded from the global 'questionsData' variable
        allQuestions = typeof questionsData !== 'undefined' ? questionsData : [];
        
        if (allQuestions.length > 0) {
            totalQuestions.textContent = allQuestions.length;
            renderQuestion(currentQuestionIndex);
            setupButtonEvents();
        } else {
            quizContainer.innerHTML = "<p>无法加载题目。请确保 'questionsData' 变量存在且格式正确。</p>";
            console.error("Questions data is missing or empty.");
        }
    }

    // --- Render Functions ---
    function renderQuestion(index) {
        const question = allQuestions[index];
        if (!question) return;

        currentQuestionIndex = index;
        questionCounter.textContent = index + 1;
        
        let optionsHtml = '';
        const inputType = question.type === 'multiple-choice' ? 'checkbox' : 'radio';

        optionsHtml = question.options.map((option) => `
            <label class="option" data-value="${option}">
                <input type="${inputType}" name="option" value="${option}" style="display: none;">
                ${option}
            </label>
        `).join('');

        quizContainer.innerHTML = `
            <div class="question-card" data-question-id="${question.id}">
                <p class="question-text">${question.question}</p>
                <div class="options-container">
                    ${optionsHtml}
                </div>
                <div class="feedback-container"></div>
            </div>
        `;

        // Restore previous selections and feedback if they exist
        restoreSelection();
        
        document.querySelectorAll('.option').forEach(optionEl => {
            optionEl.addEventListener('click', () => handleOptionSelect(optionEl));
        });
        
        updateButtonStates();
    }
    
    function restoreSelection() {
        const question = allQuestions[currentQuestionIndex];
        const selectionInfo = userSelections[question.id];

        if (selectionInfo) {
            document.querySelectorAll('.option').forEach(label => {
                const inputValue = label.dataset.value;
                if (selectionInfo.selection.includes(inputValue)) {
                    label.classList.add('selected');
                    label.querySelector('input').checked = true;
                }
            });
            
            if(selectionInfo.isCorrect !== null) { // If answer was submitted
                displayFeedback(selectionInfo.isCorrect, question.explanation);
                document.querySelectorAll('.option').forEach(label => label.style.pointerEvents = 'none');
            }
        }
    }
    
    function displayFeedback(isCorrect, explanation) {
        const feedbackContainer = document.querySelector('.feedback-container');
        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        const feedbackText = isCorrect ? '回答正确！' : '回答错误。';
        
        feedbackContainer.innerHTML = `
            <div class="feedback ${feedbackClass}">
                <p><strong>${feedbackText}</strong></p>
                <p class="explanation">${explanation}</p>
            </div>
        `;
    }

    // --- Event Handlers ---
    function handleOptionSelect(selectedLabel) {
        const question = allQuestions[currentQuestionIndex];
        const input = selectedLabel.querySelector('input');

        if (question.type === 'single-choice' || question.type === 'true-false') {
            document.querySelectorAll('.option').forEach(label => label.classList.remove('selected'));
            selectedLabel.classList.add('selected');
            // Uncheck all radios and check the selected one
            document.querySelectorAll(`input[name="option"]`).forEach(radio => radio.checked = false);
            input.checked = true;
        } else { // multiple-choice
            selectedLabel.classList.toggle('selected');
            input.checked = selectedLabel.classList.contains('selected');
        }
    }

    function setupButtonEvents() {
        nextBtn.addEventListener('click', () => {
            if (currentQuestionIndex < allQuestions.length - 1) {
                renderQuestion(currentQuestionIndex + 1);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                renderQuestion(currentQuestionIndex - 1);
            }
        });
        
        submitBtn.addEventListener('click', checkAnswer);
    }
    
    function updateButtonStates() {
        prevBtn.disabled = currentQuestionIndex === 0;
        nextBtn.disabled = currentQuestionIndex === allQuestions.length - 1;
        const question = allQuestions[currentQuestionIndex];
        const selectionInfo = userSelections[question.id];
        submitBtn.disabled = selectionInfo && selectionInfo.isCorrect !== null;
    }
    
    function checkAnswer() {
        const question = allQuestions[currentQuestionIndex];
        const selectedOptions = Array.from(document.querySelectorAll('.option.selected'))
                                    .map(label => label.dataset.value);

        let isCorrect = false;
        if (question.type === 'single-choice' || question.type === 'true-false') {
            isCorrect = selectedOptions.length === 1 && selectedOptions[0] === question.answer;
        } else if (question.type === 'multiple-choice') {
            const answerSet = new Set(question.answer);
            const selectionSet = new Set(selectedOptions);
            isCorrect = answerSet.size === selectionSet.size && [...answerSet].every(item => selectionSet.has(item));
        }

        userSelections[question.id] = { selection: selectedOptions, isCorrect: isCorrect };
        displayFeedback(isCorrect, question.explanation);
        
        // Disable options after submission
        document.querySelectorAll('.option').forEach(label => {
            label.style.pointerEvents = 'none';
        });
        submitBtn.disabled = true;
    }

    // --- Start the App ---
    initialize();
});
