const levelSelect = document.getElementById('level-select');
const classSelect = document.getElementById('class-select');
const subjectSelect = document.getElementById('subject-select');
const startBtn = document.getElementById('start-btn');
const welcomeContainer = document.getElementById('welcome-container');
const quizContainer = document.getElementById('quiz-container');
const quizTitle = document.getElementById('quiz-title');
const questionText = document.getElementById('question-text');
const optionsList = document.getElementById('options-list');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const resultsContainer = document.getElementById('results-container');
const scoreOutput = document.getElementById('score-output');
const answersReview = document.getElementById('answers-review');
const restartBtn = document.getElementById('restart-btn');
const timerDisplay = document.getElementById('timer');
const scoreValue = document.getElementById('score-value');
const timerContainer = document.querySelector('.timer-container');

let questions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let timePerQuestion = 60;
let enableTimer = true;
let shuffleQuestions = true;

// Class options mapping
const classOptions = {
    primary: ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6"],
    jhs: ["Basic 7 (JHS 1)", "Basic 8 (JHS 2)", "Basic 9 (JHS 3)"],
    shs: ["Basic 10 (SHS 1)", "Basic 11 (SHS 2)", "Basic 12 (SHS 3)"]
};

// Subject options mapping for different class levels
const subjectOptions = {
    // Lower Primary (Basic 1-3)
    'basic-1': ["English Language", "Mathematics", "Science", "History", "Our World Our People", "Religious and Moral Education", "Physical Education", "Creative Arts"],
    'basic-2': ["English Language", "Mathematics", "Science", "History", "Our World Our People", "Religious and Moral Education", "Physical Education", "Creative Arts"],
    'basic-3': ["English Language", "Mathematics", "Science", "History", "Our World Our People", "Religious and Moral Education", "Physical Education", "Creative Arts"],

    // Upper Primary (Basic 4-6)
    'basic-4': ["English Language", "Mathematics", "Science", "History", "Our World Our People", "Religious and Moral Education", "Physical Education", "Creative Arts", "Computing", "French", "Ghanaian Language"],
    'basic-5': ["English Language", "Mathematics", "Science", "History", "Our World Our People", "Religious and Moral Education", "Physical Education", "Creative Arts", "Computing", "French", "Ghanaian Language"],
    'basic-6': ["English Language", "Mathematics", "Science", "History", "Our World Our People", "Religious and Moral Education", "Physical Education", "Creative Arts", "Computing", "French", "Ghanaian Language"],

    // Junior High School (Basic 7-9)
    'basic-7-(jhs-1)': ["English Language", "Mathematics", "Science", "Social Studies", "Religious and Moral Education", "Physical & Health Education", "Career Technology", "Computing", "Creative Arts & Design", "French", "Ghanaian Language"],
    'basic-8-(jhs-2)': ["English Language", "Mathematics", "Science", "Social Studies", "Religious and Moral Education", "Physical & Health Education", "Career Technology", "Computing", "Creative Arts & Design", "French", "Ghanaian Language"],
    'basic-9-(jhs-3)': ["English Language", "Mathematics", "Science", "Social Studies", "Religious and Moral Education", "Physical & Health Education", "Career Technology", "Computing", "Creative Arts & Design", "French", "Ghanaian Language"]
};

// Populate class dropdown based on level selection
levelSelect.addEventListener('change', () => {
    const selectedLevel = levelSelect.value;
    classSelect.innerHTML = '<option value="">-- Select Class --</option>';
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    classSelect.disabled = true;
    subjectSelect.disabled = true;
    startBtn.disabled = true;

    if (classOptions[selectedLevel]) {
        classOptions[selectedLevel].forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.toLowerCase().replace(/\s+/g, '-').replace(/–/g, '-');
            option.textContent = cls;
            classSelect.appendChild(option);
        });
        classSelect.disabled = false;
    }
});

