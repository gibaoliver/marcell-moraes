// ============================================================================
// APP & STATE MANAGEMENT (SPA)
// ============================================================================

const APP_STATE = {
    currentView: 'home',
    isAdminLoggedIn: false,
    loggedInAgent: null
};

// ============================================================================
// LOCAL STORAGE MOCK DB
// ============================================================================

const initDB = () => {
    // Inicializa Cabos Eleitorais
    let agents = JSON.parse(localStorage.getItem('mm_agents'));
    if (!agents || agents.length === 0 || !agents[0].email) {
        const mockAgents = [
            { id: 1, name: 'João Silva', region: 'Brotas', email: 'joao@teste.com', pass: 'senha123' },
            { id: 2, name: 'Maria Santos', region: 'Cajazeiras', email: 'maria@teste.com', pass: 'senha123' },
            { id: 3, name: 'Carlos Oliveira', region: 'Ribeira', email: 'carlos@teste.com', pass: 'senha123' },
            { id: 4, name: 'Ana Costa', region: 'Pituba', email: 'ana@teste.com', pass: 'senha123' }
        ];
        localStorage.setItem('mm_agents', JSON.stringify(mockAgents));
    }

    // Inicializa Perguntas
    if (!localStorage.getItem('mm_questions')) {
        const mockQuestions = [
            {
                id: 1,
                text: 'Qual o principal problema do seu bairro atualmente?',
                options: ['Segurança Pública', 'Saúde Pública', 'Infraestrutura/Buracos', 'Transporte Público']
            },
            {
                id: 2,
                text: 'Você tem animais de estimação?',
                options: ['Sim, apenas cachorro', 'Sim, apenas gato', 'Sim, cães e gatos', 'Não possuo animais']
            },
            {
                id: 3,
                text: 'Como você avalia o acesso a serviços veterinários?',
                options: ['Excelente', 'Bom, mas pode melhorar', 'Ruim / Caro', 'Inexistente na minha região']
            }
        ];
        localStorage.setItem('mm_questions', JSON.stringify(mockQuestions));
    }

    // Inicializa Respostas
    if (!localStorage.getItem('mm_answers')) {
        localStorage.setItem('mm_answers', JSON.stringify([]));
    }
};

const getDB = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ============================================================================
// NAVIGATION (SPA)
// ============================================================================

window.navigate = (viewName) => {
    // Security check
    if (viewName === 'admin' && !APP_STATE.isAdminLoggedIn) {
        viewName = 'login';
    }
    if (viewName === 'survey' && !APP_STATE.loggedInAgent) {
        viewName = 'login';
    }

    APP_STATE.currentView = viewName;

    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });

    // Show target view
    const target = document.getElementById(`${viewName}-view`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // Header and Footer visibility
    const header = document.getElementById('main-header');
    const footer = document.getElementById('main-footer');
    if (viewName === 'home') {
        header.classList.remove('hidden');
        footer.classList.remove('hidden');
        window.scrollTo(0, 0);
    } else {
        header.classList.add('hidden');
        footer.classList.add('hidden');
    }

    // Page Specific Initializations
    if (viewName === 'survey') initSurvey();
    if (viewName === 'admin') initAdmin();
};

// ============================================================================
// SURVEY LOGIC
// ============================================================================

const initSurvey = () => {
    // Update Agent Header
    const headerName = document.getElementById('survey-agent-name');
    if (headerName && APP_STATE.loggedInAgent) {
        headerName.innerText = APP_STATE.loggedInAgent.name;
    }

    // Populate Questions
    const qContainer = document.getElementById('survey-questions-container');
    qContainer.innerHTML = '';
    const questions = getDB('mm_questions');
    
    questions.forEach((q, index) => {
        let optionsHtml = '';
        q.options.forEach(opt => {
            optionsHtml += `
                <label class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                    <input type="radio" name="q_${q.id}" value="${opt}" required class="w-4 h-4 text-blue-600 focus:ring-blue-500">
                    <span class="text-gray-700 text-sm">${opt}</span>
                </label>
            `;
        });

        qContainer.innerHTML += `
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p class="font-bold text-gray-800 mb-3">${index + 1}. ${q.text}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${optionsHtml}
                </div>
            </div>
        `;
    });
};

