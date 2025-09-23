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

// Class options mapping
const classOptions = {
    primary: ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6"],
    jhs: ["Basic 7 (JHS 1)", "Basic 8 (JHS 2)", "Basic 9 (JHS 3)"],
    shs: ["Basic 10 (SHS 1)", "Basic 11 (SHS 2)", "Basic 12 (SHS 3)"]
};

// Subject options mapping for different class levels
const subjectOptions = {
    // Lower Primary (Basic 1-3)
    'basic-1': ["English Language", "Mathematics", "Science", "Our World Our People", "History"],
    'basic-2': ["English Language", "Mathematics", "Science", "Our World Our People", "History"],
    'basic-3': ["English Language", "Mathematics", "Science", "Our World Our People", "History"],
    // Upper Primary (Basic 4-6)
    'basic-4': ["English Language", "Mathematics", "Science", "Our World Our People", "History", "Religious and Moral Education"],
    'basic-5': ["English Language", "Mathematics", "Science", "Our World Our People", "History", "Religious and Moral Education"],
    'basic-6': ["English Language", "Mathematics", "Science", "Our World Our People", "History", "Religious and Moral Education"],
    // Junior High School (Basic 7-9)
    'basic-7-(jhs-1)': ["English Language", "Mathematics", "Science", "Social Studies", "Religious and Moral Education"],
    'basic-8-(jhs-2)': ["English Language", "Mathematics", "Science", "Social Studies", "Religious and Moral Education"],
    'basic-9-(jhs-3)': ["English Language", "Mathematics", "Science", "Social Studies", "Religious and Moral Education"],
    // Senior High School (Basic 10-12)
    'basic-10-(shs-1)': ["Core Mathematics", "Integrated Science", "Social Studies", "English Language", "Religious and Moral Education"],
    'basic-11-(shs-2)': ["Core Mathematics", "Integrated Science", "Social Studies", "English Language", "Religious and Moral Education"],
    'basic-12-(shs-3)': ["Core Mathematics", "Integrated Science", "Social Studies", "English Language", "Religious and Moral Education"]
};

// Helper function to format the class level string
const formatClassLevel = (str) => {
    return str.toLowerCase().replace(/\s/g, '-').replace(/[\(\)]/g, '');
};

// Populate class options based on level selection
levelSelect.addEventListener('change', () => {
    const level = levelSelect.value;
    classSelect.innerHTML = '<option value="">-- Select Class --</option>';
    classSelect.disabled = true;
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    subjectSelect.disabled = true;
    startBtn.disabled = true;

    if (level) {
        classOptions[level].forEach(cls => {
            const option = document.createElement('option');
            option.value = formatClassLevel(cls);
            option.textContent = cls;
            classSelect.appendChild(option);
        });
        classSelect.disabled = false;
    }
});

// Populate subject options based on class selection
classSelect.addEventListener('change', () => {
    const classLevel = classSelect.value;
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    subjectSelect.disabled = true;
    startBtn.disabled = true;

    if (classLevel) {
        const subjects = subjectOptions[classLevel];
        if (subjects) {
            subjects.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.toLowerCase().replace(/\s/g, '-');
                option.textContent = sub;
                subjectSelect.appendChild(option);
            });
            subjectSelect.disabled = false;
        }
    }
});

// Enable start button if all selections are made
subjectSelect.addEventListener('change', () => {
    if (levelSelect.value && classSelect.value && subjectSelect.value) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
});

