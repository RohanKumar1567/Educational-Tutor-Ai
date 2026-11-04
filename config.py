"""
Configuration Module for Educational Tutor Using Generative AI (EduTutor AI)
Handles environment variables, application settings, and file paths.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env file if present
load_dotenv(BASE_DIR / ".env")

# Application Identity
APP_NAME = "Educational Tutor AI"
APP_SUBTITLE = "Personal AI-Powered Learning Assistant"
PROJECT_TITLE = "Educational Tutor Using Generative AI"
PROJECT_CATEGORY = "MCA Minor Project"

# Database Configuration
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DB_PATH = DATA_DIR / "tutor.db"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DB_PATH)))

# AI Configuration
DEFAULT_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()

# Available Models for user selection
AVAILABLE_MODELS = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
]

# Standard MCA Academic Subjects
SUBJECTS_LIST = [
    "Machine Learning",
    "Database Management Systems (DBMS)",
    "Operating Systems",
    "Data Structures & Algorithms",
    "Computer Networks",
    "Software Engineering",
    "Artificial Intelligence",
    "Cloud Computing & Distributed Systems",
    "Web Technologies & Full Stack Development",
    "Cyber Security & Cryptography",
    "Object-Oriented Programming (Java / C++)",
    "Computer Architecture & Organization",
    "Other / Custom Subject"
]

# Difficulty and Explanation Levels
EXPLANATION_LEVELS = ["Beginner", "Intermediate", "Advanced"]
ANSWER_TYPES = [
    "Simple Explanation",
    "Detailed Explanation",
    "Step-by-Step",
    "Exam Answer"
]
EXAM_MARKS = ["2 marks", "5 marks", "10 marks", "15 marks"]
QUIZ_DIFFICULTIES = ["Easy", "Medium", "Hard"]
QUIZ_TYPES = ["MCQ", "True/False", "Short Answer"]
SUMMARY_TYPES = [
    "Short Summary",
    "Medium Summary",
    "Detailed Summary",
    "Important Points"
]
