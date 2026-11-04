

"""
Educational Tutor AI - Educational Tutor Using Generative AI
Flask Web Application Backend

Replaces Streamlit with a clean, lightweight Python Flask backend
and connects to Google Gemini API for 5 key educational features:
1. AI Chatbot
2. Notes Summarizer
3. Simple Explanation
4. Quiz Generator
5. Question & Answer Generator
"""

import os
import uuid
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from dotenv import load_dotenv

import config
import database
from ai_engine import gemini

# Ensure environment variables are loaded
load_dotenv(config.BASE_DIR / ".env")

# Initialize Flask Application
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "edututor-ai-secret-key-2026-mca")

# Initialize SQLite database on startup
try:
    database.init_db()
    DEFAULT_USER_ID = database.get_or_create_default_user()
except Exception as db_err:
    print(f"[Database] Initialization note: {db_err}")
    DEFAULT_USER_ID = 1


# -------------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------------

def get_active_model() -> str:
    """Returns currently selected model from user session or default."""
    model = session.get("selected_model", gemini.DEFAULT_MODEL)
    if not gemini.is_model_available(model):
        model = gemini.DEFAULT_MODEL
        session["selected_model"] = model
    return model


# -------------------------------------------------------------------------
# Web Page Routes
# -------------------------------------------------------------------------

@app.route("/")
def index():
    """Renders the main Educational Tutor AI dashboard."""
    active_model = get_active_model()
    is_live = gemini.is_api_configured()

    return render_template(
        "index.html",
        app_name=config.APP_NAME,
        app_subtitle=config.APP_SUBTITLE,
        project_title=config.PROJECT_TITLE,
        available_models=gemini.get_available_models(),
        active_model=active_model,
        is_live=is_live,
        subjects_list=config.SUBJECTS_LIST,
        explanation_levels=config.EXPLANATION_LEVELS,
        quiz_difficulties=config.QUIZ_DIFFICULTIES,
        summary_types=config.SUMMARY_TYPES
    )


@app.route("/result", methods=["GET", "POST"])
def view_result():
    """
    Renders standalone / printable result page for saving or reviewing
    generated educational material.
    """
    if request.method == "POST":
        title = request.form.get("title", "Educational Tutor AI Study Result")
        subject = request.form.get("subject", "General")
        feature_type = request.form.get("feature_type", "Study Material")
        content = request.form.get("content", "")
    else:
        title = request.args.get("title", "Educational Tutor AI Study Result")
        subject = request.args.get("subject", "General")
        feature_type = request.args.get("feature_type", "Study Material")
        content = session.get("last_result_content", "No recent study result found. Please generate one from the dashboard.")

    return render_template(
        "result.html",
        app_name=config.APP_NAME,
        title=title,
        subject=subject,
        feature_type=feature_type,
        content=content
    )


# -------------------------------------------------------------------------
# Model & System Status API Routes
# -------------------------------------------------------------------------

@app.route("/api/status", methods=["GET"])
def api_status():
    """Returns current system configuration and Gemini model status (never leaks API key)."""
    return jsonify({
        "success": True,
        "is_live": gemini.is_api_configured(),
        "available_models": gemini.get_available_models(),
        "active_model": get_active_model()
    })


@app.route("/api/set-model", methods=["POST"])
def set_model():
    """Switches active Gemini model in session after validating availability."""
    data = request.get_json(silent=True) or {}
    model_name = data.get("model", "").strip()

    if not gemini.is_model_available(model_name):
        return jsonify({
            "success": False,
            "error": f"Model '{model_name}' is not in available models list: {gemini.get_available_models()}"
        }), 400

    session["selected_model"] = model_name
    return jsonify({
        "success": True,
        "active_model": model_name,
        "message": f"Active model set to {model_name}"
    })


