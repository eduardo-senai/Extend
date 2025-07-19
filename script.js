document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE INICIALIZAÇÃO GERAL ---
    const docElement = document.documentElement;

    // 1. TEMA (Light/Dark)
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        docElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';
        
        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            docElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // 2. TAMANHO DA FONTE
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        docElement.style.fontSize = savedFontSize;
    }

    // 3. ALTO CONTRASTE
    const contrastToggle = document.getElementById('contrast-toggle-checkbox');
    if (contrastToggle) {
        const savedContrast = localStorage.getItem('contrast') === 'high';
        if (savedContrast) {
            docElement.setAttribute('data-contrast', 'high');
        }
        contrastToggle.checked = savedContrast;

        contrastToggle.addEventListener('change', function() {
            if (this.checked) {
                docElement.setAttribute('data-contrast', 'high');
                localStorage.setItem('contrast', 'high');
            } else {
                docElement.removeAttribute('data-contrast');
                localStorage.removeItem('contrast');
            }
        });
    }

    // --- LISTENERS DE EVENTOS DE ACESSIBILIDADE ---
    const accessibilityFAB = document.querySelector('.accessibility-fab');
    const accessibilityMenu = document.querySelector('.accessibility-menu');
    if (accessibilityFAB && accessibilityMenu) {
        accessibilityFAB.addEventListener('click', (e) => {
            e.stopPropagation();
            accessibilityMenu.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!accessibilityMenu.contains(e.target) && !accessibilityFAB.contains(e.target)) {
                accessibilityMenu.classList.remove('active');
            }
        });
    }
    
    const FONT_STEP = 1, MIN_FONT = 12, MAX_FONT = 22, DEFAULT_FONT = 16;
    const decreaseFontBtn = document.getElementById('decrease-font');
    const increaseFontBtn = document.getElementById('increase-font');
    const resetFontBtn = document.getElementById('reset-font');

    const changeFontSize = (amount) => {
        let currentSize = parseFloat(getComputedStyle(docElement).fontSize);
        let newSize = Math.max(MIN_FONT, Math.min(MAX_FONT, currentSize + amount));
        docElement.style.fontSize = newSize + 'px';
        localStorage.setItem('fontSize', newSize + 'px');
    };

    if (decreaseFontBtn) decreaseFontBtn.addEventListener('click', () => changeFontSize(-FONT_STEP));
    if (increaseFontBtn) increaseFontBtn.addEventListener('click', () => changeFontSize(FONT_STEP));
    if (resetFontBtn) resetFontBtn.addEventListener('click', () => {
        docElement.style.fontSize = DEFAULT_FONT + 'px';
        localStorage.removeItem('fontSize');
    });

    // --- LÓGICA DO CHATBOT, CHAMADOS E DASHBOARD ---
    let knowledgeBase = JSON.parse(localStorage.getItem('knowledgeBaseDB')) || [
        // Saudações e Conversa
        { id: 1, question: "oi", answer: "Olá! Como posso te ajudar?" },
        { id: 2, question: "olá", answer: "Olá! Em que posso ser útil?" },
        { id: 3, question: "bom dia", answer: "Bom dia! Como posso te ajudar hoje?" },
        { id: 4, question: "boa tarde", answer: "Boa tarde! Precisa de alguma ajuda?" },
        { id: 5, question: "boa noite", answer: "Boa noite! Como posso te auxiliar?" },
        { id: 6, question: "tudo bem", answer: "Tudo ótimo por aqui! E com você? Me diga como posso ajudar." },
        { id: 7, question: "qual o seu nome", answer: "Meu nome é Extend, sou seu assistente virtual." },
        { id: 8, question: "como funciona o suporte", answer: "Você pode me fazer uma pergunta. Se eu não souber a resposta, um chamado será aberto automaticamente para a equipe de desenvolvedores." },
        // Perguntas Técnicas
        { id: 9, question: "o sistema está lento", answer: "Entendo. A lentidão pode ser causada por vários fatores. Recomendo que você verifique sua conexão com a internet e tente limpar o cache do seu navegador. Se o problema persistir, por favor, me dê mais detalhes sobre a tarefa que você está tentando executar." },
        { id: 10, question: "não consigo emitir relatório", answer: "Para problemas com relatórios, por favor, verifique se todos os campos obrigatórios do formulário estão preenchidos. Se o erro continuar, anote a mensagem de erro exata e me informe." },
        { id: 11, question: "esqueci minha senha", answer: "Na tela de login, você pode clicar em 'Esqueci minha senha' para iniciar o processo de recuperação. Um link será enviado para o seu e-mail cadastrado." },
        { id: 12, question: "erro ao salvar", answer: "Um erro ao salvar pode indicar um problema de conexão ou dados inválidos. Por favor, verifique sua internet e certifique-se de que todos os dados inseridos estão no formato correto (por exemplo, datas e números)." }
    ];
    let unansweredQuestions = JSON.parse(localStorage.getItem('unansweredDB')) || [];
    const saveData = () => {
        localStorage.setItem('knowledgeBaseDB', JSON.stringify(knowledgeBase));
        localStorage.setItem('unansweredDB', JSON.stringify(unansweredQuestions));
    };

    // --- LÓGICA DE NOTIFICAÇÃO (NOVO) ---
    const checkForNotifications = () => {
        const notificationDot = document.querySelector('.notification-dot');
        if (notificationDot) {
            const hasUnseen = unansweredQuestions.some(q => q.status === 'answered' && !q.seen);
            notificationDot.style.display = hasUnseen ? 'block' : 'none';
        }
    };

    // --- PÁGINA: MEUS CHAMADOS ---
    const chamadosList = document.getElementById('chamados-list');
    if (chamadosList) {
        const renderChamados = () => {
            // Marcar notificações como vistas ao entrar na página
            let madeChanges = false;
            unansweredQuestions.forEach(q => {
                if (q.status === 'answered' && !q.seen) {
                    q.seen = true;
                    madeChanges = true;
                }
            });
            if (madeChanges) saveData();

            chamadosList.innerHTML = '';
            if (unansweredQuestions.length === 0) {
                chamadosList.innerHTML = '<p>Você ainda não tem nenhum chamado aberto.</p>';
                return;
            }
            unansweredQuestions.slice().reverse().forEach(item => {
                const el = document.createElement('div');
                el.className = 'list-item';
                let answerHtml = item.status === 'answered'
                    ? `<div class="item-answer"><p><strong>Resposta:</strong> ${item.answer}</p></div>`
                    : `<p class="item-answer" style="color: var(--color-text-muted);">Aguardando resposta da nossa equipe.</p>`;
                let statusBadge = item.status === 'answered'
                    ? '<span class="status-badge status-answered">Respondido</span>'
                    : '<span class="status-badge status-pending">Pendente</span>';
                
                el.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <p class="item-question">${item.text}</p>
                        ${statusBadge}
                    </div>
                    ${answerHtml}
                `;
                chamadosList.appendChild(el);
            });
        };
        const clearButton = document.getElementById('clear-chamados-btn');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Você tem certeza que deseja apagar todos os chamados? Esta ação não pode ser desfeita.')) {
                    unansweredQuestions = [];
                    saveData();
                    renderChamados();
                }
            });
        }
        renderChamados();
    }

    // --- PÁGINA: DASHBOARD DO DESENVOLVEDOR ---
    const qaForm = document.getElementById('qa-form');
    if (qaForm) {
        const knowledgeBaseList = document.getElementById('knowledge-base-list');
        const questionInput = document.getElementById('question-input');
        const answerInput = document.getElementById('answer-input');
        const qaIdInput = document.getElementById('qa-id');
        const pendingList = document.getElementById('pending-questions-list');
        
        const renderKnowledgeBase = () => {
            knowledgeBaseList.innerHTML = '';
            knowledgeBase.slice().reverse().forEach(item => {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.innerHTML = `
                    <p class="item-question">${item.question}</p>
                    <div class="item-answer">${item.answer}</div>
                    <div class="item-actions">
                        <button class="action-btn edit-btn" onclick="editQA(${item.id})">Editar</button>
                        <button class="action-btn delete-btn" onclick="deleteQA(${item.id})">Excluir</button>
                    </div>`;
                knowledgeBaseList.appendChild(el);
            });
        };
        
        const renderPendingQuestions = () => {
            pendingList.innerHTML = '';
            const pending = unansweredQuestions.filter(q => q.status === 'pending');
            if (pending.length === 0) {
                pendingList.innerHTML = '<p>Nenhuma pergunta pendente. Bom trabalho!</p>';
                return;
            }
            pending.slice().reverse().forEach(item => {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.innerHTML = `
                    <p class="item-question">${item.text}</p>
                    <div class="item-actions">
                        <textarea class="form-control" id="answer-for-${item.id}" placeholder="Digite a resposta aqui..."></textarea>
                        <button class="action-btn resolve-btn" onclick="resolveQuestion(${item.id})">Responder e Adicionar à Base</button>
                    </div>`;
                pendingList.appendChild(el);
            });
        };
        
        qaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = qaIdInput.value;
            const question = questionInput.value.trim().toLowerCase();
            const answer = answerInput.value.trim();
            if (!question || !answer) return;
            if (id) {
                const itemIndex = knowledgeBase.findIndex(item => item.id == id);
                if (itemIndex > -1) knowledgeBase[itemIndex] = { ...knowledgeBase[itemIndex], question, answer };
            } else {
                knowledgeBase.push({ id: Date.now(), question, answer });
            }
            saveData();
            renderKnowledgeBase();
            qaForm.reset();
            qaIdInput.value = '';
        });
        
        window.editQA = (id) => {
            const item = knowledgeBase.find(item => item.id === id);
            if (item) {
                qaIdInput.value = item.id;
                questionInput.value = item.question;
                answerInput.value = item.answer;
                qaForm.scrollIntoView({ behavior: 'smooth' });
            }
        };
        
        window.deleteQA = (id) => {
            if (confirm('Tem certeza que deseja excluir este item da base de conhecimento?')) {
                knowledgeBase = knowledgeBase.filter(item => item.id !== id);
                saveData();
                renderKnowledgeBase();
            }
        };
        
        window.resolveQuestion = (id) => {
            const answerText = document.getElementById(`answer-for-${id}`).value.trim();
            if (!answerText) return alert('Por favor, digite uma resposta.');
            const questionIndex = unansweredQuestions.findIndex(q => q.id === id);
            if (questionIndex > -1) {
                unansweredQuestions[questionIndex].status = 'answered';
                unansweredQuestions[questionIndex].answer = answerText;
                unansweredQuestions[questionIndex].seen = false; // Marcar como não visto para a notificação
                
                // Adiciona à base de conhecimento
                knowledgeBase.push({ id: Date.now(), question: unansweredQuestions[questionIndex].text.toLowerCase(), answer: answerText });
                
                saveData();
                renderKnowledgeBase();
                renderPendingQuestions();
            }
        };
        
        renderKnowledgeBase();
        renderPendingQuestions();
    }

    // --- PÁGINA: CHAT DO USUÁRIO ---
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        const userInput = document.getElementById('user-input');
        const chatBox = document.getElementById('chat-box');
        
        const addMessage = (text, sender) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender}-message`;
            const p = document.createElement('p');
            p.textContent = text;
            messageDiv.appendChild(p);
            chatBox.appendChild(messageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        };
        
        const handleSendMessage = () => {
            const userQuestion = userInput.value.trim();
            if (userQuestion === '') return;
            addMessage(userQuestion, 'user');
            userInput.value = '';
            
            setTimeout(() => {
                const userQ_lower = userQuestion.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
                
                // Procura por uma correspondência que contenha a pergunta
                let foundQA = knowledgeBase.find(qa => userQ_lower.includes(qa.question));

                if (foundQA) {
                    addMessage(foundQA.answer, 'bot');
                } else {
                    addMessage("Não encontrei uma resposta para isso. Abri um chamado para você e nossa equipe irá responder em breve. Você pode acompanhá-lo na página 'Meus Chamados'.", 'bot');
                    if (!unansweredQuestions.some(q => q.text.toLowerCase() === userQuestion.toLowerCase())) {
                        unansweredQuestions.push({ id: Date.now(), text: userQuestion, status: 'pending', answer: null, seen: true });
                        saveData();
                    }
                }
            }, 500);
        };
        
        sendBtn.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendMessage(); });
    }

    // Executa a checagem de notificação em todas as páginas
    checkForNotifications();
});