// Start Quiz button functionality
startBtn.addEventListener('click', async () => {
    const level = levelSelect.value;
    const classLevel = classSelect.value;
    const subject = subjectSelect.value;

    try {
        // Fetch questions from the server
        const questionsResponse = await fetch(`http://localhost:3000/quiz-questions?level=${level}&class=${classLevel}&subject=${subject}`);
        const configResponse = await fetch(`http://localhost:3000/config`);

        if (!questionsResponse.ok) {
            throw new Error('Failed to fetch questions. No questions found.');
        }

        if (!configResponse.ok) {
            // Handle cases where the config file might not exist, using default values
            console.warn('Failed to fetch config. Using default timer values.');
            enableTimer = true;
            timePerQuestion = 60;
        } else {
            const configData = await configResponse.json();
            enableTimer = configData.enableTimer;
            timePerQuestion = configData.timePerQuestion;
        }

        questions = await questionsResponse.json();
        userAnswers = Array(questions.length).fill(null);
        currentQuestionIndex = 0;
        score = 0;

        welcomeContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');

        updateQuizDisplay();

        // Start or hide the timer based on the fetched config
        if (enableTimer) {
            timerContainer.style.display = 'block';
            startTimer();
        } else {
            timerContainer.style.display = 'none';
        }

    } catch (error) {
        alert(error.message);
        console.error("Error:", error);
    }
});

// Function to update the quiz display
const updateQuizDisplay = () => {
    if (questions.length === 0) {
        questionText.textContent = "No questions loaded.";
        optionsList.innerHTML = "";
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'none';
        submitBtn.style.display = 'none';
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    quizTitle.textContent = `${subjectSelect.options[subjectSelect.selectedIndex].textContent} Quiz`;
    questionText.textContent = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}`;
    optionsList.innerHTML = "";

    // Clear previous selection
    const selectedOption = userAnswers[currentQuestionIndex];

    currentQuestion.options.forEach(option => {
        const key = Object.keys(option)[0];
        const value = option[key];

        const li = document.createElement('li');
        li.textContent = `${key}. ${value}`;
        li.dataset.option = key;

        // Apply a "selected" class if this option was previously chosen
        if (selectedOption && selectedOption === key) {
            li.classList.add('selected');
        }

        li.addEventListener('click', () => {
            // Remove 'selected' class from all other options
            optionsList.querySelectorAll('li').forEach(item => {
                item.classList.remove('selected');
            });
            // Add 'selected' class to the clicked option
            li.classList.add('selected');

            // Save the user's answer
            userAnswers[currentQuestionIndex] = key;
        });

        optionsList.appendChild(li);
    });

    // Handle button visibility
    prevBtn.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    nextBtn.style.display = currentQuestionIndex < questions.length - 1 ? 'inline-block' : 'none';
    submitBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'inline-block' : 'none';
};

// Navigation buttons
nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        updateQuizDisplay();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuizDisplay();
    }
});

// Submit Quiz
submitBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    checkAnswers();
    showResults();
});

// Timer functionality
function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = timePerQuestion * 60; // Convert minutes to seconds
    timerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting quiz.");
            checkAnswers();
            showResults();
        }
    }, 1000);
}

// Check answers and calculate score
const checkAnswers = () => {
    score = 0;
    questions.forEach((question, index) => {
        if (userAnswers[index] === question.correct_answer) {
            score++;
        }
    });
};

// Show results
const showResults = () => {
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    answersReview.innerHTML = "";

    questions.forEach((question, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('answer-review-item');

        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct_answer;

        const icon = isCorrect ? '✅' : '❌';
        resultDiv.innerHTML = `
            <p><strong>${icon} Question ${index + 1}:</strong> ${question.question}</p>
            <p>Your Answer: ${userAnswer ? userAnswer : 'No Answer'}</p>
            <p>Correct Answer: ${question.correct_answer}. ${question.correct_answer_explanation}</p>
        `;
        answersReview.appendChild(resultDiv);
    });

    // Update both score displays
    scoreValue.textContent = `${score}/${questions.length}`;
    scoreOutput.textContent = `You scored ${score} out of ${questions.length}.`;
};

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

    // Clear the timer display when returning to welcome page
    timerContainer.style.display = 'block';

});

// Dark Mode Toggle Functionality
const modeToggleBtn = document.getElementById('mode-toggle');

// On page load, check for a saved theme preference in localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// Add event listener for the toggle button
modeToggleBtn.addEventListener('click', () => {
    // Toggle the .dark-mode class on the body
    document.body.classList.toggle('dark-mode');

    // Save the user's preference to localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});