document.getElementById('survey-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!APP_STATE.loggedInAgent) return;
    const agentId = APP_STATE.loggedInAgent.id;
    const name = document.getElementById('survey-name').value;
    const phone = document.getElementById('survey-phone').value;
    
    // Collect answers
    const questions = getDB('mm_questions');
    const answersData = {};
    questions.forEach(q => {
        const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (selected) {
            answersData[q.id] = selected.value;
        }
    });

    const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        agentId: parseInt(agentId),
        name: name,
        phone: phone,
        answers: answersData
    };

    // Save to DB
    const allAnswers = getDB('mm_answers');
    allAnswers.push(newEntry);
    setDB('mm_answers', allAnswers);

    // Feedback to Agent
    alert('Pesquisa registrada com sucesso! Os dados já estão disponíveis no painel do Admin.');
    
    // Clear form to allow new submission
    e.target.reset();
    window.scrollTo(0, 0);
});

// ============================================================================
// LOGIN LOGIC
// ============================================================================

document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');

    if (user === 'admin' && pass === 'marcell30k') {
        APP_STATE.isAdminLoggedIn = true;
        errorEl.classList.add('hidden');
        document.getElementById('login-form').reset();
        navigate('admin');
    } else {
        const agents = getDB('mm_agents');
        const agentMatch = agents.find(a => a.email === user && a.pass === pass);
        
        if (agentMatch) {
            APP_STATE.loggedInAgent = agentMatch;
            errorEl.classList.add('hidden');
            document.getElementById('login-form').reset();
            navigate('survey');
        } else {
            errorEl.classList.remove('hidden');
        }
    }
});

window.logout = () => {
    APP_STATE.isAdminLoggedIn = false;
    APP_STATE.loggedInAgent = null;
    navigate('home');
};

// ============================================================================
// ADMIN LOGIC
// ============================================================================

window.switchAdminTab = (tabName) => {
    // Update Sidebar visually
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-400', 'bg-slate-800');
        btn.classList.add('text-slate-300');
    });
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-300');
        activeBtn.classList.add('text-blue-400', 'bg-slate-800');
    }

    // Update Content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`tab-${tabName === 'survey' ? 'survey-config' : tabName}`);
    if (activeContent) activeContent.classList.remove('hidden');

    // Update Title
    const titles = {
        'dashboard': 'Dashboard Geral',
        'crm': 'Fichas de Entrevistados (CRM)',
        'agents': 'Gestão de Cabos Eleitorais',
        'survey': 'Configuração de Enquete'
    };
    document.getElementById('admin-page-title').innerText = titles[tabName];
};

const initAdmin = () => {
    switchAdminTab('dashboard');
    renderDashboard();
    renderCRM();
    renderAgents();
    renderQuestions();
};

