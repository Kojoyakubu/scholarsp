import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// THIS IS THE CORRECTED LINE
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..')));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const questionsDir = path.join(__dirname, 'questions');
const configPath = path.join(__dirname, 'config.json');

const generateContentPrompt = (level, classLevel, count, topic, subject) => `
You are a Ghanaian teacher for a ${level} student in ${classLevel}.
Generate ${count} multiple-choice questions about the topic of ${topic} in the subject of ${subject}.
The questions should be appropriate for this specific educational level and class.
For each question, provide four options and a correct answer.
Also, include a brief explanation for the correct answer.
The response must be in JSON format, with an array of question objects.
Each object should have the properties: 'question', 'options', 'correct_answer', and 'correct_answer_explanation'.
The options should be labeled with A, B, C, and D.

Example of expected JSON structure:
[
  {
    "topic": "Topic Name",
    "subject": "Subject Name",
    "question": "What is an example of an invertebrate?",
    "options": [
      {
        "A": "Dog"
      },
      {
        "B": "Elephant"
      },
      {
        "C": "Ant"
      },
      {
        "D": "Cat"
      }
    ],
    "correct_answer": "C",
    "correct_answer_explanation": "Ants are insects, which are a type of invertebrate."
  }
]
`;

app.post('/generate-questions', async (req, res) => {
    try {
        const { level, classLevel, subject, topic, count } = req.body;
        const prompt = generateContentPrompt(level, classLevel, count, topic, subject);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // FIX: Extract the JSON array using its first and last brackets
        const jsonStartIndex = text.indexOf('[');
        const jsonEndIndex = text.lastIndexOf(']');

        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            throw new Error('AI response does not contain a valid JSON array.');
        }

        const jsonText = text.substring(jsonStartIndex, jsonEndIndex + 1);
        const questions = JSON.parse(jsonText);

        res.json(questions);
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: `Failed to generate questions: ${error.message}` });
    }
});

app.post('/save-questions', async (req, res) => {
    try {
        const { level, classLevel, subject, questions, enableTimer, timePerQuestion } = req.body;

        // Save quiz questions
        const levelDir = path.join(questionsDir, level);
        const classDir = path.join(levelDir, classLevel);
        const filePath = path.join(classDir, `${subject}.json`);
        await fs.mkdir(classDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(questions, null, 2), 'utf8');

        // Save timer configuration
        const config = { enableTimer, timePerQuestion };
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

        res.status(200).json({ message: "Questions and configuration saved successfully." });

    } catch (error) {
        console.error("Failed to save questions:", error);
        res.status(500).json({ error: "Failed to save questions to file." });
    }
});

app.get('/quiz-questions', async (req, res) => {
    try {
        const { level, class: classLevel, subject } = req.query;

        const filePath = path.join(questionsDir, level, classLevel, `${subject}.json`);

        const questions = await fs.readFile(filePath, 'utf8');
        res.status(200).json(JSON.parse(questions));

    } catch (error) {
        console.error("Failed to load questions:", error);
        res.status(404).json({ error: "No questions found for the selected subject." });
    }
});

// New endpoint to get the configuration
app.get('/config', async (req, res) => {
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        res.status(200).json(JSON.parse(configData));
    } catch (error) {
        console.error("Failed to load config:", error);
        // Return a default config if the file doesn't exist
        res.status(200).json({ enableTimer: true, timePerQuestion: 60 });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});