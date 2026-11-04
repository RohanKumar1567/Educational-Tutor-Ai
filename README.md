# Educational Tutor AI – Educational Tutor Using Generative AI
> **Master of Computer Applications (MCA) Minor Project**  
> *A Modern, Web-Based Generative AI Educational Assistant powered by Python Flask and Google Gemini API*

---

## 1. Project Overview

**Educational Tutor AI** is a clean, lightweight educational web application built with Python Flask, semantic HTML, basic CSS, and vanilla JavaScript. It connects to the **Google Gemini API** to provide five core generative educational features designed for students and educators:

1. **AI Chatbot**: Interactive conversational tutor that answers educational queries in clear, beginner-friendly language while retaining context across conversational turns.
2. **Notes Summarizer**: Accepts study notes or lecture material and generates concise summaries, key points, and critical technical terminology definitions.
3. **Simple Explanation**: Takes challenging academic topics and breaks them down using simple language, real-world analogies, step-by-step mechanisms, and practical examples.
4. **Quiz Generator**: Creates tailored multiple-choice quizzes with selectable difficulty (Easy, Medium, Hard), instant option checking, and detailed explanations.
5. **Question and Answer Generator**: Synthesizes syllabus-aligned, examination-ready questions accompanied by well-structured model answers.

---

## 2. Technology Stack

- **Backend**: Python 3.10+ and **Flask 3.x**
- **Frontend Structure**: Semantic **HTML5** (No React, Angular, Vue, Bootstrap, or Tailwind CSS)
- **Frontend Styling**: Basic **CSS3** with a clean White, Light Blue, and Dark Blue palette (No Emojis)
- **Frontend Interactions**: **Vanilla JavaScript** using the native Fetch API
- **Generative AI**: **Google Gemini API** (`google-genai` / `google-generativeai`)
- **Persistence**: **SQLite 3** local database (`data/tutor.db`)
- **Environment Management**: `python-dotenv` for secure API key configuration

---

## 3. Gemini Model Configuration & Left-Side Setting Control

The application preserves the exact Gemini model configuration:

```python
AVAILABLE_MODELS = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
]
```

- **Left-Side Setting Button**: A dedicated **Setting** button is positioned on the left side of the navigation bar next to the title. Clicking it opens a configuration modal allowing students to change the active AI agent/model and view connection status.
- **Security**: The Gemini API key is securely loaded from `.env` on the server and is **never** exposed to client-side HTML or JavaScript.
- **Model Verification**: Model availability is validated before processing any request.
- **Academic Fallback Engine**: If no API key is configured or when running offline, Educational Tutor AI seamlessly utilizes its built-in academic synthesis knowledge engine so presentations, vivas, and local testing continue without interruption.

---

## 4. Project Structure

```text
EduTutor-AI/
│
├── app.py                     # Flask application entry point and API route controllers
├── config.py                  # Application settings, paths, and model configurations
├── requirements.txt           # Minimal Python dependencies (Flask, google-genai, etc.)
├── .env                       # Environment variables (GEMINI_API_KEY)
├── .env.example               # Template for environment variables
├── .gitignore                 # Excludes .env, __pycache__, and SQLite DB files
│
├── templates/
│   ├── index.html             # Main dashboard UI with separate cards for each feature
│   └── result.html            # Standalone, print-ready view for study materials
│
├── static/
│   ├── css/
│   │   └── style.css          # Simple, clean, responsive CSS (white and blue theme, no emojis)
│   ├── js/
│   │   └── script.js          # Vanilla JS (Fetch API, tab navigation, settings modal, quiz engine)
│   └── images/                # Static assets and icons
│
├── ai_engine/
│   ├── __init__.py            # Package initialization
│   └── gemini.py              # Reusable Google Gemini API generation and prompt logic
│
└── database/
    ├── __init__.py
    └── database.py            # SQLite schema, user records, and logging
```

---

## 5. Main Application Features & Routes

| Route | HTTP Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Home educational dashboard with feature cards, left-side Setting button, and status badge |
| `/result` | `GET`, `POST` | Clean, standalone printable view of generated study materials |
| `/api/chat` | `POST` | AI Chatbot endpoint for conversational queries |
| `/api/summarize` | `POST` | Notes summarization endpoint |
| `/api/explain` | `POST` | Simple explanation endpoint with analogies and examples |
| `/api/quiz` | `POST` | Interactive MCQ quiz generator endpoint |
| `/api/quiz/save` | `POST` | Saves student test scores and percentages to SQLite |
| `/api/qa` | `POST` | Question and Answer generator endpoint |
| `/api/status` | `GET` | System and Gemini model status check (safe, no secret exposure) |
| `/api/set-model` | `POST` | Switches active model for the current user session |

---

## 6. Installation & Quick Start

### Step 1: Navigate to Project Directory
```bash
cd "c:\Users\Rohan Kumar\OneDrive\Desktop\Minor project - Copy"
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Ensure your Google Gemini API key is configured in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
DATABASE_PATH=data/tutor.db
```

### Step 4: Run the Flask Application
```bash
python app.py
```

### Step 5: Open in Web Browser
Navigate to:
```
http://127.0.0.1:5000
```

---

## 7. Frontend Design & Usability Highlights

- **Clean and Professional**: Free of emojis, using clean typography and subtle borders.
- **Color Palette**: Elegant combinations of White, Light Blue (`#f0f9ff`, `#e0f2fe`), and Deep Navy Blue (`#1e3a8a`, `#0f172a`).
- **Left-Side Setting Button**: Easily change the active AI agent / Gemini model at any time with the dedicated **Setting** button.
- **Instant Interactive Quiz**: Answer MCQs directly in the browser; see immediate correctness feedback with full explanations and automatic score calculations.
- **Printable Export**: Export any summary, explanation, or Q&A set directly to a clean printable view (`Ctrl+P` / Save as PDF).