// --- DASHBOARD ---
const renderDashboard = () => {
    const agents = getDB('mm_agents');
    const questions = getDB('mm_questions');
    const answers = getDB('mm_answers');

    // Basic Metrics
    document.getElementById('dash-total-interviews').innerText = answers.length;
    document.getElementById('dash-total-agents').innerText = agents.length;
    document.getElementById('dash-total-questions').innerText = questions.length;

    // Calculate Agent Rankings
    const agentCounts = {};
    agents.forEach(a => agentCounts[a.id] = 0);
    answers.forEach(ans => {
        if(agentCounts[ans.agentId] !== undefined) {
            agentCounts[ans.agentId]++;
        }
    });

    let topAgentId = null;
    let maxCount = -1;
    const rankingArray = [];

    agents.forEach(a => {
        const count = agentCounts[a.id];
        rankingArray.push({ name: a.name, count: count });
        if (count > maxCount) {
            maxCount = count;
            topAgentId = a.id;
        }
    });

    const topAgent = agents.find(a => a.id === topAgentId);
    document.getElementById('dash-top-agent').innerText = topAgent ? topAgent.name : '-';

    // Destroy existing charts
    if (window.dashCharts) {
        window.dashCharts.forEach(c => c.destroy());
    }
    window.dashCharts = [];

    // 1. Evolução Chart (Line)
    const evolutionCtx = document.getElementById('chart-evolution');
    if (evolutionCtx) {
        const dateCounts = {};
        answers.forEach(ans => {
            const d = new Date(ans.date).toLocaleDateString('pt-BR');
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        });
        
        // Sort dates
        const labels = Object.keys(dateCounts).sort((a,b) => {
            const pa = a.split('/');
            const pb = b.split('/');
            return new Date(pa[2], pa[1]-1, pa[0]) - new Date(pb[2], pb[1]-1, pb[0]);
        });
        const data = labels.map(l => dateCounts[l]);
        
        window.dashCharts.push(new Chart(evolutionCtx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['Sem dados'],
                datasets: [{
                    label: 'Pesquisas Realizadas',
                    data: data.length ? data : [0],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        }));
    }

    // 2. Agents Chart (Doughnut)
    const agentsCtx = document.getElementById('chart-agents');
    if (agentsCtx) {
        rankingArray.sort((a, b) => b.count - a.count);
        window.dashCharts.push(new Chart(agentsCtx, {
            type: 'doughnut',
            data: {
                labels: rankingArray.map(r => r.name),
                datasets: [{
                    data: rankingArray.map(r => r.count),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        }));
    }

    // 3. Questions Charts
    const qContainer = document.getElementById('dash-questions-charts');
    if (qContainer) {
        qContainer.innerHTML = '';
        questions.forEach((q, index) => {
            const chartId = `chart-q-${q.id}`;
            qContainer.innerHTML += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-md font-bold text-gray-800 mb-4 truncate" title="${q.text}">P${index + 1}: ${q.text}</h3>
                    <div class="w-full h-64 relative">
                        <canvas id="${chartId}"></canvas>
                    </div>
                </div>
            `;
        });

        // Render charts after DOM update
        setTimeout(() => {
            questions.forEach(q => {
                const ctx = document.getElementById(`chart-q-${q.id}`);
                if (!ctx) return;
                
                const answersCount = {};
                q.options.forEach(opt => answersCount[opt] = 0);
                answers.forEach(ans => {
                    const val = ans.answers[q.id];
                    if (val && answersCount[val] !== undefined) {
                        answersCount[val]++;
                    }
                });

                window.dashCharts.push(new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: q.options,
                        datasets: [{
                            label: 'Respostas',
                            data: q.options.map(opt => answersCount[opt]),
                            backgroundColor: '#6366f1',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                    }
                }));
            });
        }, 50);
    }
};

// --- CRM ---
const renderCRM = () => {
    const agents = getDB('mm_agents');
    const filterSelect = document.getElementById('crm-filter-agent');
    
    // Setup filters
    if(filterSelect.options.length <= 1) {
        agents.forEach(a => {
            filterSelect.innerHTML += `<option value="${a.id}">${a.name}</option>`;
        });
        
        filterSelect.addEventListener('change', populateCRMTable);
        document.getElementById('crm-search').addEventListener('input', populateCRMTable);
    }
    
    populateCRMTable();
};

const populateCRMTable = () => {
    const answers = getDB('mm_answers');
    const agents = getDB('mm_agents');
    const searchVal = document.getElementById('crm-search').value.toLowerCase();
    const filterVal = document.getElementById('crm-filter-agent').value;
    
    const tbody = document.getElementById('crm-table-body');
    tbody.innerHTML = '';
    
    // Sort descending by date
    answers.sort((a, b) => new Date(b.date) - new Date(a.date));

    answers.forEach(ans => {
        const agent = agents.find(a => a.id === ans.agentId);
        const agentName = agent ? agent.name : 'Desconhecido';
        
        // Apply filters
        if (filterVal !== 'all' && ans.agentId.toString() !== filterVal) return;
        if (searchVal && !ans.name.toLowerCase().includes(searchVal) && !ans.phone.includes(searchVal)) return;

        const dateStr = new Date(ans.date).toLocaleString('pt-BR');
        
        // Clean phone for wa link
        const cleanPhone = ans.phone.replace(/\D/g, '');
        const waMsg = encodeURIComponent(`Olá ${ans.name}, aqui é do Gabinete de Marcell Moraes. Queríamos agradecer sua participação!`);
        
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-gray-500">${dateStr}</td>
                <td class="px-6 py-4 font-medium text-gray-900">${ans.name}</td>
                <td class="px-6 py-4 text-gray-500">${ans.phone}</td>
                <td class="px-6 py-4 text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${agentName}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <a href="https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${waMsg}" target="_blank" class="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg inline-flex items-center transition-colors">
                        <i class="fab fa-whatsapp mr-1"></i> Contatar
                    </a>
                </td>
            </tr>
        `;
    });
};

// --- AGENTS CRUD ---
const renderAgents = () => {
    const agents = getDB('mm_agents');
    const answers = getDB('mm_answers');
    const grid = document.getElementById('agents-grid');
    grid.innerHTML = '';

    agents.forEach(agent => {
        const count = answers.filter(a => a.agentId === agent.id).length;
        grid.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
                <div class="flex justify-between items-start mb-4">
                    <div class="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <i class="fas fa-user-tag text-xl"></i>
                    </div>
                    <button onclick="deleteAgent(${agent.id})" class="text-red-400 hover:text-red-600 p-1 transition-colors" title="Deletar Cabo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <h4 class="text-lg font-bold text-gray-800">${agent.name}</h4>
                <p class="text-sm text-gray-500 mb-1"><i class="fas fa-map-marker-alt mr-1"></i> ${agent.region}</p>
                <p class="text-xs text-gray-400 mb-1"><i class="fas fa-envelope mr-1"></i> ${agent.email || 'N/A'}</p>
                <p class="text-xs text-gray-400 mb-4"><i class="fas fa-key mr-1"></i> ${agent.pass || 'N/A'}</p>
                <div class="mt-auto pt-4 border-t border-gray-100">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-500">Pesquisas feitas</span>
                        <span class="text-lg font-bold text-blue-600">${count}</span>
                    </div>
                </div>
            </div>
        `;
    });
};

document.getElementById('add-agent-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-agent-name').value;
    const region = document.getElementById('new-agent-region').value;
    
    const agents = getDB('mm_agents');
    agents.push({
        id: Date.now(),
        name: name,
        region: region
    });
    setDB('mm_agents', agents);
    
    e.target.reset();
    renderAgents();
    renderDashboard(); // Update dash metrics
});

window.deleteAgent = (id) => {
    if(confirm('Tem certeza que deseja deletar este cabo eleitoral?')) {
        const agents = getDB('mm_agents');
        setDB('mm_agents', agents.filter(a => a.id !== id));
        renderAgents();
        renderDashboard();
    }
};

// --- QUESTIONS CRUD ---
const renderQuestions = () => {
    const questions = getDB('mm_questions');
    const list = document.getElementById('questions-list');
    list.innerHTML = '';

    questions.forEach((q, index) => {
        let optsHtml = '';
        q.options.forEach(opt => {
            optsHtml += `<span class="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600 mr-2 mb-2">${opt}</span>`;
        });

        list.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex justify-between items-center group">
                <div>
                    <h4 class="font-bold text-gray-800 mb-2">Q${index + 1}. ${q.text}</h4>
                    <div class="flex flex-wrap">
                        ${optsHtml}
                    </div>
                </div>
                <button onclick="deleteQuestion(${q.id})" class="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity" title="Deletar Pergunta">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
};

document.getElementById('add-question-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('new-q-text').value;
    const options = [
        document.getElementById('new-q-opt1').value,
        document.getElementById('new-q-opt2').value,
        document.getElementById('new-q-opt3').value,
        document.getElementById('new-q-opt4').value
    ];
    
    const questions = getDB('mm_questions');
    questions.push({
        id: Date.now(),
        text: text,
        options: options
    });
    setDB('mm_questions', questions);
    
    e.target.reset();
    renderQuestions();
    renderDashboard();
});

window.deleteQuestion = (id) => {
    if(confirm('Tem certeza que deseja deletar esta pergunta? Ela sairá do formulário público.')) {
        const questions = getDB('mm_questions');
        setDB('mm_questions', questions.filter(q => q.id !== id));
        renderQuestions();
        renderDashboard();
    }
};

// ============================================================================
// BOOTSTRAP
// ============================================================================

initDB();
// Determine initial view from hash or default to home
// (Not requested, but good practice. We'll stick to 'home' on load)
navigate('home');