// Populate subject dropdown based on class selection
classSelect.addEventListener('change', async () => {
    const selectedClass = classSelect.value;
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    subjectSelect.disabled = true;
    startBtn.disabled = true;

    if (subjectOptions[selectedClass]) {
        subjectOptions[selectedClass].forEach(subject => {
            const option = document.createElement('option');
            const formattedValue = subject.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/–/g, '-');
            option.value = formattedValue;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
        subjectSelect.disabled = false;
    }
});

// Check if all fields are selected to enable start button
function checkSelections() {
    startBtn.disabled = !(levelSelect.value && classSelect.value && subjectSelect.value);
}
levelSelect.addEventListener('change', checkSelections);
classSelect.addEventListener('change', checkSelections);
subjectSelect.addEventListener('change', checkSelections);

// Function to fetch timer configuration from the server
async function fetchConfig() {
    try {
        const response = await fetch('https://scholarspath.onrender.com/config');
        if (response.ok) {
            const config = await response.json();
            enableTimer = config.enableTimer;
            timePerQuestion = config.timePerQuestion || 60;
            shuffleQuestions = config.shuffleQuestions !== undefined ? config.shuffleQuestions : true;
            console.log(`Timer is ${enableTimer ? 'enabled' : 'disabled'}. Shuffle is ${shuffleQuestions ? 'enabled' : 'disabled'}.`);
        }
    } catch (error) {
        console.error('Failed to fetch timer configuration:', error);
        enableTimer = true;
        timePerQuestion = 60;
        shuffleQuestions = true;
    }
}

// Function to format time in MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Quiz functionality
startBtn.addEventListener('click', async () => {
    const level = levelSelect.value;
    const classLevel = classSelect.value;
    const subject = subjectSelect.value;

    if (!subject) {
        alert("Please select a subject to start the quiz.");
        return;
    }
    
    await fetchConfig();

    try {
        const response = await fetch(`https://scholarspath.onrender.com/quiz-questions?level=${level}&class=${classLevel}&subject=${subject}`);
        if (!response.ok) {
            throw new Error('Failed to load quiz questions.');
        }
        questions = await response.json();

        if (questions.length === 0) {
            alert("No questions found for the selected subject. Please select a different one.");
            return;
        }

        if (shuffleQuestions) {
            shuffleArray(questions);
        }

        userAnswers = Array(questions.length).fill(null);
        currentQuestionIndex = 0;
        score = 0;

        welcomeContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');

        if (enableTimer) {
            timerContainer.style.display = 'block';
            startTimer();
        } else {
            timerContainer.style.display = 'none';
        }

        displayQuestion();
        updateNavigationButtons();
        updateScoreDisplay();

    } catch (error) {
        alert(error.message);
        console.error("Error starting quiz:", error);
    }
});

function displayQuestion() {
    optionsList.innerHTML = '';

    const currentQuestion = questions[currentQuestionIndex];
    quizTitle.textContent = `${subjectSelect.options[subjectSelect.selectedIndex].text} Quiz`;
    questionText.textContent = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}`;

    currentQuestion.options.forEach(optionObj => {
        const optionKey = Object.keys(optionObj)[0];
        const optionValue = Object.values(optionObj)[0];
        const li = document.createElement('li');
        li.textContent = `${optionKey}. ${optionValue}`;
        
        li.addEventListener('click', () => {
            optionsList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');
            userAnswers[currentQuestionIndex] = optionKey;
        });

        if (userAnswers[currentQuestionIndex] === optionKey) {
            li.classList.add('selected');
        }
        optionsList.appendChild(li);
    });
    updateNavigationButtons();
}

function updateNavigationButtons() {
    prevBtn.classList.toggle('hidden', currentQuestionIndex === 0);
    nextBtn.classList.toggle('hidden', currentQuestionIndex < questions.length - 1 ? false : true);
    submitBtn.classList.toggle('hidden', currentQuestionIndex < questions.length - 1 ? true : false);
}

prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateNavigationButtons();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateNavigationButtons();
    }
});

submitBtn.addEventListener('click', () => {
    calculateScore();
    displayResults();
    clearInterval(timerInterval);
});

function startTimer() {
    let timeRemaining = timePerQuestion;
    timerDisplay.textContent = formatTime(timeRemaining);
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeRemaining--;
        timerDisplay.textContent = formatTime(timeRemaining);

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting your quiz now.");
            submitQuizOnTimeout();
        }
    }, 1000);
}

function submitQuizOnTimeout() {
    calculateScore();
    displayResults();
}

function calculateScore() {
    score = 0;
    questions.forEach((q, index) => {
        if (userAnswers[index] === q.correct_answer) {
            score++;
        }
    });
}

function updateScoreDisplay() {
    scoreValue.textContent = `${score}/${questions.length}`;
}

function displayResults() {
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');

    scoreOutput.textContent = `You scored ${score} out of ${questions.length}.`;
    answersReview.innerHTML = '';

    const scorePercentage = (score / questions.length) * 100;
    let feedbackComment = '';
    
    if (scorePercentage === 100) {
        feedbackComment = 'Flawless victory! You are a true master of this subject!';
    } else if (scorePercentage >= 80) {
        feedbackComment = 'Excellent job! You did a fantastic job and clearly know the material!';
    } else if (scorePercentage >= 60) {
        feedbackComment = 'Good effort! You are well on your way to mastery. Keep practicing!';
    } else {
        feedbackComment = 'Keep going! Every attempt is a step forward. Review your answers and try again!';
    }
    
    const commentElement = document.createElement('p');
    commentElement.textContent = feedbackComment;
    commentElement.classList.add('feedback-comment');
    resultsContainer.insertBefore(commentElement, scoreOutput.nextSibling);

    questions.forEach((q, index) => {
        const resultDiv = document.createElement('div');
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correct_answer;

        resultDiv.classList.add('answer-review-item', isCorrect ? 'correct' : 'incorrect');

        const questionText = document.createElement('p');
        questionText.innerHTML = `<strong>${index + 1}. ${q.question}</strong>`;

        const answerText = document.createElement('p');
        answerText.innerHTML = `<strong>Your Answer:</strong> ${userAnswer || 'No answer selected'}`;

        const explanationText = document.createElement('p');
        explanationText.innerHTML = `<strong>Explanation:</strong> ${q.correct_answer_explanation}`;

        resultDiv.appendChild(questionText);
        resultDiv.appendChild(answerText);

        if (!isCorrect) {
            const correctAnswerText = document.createElement('p');
            correctAnswerText.innerHTML = `<strong>Correct Answer:</strong> ${q.correct_answer}`;
            resultDiv.appendChild(correctAnswerText);
        }

        resultDiv.appendChild(explanationText);
        answersReview.appendChild(resultDiv);
    });

    scoreValue.textContent = `${score}/${questions.length}`;
    scoreOutput.textContent = `You scored ${score} out of ${questions.length}.`;
}

restartBtn.addEventListener('click', () => {
    resultsContainer.classList.add('hidden');
    welcomeContainer.classList.remove('hidden');
    levelSelect.value = "";
    classSelect.value = "";
    subjectSelect.value = "";
    classSelect.disabled = true;
    subjectSelect.disabled = true;
    startBtn.disabled = true;
    timerDisplay.textContent = "";
    timerContainer.style.display = 'block';
});

// Dark Mode Toggle Functionality
const modeToggleBtn = document.getElementById('mode-toggle');

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

modeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});