# -------------------------------------------------------------------------
# Feature 1: AI Chatbot Route
# -------------------------------------------------------------------------

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    Educational Chatbot endpoint.
    Accepts educational question and conversational history.
    """
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    history = data.get("history", [])
    requested_model = data.get("model") or get_active_model()

    if not user_message:
        return jsonify({"success": False, "error": "Please enter a question or topic."}), 400

    if not gemini.is_model_available(requested_model):
        requested_model = get_active_model()

    try:
        reply_text, is_live, status_msg = gemini.chat_with_gemini(
            message=user_message,
            history=history,
            model_name=requested_model
        )

        # Log conversation to database if session ID exists
        chat_sid = session.get("chat_session_id")
        if not chat_sid:
            chat_sid = str(uuid.uuid4())[:8]
            session["chat_session_id"] = chat_sid

        try:
            database.save_chat_message(DEFAULT_USER_ID, chat_sid, "user", user_message)
            database.save_chat_message(DEFAULT_USER_ID, chat_sid, "assistant", reply_text)
        except Exception as db_e:
            print(f"[DB Log] Chat save note: {db_e}")

        return jsonify({
            "success": True,
            "reply": reply_text,
            "is_live": is_live,
            "status": status_msg,
            "model": requested_model
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Error generating answer: {str(e)}"}), 500


# -------------------------------------------------------------------------
# Feature 2: Notes Summarizer Route
# -------------------------------------------------------------------------

@app.route("/api/summarize", methods=["POST"])
def api_summarize():
    """
    Notes Summarizer endpoint.
    Summarizes study notes and highlights critical points.
    """
    data = request.get_json(silent=True) or {}
    notes = data.get("notes", "").strip()
    summary_type = data.get("summary_type", "Medium Summary")
    requested_model = data.get("model") or get_active_model()

    if not notes or len(notes) < 10:
        return jsonify({
            "success": False,
            "error": "Please paste study notes with at least 10 characters to summarize."
        }), 400

    if not gemini.is_model_available(requested_model):
        requested_model = get_active_model()

    try:
        summary_text, is_live, status_msg = gemini.summarize_notes(
            notes=notes,
            summary_type=summary_type,
            model_name=requested_model
        )

        # Cache in session for export / printable view
        session["last_result_content"] = summary_text

        return jsonify({
            "success": True,
            "summary": summary_text,
            "is_live": is_live,
            "status": status_msg,
            "model": requested_model
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Summarization error: {str(e)}"}), 500


# -------------------------------------------------------------------------
# Feature 3: Simple Explanation Route
# -------------------------------------------------------------------------

@app.route("/api/explain", methods=["POST"])
def api_explain():
    """
    Simple Explanation endpoint.
    Explains complex topics in beginner-friendly language with analogies and examples.
    """
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()
    subject = data.get("subject", "General").strip()
    level = data.get("level", "Beginner").strip()
    requested_model = data.get("model") or get_active_model()

    if not topic:
        return jsonify({"success": False, "error": "Please enter a topic to explain."}), 400

    if not gemini.is_model_available(requested_model):
        requested_model = get_active_model()

    try:
        explanation_text, is_live, status_msg = gemini.explain_concept(
            topic=topic,
            subject=subject,
            level=level,
            model_name=requested_model
        )

        session["last_result_content"] = explanation_text

        # Record question in SQLite database
        try:
            database.save_question(
                user_id=DEFAULT_USER_ID,
                subject=subject,
                question=topic,
                response=explanation_text,
                explanation_level=level,
                answer_type="Simple Explanation"
            )
        except Exception as db_e:
            print(f"[DB Log] Question save note: {db_e}")

        return jsonify({
            "success": True,
            "explanation": explanation_text,
            "is_live": is_live,
            "status": status_msg,
            "topic": topic,
            "model": requested_model
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Explanation error: {str(e)}"}), 500


# -------------------------------------------------------------------------
# Feature 4: Quiz Generator Route
# -------------------------------------------------------------------------

@app.route("/api/quiz", methods=["POST"])
def api_quiz():
    """
    Quiz Generator endpoint.
    Generates multiple-choice questions with correct answers and explanations.
    """
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()
    subject = data.get("subject", "General").strip()
    difficulty = data.get("difficulty", "Medium").strip()
    num_questions = int(data.get("num_questions", 5))
    requested_model = data.get("model") or get_active_model()

    if not topic:
        return jsonify({"success": False, "error": "Please enter a topic for the quiz."}), 400

    if not gemini.is_model_available(requested_model):
        requested_model = get_active_model()

    try:
        quiz_data, is_live, status_msg = gemini.generate_quiz(
            topic=topic,
            subject=subject,
            difficulty=difficulty,
            num_questions=min(max(num_questions, 1), 10),
            model_name=requested_model
        )

        return jsonify({
            "success": True,
            "quiz": quiz_data,
            "is_live": is_live,
            "status": status_msg,
            "topic": topic,
            "subject": subject,
            "difficulty": difficulty,
            "model": requested_model
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Quiz generation error: {str(e)}"}), 500


@app.route("/api/quiz/save", methods=["POST"])
def api_save_quiz_score():
    """Saves student quiz score to SQLite database."""
    data = request.get_json(silent=True) or {}
    subject = data.get("subject", "General")
    topic = data.get("topic", "Quiz")
    difficulty = data.get("difficulty", "Medium")
    score = int(data.get("score", 0))
    total = int(data.get("total", 0))
    percentage = round((score / total) * 100, 1) if total > 0 else 0.0

    try:
        quiz_id = database.save_quiz(
            user_id=DEFAULT_USER_ID,
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            score=score,
            total_questions=total,
            percentage=percentage
        )
        return jsonify({"success": True, "quiz_id": quiz_id, "percentage": percentage})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------------------------------
# Feature 5: Question & Answer Generator Route
# -------------------------------------------------------------------------

@app.route("/api/qa", methods=["POST"])
def api_qa():
    """
    Question & Answer Generator endpoint.
    Generates relevant examination/study questions with detailed model answers.
    """
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()
    subject = data.get("subject", "General").strip()
    difficulty = data.get("difficulty", "Medium").strip()
    num_questions = int(data.get("num_questions", 5))
    requested_model = data.get("model") or get_active_model()

    if not topic:
        return jsonify({"success": False, "error": "Please enter a subject or topic for Q&A."}), 400

    if not gemini.is_model_available(requested_model):
        requested_model = get_active_model()

    try:
        qa_data, is_live, status_msg = gemini.generate_qa(
            topic=topic,
            subject=subject,
            difficulty=difficulty,
            num_questions=min(max(num_questions, 1), 10),
            model_name=requested_model
        )

        return jsonify({
            "success": True,
            "qa_list": qa_data,
            "is_live": is_live,
            "status": status_msg,
            "topic": topic,
            "subject": subject,
            "model": requested_model
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Q&A generation error: {str(e)}"}), 500


# -------------------------------------------------------------------------
# Error Handlers
# -------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404
    return redirect(url_for("index"))


@app.errorhandler(500)
def server_error(e):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "error": "Internal server error"}), 500
    return "<h1>500 - Internal Server Error</h1><p>Please return to <a href='/'>Educational Tutor AI Home</a>.</p>", 500


# -------------------------------------------------------------------------
# Application Entry Point
# -------------------------------------------------------------------------

if __name__ == "__main__":
    print("==================================================")
    print(f"{config.APP_NAME} - {config.PROJECT_TITLE}")
    print("Backend Server: Python Flask")
    print(f"Available Models: {', '.join(gemini.AVAILABLE_MODELS)}")
    print(f"Default Model: {gemini.DEFAULT_MODEL}")
    print(f"Gemini API Configured: {gemini.is_api_configured()}")
    print("Starting server on http://127.0.0.1:5000 ...")
    print("==================================================")
    app.run(host="127.0.0.1", port=5000, debug=False)
