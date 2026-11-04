/**
 * Educational Tutor AI – Frontend Interactivity (Vanilla JavaScript)
 * Handles feature switching, Fetch API requests to Flask backend,
 * interactive quiz evaluation, chat history, settings modal for changing AI agent,
 * and markdown formatting without external frameworks or emojis.
 */

document.addEventListener('DOMContentLoaded', function () {
    // ---------------------------------------------------------------------
    // 1. Navigation & Feature Tab Switching
    // ---------------------------------------------------------------------
    const featureCards = document.querySelectorAll('.feature-card');
    const featureSections = document.querySelectorAll('.feature-section');

    featureCards.forEach(card => {
        card.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // Set active state on cards
            featureCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // Switch visible section
            featureSections.forEach(section => {
                if (section.id === targetTab) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            // Smooth scroll into view if on mobile
            if (window.innerWidth < 768) {
                const targetEl = document.getElementById(targetTab);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // ---------------------------------------------------------------------
    // 2. Left-Side Setting Button & AI Agent Configuration Modal
    // ---------------------------------------------------------------------
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const btnSaveAgent = document.getElementById('btn-save-agent');
    const currentAgentText = document.getElementById('current-agent-text');

    function openSettingsModal() {
        if (settingsModal) {
            settingsModal.classList.remove('hidden');
        }
    }

    function closeSettingsModal() {
        if (settingsModal) {
            settingsModal.classList.add('hidden');
        }
    }

    if (btnOpenSettings) {
        btnOpenSettings.addEventListener('click', openSettingsModal);
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeSettingsModal);
    }

    if (btnCancelModal) {
        btnCancelModal.addEventListener('click', closeSettingsModal);
    }

    if (settingsModal) {
        settingsModal.addEventListener('click', function (e) {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }

    if (btnSaveAgent) {
        btnSaveAgent.addEventListener('click', async function () {
            const selectedRadio = document.querySelector('input[name="agent-selection"]:checked');
            if (!selectedRadio) return;

            const selectedModel = selectedRadio.value;
            try {
                const resp = await fetch('/api/set-model', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: selectedModel })
                });
                const result = await resp.json();
                if (result.success) {
                    if (currentAgentText) {
                        currentAgentText.textContent = selectedModel;
                    }
                    closeSettingsModal();
                    showToast(`Active agent changed to: ${selectedModel}`);
                } else {
                    alert(result.error || 'Failed to update active model.');
                }
            } catch (err) {
                console.error('Agent selection error:', err);
                alert('Connection error while changing agent.');
            }
        });
    }

    function getActiveModel() {
        if (currentAgentText && currentAgentText.textContent.trim()) {
            return currentAgentText.textContent.trim();
        }
        const checkedRadio = document.querySelector('input[name="agent-selection"]:checked');
        return checkedRadio ? checkedRadio.value : 'gemini-3.5-flash';
    }

    // ---------------------------------------------------------------------
    // 3. Quick Sample Chips (1-Click Topic Auto-fill)
    // ---------------------------------------------------------------------
    document.querySelectorAll('.sample-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const sampleVal = this.getAttribute('data-value');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                targetInput.value = sampleVal;
                targetInput.focus();
            }
        });
    });

    // ---------------------------------------------------------------------
    // 4. Feature 1: AI Chatbot
    // ---------------------------------------------------------------------
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatLoading = document.getElementById('chat-loading');
    const btnClearChat = document.getElementById('btn-clear-chat');

    let chatHistory = [];

    if (chatForm) {
        chatForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // 1. Append user message to UI
            appendChatBubble('user', message);
            chatInput.value = '';
            chatHistory.push({ role: 'user', content: message });

            // 2. Show loading spinner
            chatLoading.classList.remove('hidden');
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        history: chatHistory.slice(-8),
                        model: getActiveModel()
                    })
                });

                const data = await response.json();
                chatLoading.classList.add('hidden');

                if (data.success) {
                    appendChatBubble('assistant', data.reply);
                    chatHistory.push({ role: 'assistant', content: data.reply });
                } else {
                    appendChatBubble('assistant', `**Error:** ${data.error || 'Unable to generate response.'}`);
                }
            } catch (err) {
                chatLoading.classList.add('hidden');
                appendChatBubble('assistant', '**Connection Error:** Could not connect to Educational Tutor backend.');
                console.error('Chat error:', err);
            }

            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function appendChatBubble(role, content) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'bubble-avatar';
        avatar.textContent = role === 'assistant' ? 'AI' : 'You';

        const body = document.createElement('div');
        body.className = 'bubble-body';
        body.innerHTML = formatMarkdown(content);

        bubble.appendChild(avatar);
        bubble.appendChild(body);
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (btnClearChat) {
        btnClearChat.addEventListener('click', function () {
            chatHistory = [];
            chatMessages.innerHTML = `
                <div class="chat-bubble assistant">
                    <div class="bubble-avatar">AI</div>
                    <div class="bubble-body">
                        <p><strong>Chat history cleared.</strong></p>
                        <p>What would you like to study next? Feel free to ask any question.</p>
                    </div>
                </div>
            `;
        });
    }

    // ---------------------------------------------------------------------
    // 5. Feature 2: Notes Summarizer
    // ---------------------------------------------------------------------
    const summarizerForm = document.getElementById('summarizer-form');
    const notesInput = document.getElementById('notes-input');
    const summaryTypeSelect = document.getElementById('summary-type');
    const summarizerLoading = document.getElementById('summarizer-loading');
    const summarizerResult = document.getElementById('summarizer-result');
    const summarizerContent = document.getElementById('summarizer-content');
    const loadSampleNotesBtn = document.getElementById('load-sample-notes');

    if (summarizerForm) {
        summarizerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const notes = notesInput.value.trim();

            if (!notes || notes.length < 10) {
                alert('Please enter study notes with at least 10 characters.');
                return;
            }

            summarizerLoading.classList.remove('hidden');
            summarizerResult.classList.add('hidden');

            try {
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        notes: notes,
                        summary_type: summaryTypeSelect.value,
                        model: getActiveModel()
                    })
                });

                const data = await response.json();
                summarizerLoading.classList.add('hidden');

                if (data.success) {
                    summarizerContent.innerHTML = formatMarkdown(data.summary);
                    summarizerResult.classList.remove('hidden');
                    summarizerResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    alert(data.error || 'Failed to summarize notes.');
                }
            } catch (err) {
                summarizerLoading.classList.add('hidden');
                alert('Error connecting to backend server.');
                console.error('Summarizer error:', err);
            }
        });
    }

    if (loadSampleNotesBtn) {
        loadSampleNotesBtn.addEventListener('click', function () {
            notesInput.value = `Operating Systems - Paging and Virtual Memory Notes:
Virtual memory is a memory management technique that provides an idealized abstraction of the storage resources that are actually available on a given machine. It creates an illusion to the user of a very large main memory.
Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory. The physical address space is broken into fixed-size blocks called frames, and logical address space is divided into blocks of the same size called pages.
When a process executes, its pages are loaded into any available memory frames from backing store. The CPU generates a logical address divided into two parts: Page Number (p) used as an index into a page table, and Page Offset (d) combined with base address to define the physical address.
A Page Fault occurs when a program tries to access a page that is mapped in address space but not loaded in physical RAM. When this happens, an interrupt is trapped to OS, the required page is fetched from secondary storage, page table is updated, and the instruction is restarted. Page replacement algorithms like FIFO, LRU, and Optimal are used when no free frames are available.`;
            notesInput.focus();
        });
    }

    // ---------------------------------------------------------------------
    // 6. Feature 3: Simple Explanation
    // ---------------------------------------------------------------------
    const explainForm = document.getElementById('explain-form');
    const explainSubject = document.getElementById('explain-subject');
    const explainLevel = document.getElementById('explain-level');
    const explainTopic = document.getElementById('explain-topic');
    const explainLoading = document.getElementById('explain-loading');
    const explainResult = document.getElementById('explain-result');
    const explainContent = document.getElementById('explain-content');
    const explainResultTitle = document.getElementById('explain-result-title');

    if (explainForm) {
        explainForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const topic = explainTopic.value.trim();

            if (!topic) {
                alert('Please enter a topic or concept to explain.');
                return;
            }

            explainLoading.classList.remove('hidden');
            explainResult.classList.add('hidden');

            try {
                const response = await fetch('/api/explain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: topic,
                        subject: explainSubject.value,
                        level: explainLevel.value,
                        model: getActiveModel()
                    })
                });

                const data = await response.json();
                explainLoading.classList.add('hidden');

                if (data.success) {
                    explainResultTitle.textContent = `Explanation: ${data.topic || topic}`;
                    explainContent.innerHTML = formatMarkdown(data.explanation);
                    explainResult.classList.remove('hidden');
                    explainResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    alert(data.error || 'Failed to generate explanation.');
                }
            } catch (err) {
                explainLoading.classList.add('hidden');
                alert('Error connecting to backend server.');
                console.error('Explain error:', err);
            }
        });
    }

    // ---------------------------------------------------------------------
    // 7. Feature 4: Quiz Generator
    // ---------------------------------------------------------------------
    const quizForm = document.getElementById('quiz-form');
    const quizSubject = document.getElementById('quiz-subject');
    const quizTopic = document.getElementById('quiz-topic');
    const quizDifficulty = document.getElementById('quiz-difficulty');
    const quizNum = document.getElementById('quiz-num');
    const quizLoading = document.getElementById('quiz-loading');
    const quizResult = document.getElementById('quiz-result');
    const quizQuestionsContainer = document.getElementById('quiz-questions-container');
    const quizScoreBadge = document.getElementById('quiz-score-badge');
    const btnResetQuiz = document.getElementById('btn-reset-quiz');

    let currentQuizData = [];
    let userQuizAnswers = {};

    if (quizForm) {
        quizForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const topic = quizTopic.value.trim();

            if (!topic) {
                alert('Please enter a topic for the quiz.');
                return;
            }

            quizLoading.classList.remove('hidden');
            quizResult.classList.add('hidden');

            try {
                const response = await fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: topic,
                        subject: quizSubject.value,
                        difficulty: quizDifficulty.value,
                        num_questions: parseInt(quizNum.value),
                        model: getActiveModel()
                    })
                });

                const data = await response.json();
                quizLoading.classList.add('hidden');

                if (data.success && data.quiz && data.quiz.length > 0) {
                    currentQuizData = data.quiz;
                    userQuizAnswers = {};
                    renderQuiz(data.quiz, topic);
                    quizResult.classList.remove('hidden');
                    quizResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    alert(data.error || 'Failed to generate quiz questions.');
                }
            } catch (err) {
                quizLoading.classList.add('hidden');
                alert('Error connecting to backend server.');
                console.error('Quiz error:', err);
            }
        });
    }

    function renderQuiz(questions, topic) {
        quizQuestionsContainer.innerHTML = '';
        userQuizAnswers = {};
        quizScoreBadge.textContent = `Score: 0 / ${questions.length}`;

        questions.forEach((q, qIndex) => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id = `quiz-card-${qIndex}`;

            const qNum = document.createElement('div');
            qNum.className = 'quiz-q-num';
            qNum.textContent = `Question ${qIndex + 1} of ${questions.length}`;

            const qText = document.createElement('div');
            qText.className = 'quiz-question-text';
            qText.textContent = q.question;

            const optionsList = document.createElement('div');
            optionsList.className = 'quiz-options-list';

            q.options.forEach((optText, optIdx) => {
                const optBtn = document.createElement('button');
                optBtn.type = 'button';
                optBtn.className = 'quiz-option-btn';
                optBtn.textContent = optText;

                optBtn.addEventListener('click', function () {
                    handleQuizSelection(qIndex, optText, q.correct_answer, q.explanation);
                });

                optionsList.appendChild(optBtn);
            });

            const explanationBox = document.createElement('div');
            explanationBox.className = 'quiz-explanation-box hidden';
            explanationBox.id = `quiz-exp-${qIndex}`;

            card.appendChild(qNum);
            card.appendChild(qText);
            card.appendChild(optionsList);
            card.appendChild(explanationBox);
            quizQuestionsContainer.appendChild(card);
        });
    }

    function handleQuizSelection(qIndex, selectedOpt, correctOpt, explanation) {
        if (userQuizAnswers.hasOwnProperty(qIndex)) return; // already answered

        const card = document.getElementById(`quiz-card-${qIndex}`);
        if (!card) return;

        const buttons = card.querySelectorAll('.quiz-option-btn');
        const isCorrect = selectedOpt.trim().toLowerCase() === correctOpt.trim().toLowerCase();

        userQuizAnswers[qIndex] = {
            selected: selectedOpt,
            correct: isCorrect
        };

        // Style buttons
        buttons.forEach(btn => {
            btn.disabled = true;
            const btnText = btn.textContent.trim().toLowerCase();
            if (btnText === correctOpt.trim().toLowerCase()) {
                btn.classList.add('selected-correct');
            } else if (btn.textContent.trim() === selectedOpt.trim()) {
                btn.classList.add('selected-wrong');
            }
        });

        // Show explanation (clean, no emojis)
        const expBox = document.getElementById(`quiz-exp-${qIndex}`);
        if (expBox) {
            expBox.innerHTML = `<strong>${isCorrect ? 'Correct:' : 'Incorrect:'}</strong> ${explanation}`;
            expBox.classList.remove('hidden');
        }

        // Update score
        const correctCount = Object.values(userQuizAnswers).filter(a => a.correct).length;
        quizScoreBadge.textContent = `Score: ${correctCount} / ${currentQuizData.length}`;

        // Check if all answered
        if (Object.keys(userQuizAnswers).length === currentQuizData.length) {
            saveAndShowQuizSummary(correctCount, currentQuizData.length);
        }
    }

    function saveAndShowQuizSummary(score, total) {
        const percentage = Math.round((score / total) * 100);
        let feedback = "Good effort. Review the explanations above to strengthen your concepts.";
        if (percentage >= 80) feedback = "Excellent performance. You have a solid grasp of this topic.";
        else if (percentage >= 60) feedback = "Well done. A quick revision will help you master every point.";

        const summaryCard = document.createElement('div');
        summaryCard.className = 'quiz-summary-card';
        summaryCard.innerHTML = `
            <h3>Quiz Completed</h3>
            <div class="quiz-summary-score">${score} / ${total} (${percentage}%)</div>
            <p>${feedback}</p>
        `;
        quizQuestionsContainer.appendChild(summaryCard);

        // Save score to backend SQLite
        fetch('/api/quiz/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: quizSubject ? quizSubject.value : 'General',
                topic: quizTopic ? quizTopic.value : 'Quiz',
                difficulty: quizDifficulty ? quizDifficulty.value : 'Medium',
                score: score,
                total: total
            })
        }).catch(e => console.log('Score log error:', e));
    }

    if (btnResetQuiz) {
        btnResetQuiz.addEventListener('click', function () {
            if (currentQuizData.length > 0) {
                renderQuiz(currentQuizData, quizTopic.value);
            }
        });
    }

    // ---------------------------------------------------------------------
    // 8. Feature 5: Question & Answer Generator
    // ---------------------------------------------------------------------
    const qaForm = document.getElementById('qa-form');
    const qaSubject = document.getElementById('qa-subject');
    const qaTopic = document.getElementById('qa-topic');
    const qaDifficulty = document.getElementById('qa-difficulty');
    const qaNum = document.getElementById('qa-num');
    const qaLoading = document.getElementById('qa-loading');
    const qaResult = document.getElementById('qa-result');
    const qaContent = document.getElementById('qa-content');
    const qaResultTitle = document.getElementById('qa-result-title');

    if (qaForm) {
        qaForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const topic = qaTopic.value.trim();

            if (!topic) {
                alert('Please enter a topic for Q&A generation.');
                return;
            }

            qaLoading.classList.remove('hidden');
            qaResult.classList.add('hidden');

            try {
                const response = await fetch('/api/qa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: topic,
                        subject: qaSubject.value,
                        difficulty: qaDifficulty.value,
                        num_questions: parseInt(qaNum.value),
                        model: getActiveModel()
                    })
                });

                const data = await response.json();
                qaLoading.classList.add('hidden');

                if (data.success && data.qa_list && data.qa_list.length > 0) {
                    qaResultTitle.textContent = `Questions & Answers: ${data.topic || topic}`;
                    renderQAList(data.qa_list);
                    qaResult.classList.remove('hidden');
                    qaResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    alert(data.error || 'Failed to generate Q&A.');
                }
            } catch (err) {
                qaLoading.classList.add('hidden');
                alert('Error connecting to backend server.');
                console.error('QA error:', err);
            }
        });
    }

    function renderQAList(qaList) {
        qaContent.innerHTML = '';
        qaList.forEach((item, idx) => {
            const qaCard = document.createElement('div');
            qaCard.className = 'qa-card';

            const qHeading = document.createElement('div');
            qHeading.className = 'qa-question';
            qHeading.innerHTML = `<span class="qa-tag">Q${idx + 1}</span> <span>${escapeHtml(item.question)}</span>`;

            const aBody = document.createElement('div');
            aBody.className = 'qa-answer';
            aBody.innerHTML = formatMarkdown(item.answer);

            qaCard.appendChild(qHeading);
            qaCard.appendChild(aBody);
            qaContent.appendChild(qaCard);
        });
    }

    // ---------------------------------------------------------------------
    // 9. Copy to Clipboard Utility
    // ---------------------------------------------------------------------
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const text = targetEl.innerText || targetEl.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Clipboard copy failed:', err);
                });
            }
        });
    });

    // ---------------------------------------------------------------------
    // 10. Printable / Full Result View Utility
    // ---------------------------------------------------------------------
    document.querySelectorAll('.open-result-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const targetTitle = this.getAttribute('data-title') || 'Educational Tutor Study Brief';
            const targetEl = document.getElementById(targetId);

            if (targetEl) {
                const form = document.getElementById('print-view-form');
                document.getElementById('pv-title').value = targetTitle;
                document.getElementById('pv-content').value = targetEl.innerText || targetEl.textContent;
                form.submit();
            }
        });
    });

    // ---------------------------------------------------------------------
    // 11. Helper: Markdown to Clean HTML Formatter
    // ---------------------------------------------------------------------
    function formatMarkdown(text) {
        if (!text) return '';

        let html = text
            // Code blocks
            .replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold & Italic
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // Bullet points
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            // Numbered list
            .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
            // Paragraph breaks
            .replace(/\n\n+/gim, '</p><p>');

        // Wrap loose lis inside ul
        html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
        // Clean double uls
        html = html.replace(/<\/ul>\s*<ul>/gim, '');

        if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showToast(msg) {
        console.log('[Educational Tutor]', msg);
    }
});
