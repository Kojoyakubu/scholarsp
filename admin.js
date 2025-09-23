const form = document.getElementById('quiz-form');
const levelInput = document.getElementById('level-input');
const classInput = document.getElementById('class-input');
const subjectInput = document.getElementById('subject-input');
const topicInput = document.getElementById('topic-input');
const countInput = document.getElementById('count-input');
const timerToggleInput = document.getElementById('timer-toggle-input');
const timePerQuestionInput = document.getElementById('time-per-question-input');
const timerSettings = document.getElementById('timer-settings');
const shuffleToggleInput = document.getElementById('shuffle-toggle-input');
const generateBtn = document.getElementById('generate-btn');
const statusMessage = document.getElementById('status-message');
const questionsOutput = document.getElementById('questions-output');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');

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
levelInput.addEventListener('change', () => {
    const selectedLevel = levelInput.value;
    classInput.innerHTML = '<option value="">-- Select Class --</option>';
    subjectInput.innerHTML = '<option value="">-- Select Subject --</option>';
    classInput.disabled = true;
    subjectInput.disabled = true;
    generateBtn.disabled = true;

    if (classOptions[selectedLevel]) {
        classOptions[selectedLevel].forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.toLowerCase().replace(/\s+/g, '-').replace(/–/g, '-');
            option.textContent = cls;
            classInput.appendChild(option);
        });
        classInput.disabled = false;
    }
});

// Populate subject dropdown based on class selection
classInput.addEventListener('change', () => {
    const selectedClass = classInput.value;
    subjectInput.innerHTML = '<option value="">-- Select Subject --</option>';
    subjectInput.disabled = true;
    generateBtn.disabled = true;

    if (subjectOptions[selectedClass]) {
        subjectOptions[selectedClass].forEach(subject => {
            const option = document.createElement('option');
            const formattedValue = subject.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/–/g, '-');
            option.value = formattedValue;
            option.textContent = subject;
            subjectInput.appendChild(option);
        });
        subjectInput.disabled = false;
    }
});

// Toggle visibility of timer settings
timerToggleInput.addEventListener('change', () => {
    timerSettings.style.display = timerToggleInput.checked ? 'block' : 'none';
});

// Enable generate button when all fields are selected
form.addEventListener('change', () => {
    generateBtn.disabled = !(levelInput.value && classInput.value && subjectInput.value && topicInput.value && countInput.value);
});

// Handle question generation
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    statusMessage.textContent = 'Generating questions. This may take a moment...';
    saveBtn.style.display = 'none';
    questionsOutput.textContent = ''; // Clear previous output

    try {
        const level = levelInput.value;
        const classLevel = classInput.value;
        const subject = subjectInput.value;
        const topic = topicInput.value;
        const count = countInput.value;

        const response = await fetch('https://scholarspath.onrender.com/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level, class: classLevel, subject, topic, count })
        });

        const text = await response.text();

        if (!response.ok) {
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || 'Server error');
            } catch (jsonError) {
                throw new Error(text || 'Server error');
            }
        }

        try {
            const data = JSON.parse(text);
            questionsOutput.textContent = JSON.stringify(data, null, 2);
            statusMessage.textContent = 'Questions generated successfully!';
            statusMessage.style.color = 'green';
            saveBtn.style.display = 'block';

        } catch (jsonError) {
            questionsOutput.textContent = `Error: Failed to parse AI response as JSON.\n\nRaw AI Response:\n${text}`;
            statusMessage.textContent = 'Error: Failed to generate questions. AI response was not a valid JSON array.';
            statusMessage.style.color = 'red';
            saveBtn.style.display = 'none';
        }

    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}. Please check the server status.`;
        statusMessage.style.color = 'red';
        console.error("Fetch error:", error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Questions';
    }
});

// Handle saving questions
saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    saveStatus.textContent = '';

    try {
        const generatedQuestions = JSON.parse(questionsOutput.textContent);
        const level = levelInput.value;
        const classLevel = classInput.value;
        const subject = subjectInput.value;
        const enableTimer = timerToggleInput.checked;
        const timePerQuestionInMinutes = parseInt(timePerQuestionInput.value);
        const timePerQuestion = enableTimer ? (timePerQuestionInMinutes * 60) : 0;
        const shuffleQuestions = shuffleToggleInput.checked;

        const response = await fetch('https://scholarspath.onrender.com/save-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level,
                classLevel,
                subject,
                questions: generatedQuestions,
                enableTimer,
                timePerQuestion,
                shuffleQuestions
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        saveStatus.textContent = 'Successfully saved questions!';
        saveStatus.style.color = 'green';

    } catch (error) {
        saveStatus.textContent = `Error: ${error.message}`;
        saveStatus.style.color = 'red';
        console.error("Save error:", error);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Questions to File';
    }
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