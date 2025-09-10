// Data storage
        let goals = JSON.parse(localStorage.getItem('goals')) || [];
        let currentEditId = null;
        let charts = {};

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            updateDashboard();
            renderGoalsList();
            initCharts();
        });

        // Navigation
        function showPage(pageId) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Remove active class from nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Show selected page
            document.getElementById(pageId).classList.add('active');
            
            // Add active class to clicked nav item
            event.target.classList.add('active');
            
            // Update charts if showing analytics
            if (pageId === 'analytics') {
                updateAnalytics();
            }
            
            // Update dashboard if showing dashboard
            if (pageId === 'dashboard') {
                updateDashboard();
            }
        }

        // Goal creation
        document.getElementById('goalForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const goal = {
                id: Date.now(),
                title: document.getElementById('goalTitle').value,
                description: document.getElementById('goalDescription').value,
                difficulty: document.getElementById('goalDifficulty').value,
                frequency: document.getElementById('goalFrequency').value,
                deadline: document.getElementById('goalDeadline').value || null,
                createdDate: new Date().toISOString(),
                completed: false,
                completions: [],
                nextDue: calculateNextDue(document.getElementById('goalFrequency').value)
            };
            
            goals.push(goal);
            saveGoals();
            updateDashboard();
            renderGoalsList();
            resetForm();
            
            // Show success message
            alert('¡Objetivo creado exitosamente!');
        });

        function calculateNextDue(frequency) {
            const now = new Date();
            switch(frequency) {
                case 'diario':
                    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
                case 'semanal':
                    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                case 'mensual':
                    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                default:
                    return null;
            }
        }

        function resetForm() {
            document.getElementById('goalForm').reset();
        }

        function saveGoals() {
            localStorage.setItem('goals', JSON.stringify(goals));
        }

        // Dashboard updates
        function updateDashboard() {
            const totalGoals = goals.length;
            const completedGoals = goals.filter(g => g.completed || g.completions.length > 0).length;
            const activeGoals = goals.filter(g => !g.completed).length;
            const successRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

            document.getElementById('totalGoals').textContent = totalGoals;
            document.getElementById('completedGoals').textContent = completedGoals;
            document.getElementById('activeGoals').textContent = activeGoals;
            document.getElementById('successRate').textContent = successRate + '%';

            updateDashboardCharts();
        }

        function updateDashboardCharts() {
            // Difficulty chart
            const difficultyData = {
                facil: goals.filter(g => g.difficulty === 'facil').length,
                medio: goals.filter(g => g.difficulty === 'medio').length,
                dificil: goals.filter(g => g.difficulty === 'dificil').length
            };

            if (charts.difficulty) {
                charts.difficulty.destroy();
            }

            const diffCtx = document.getElementById('difficultyChart').getContext('2d');
            charts.difficulty = new Chart(diffCtx, {
                type: 'bar',
                data: {
                    labels: ['Fácil', 'Medio', 'Difícil'],
                    datasets: [{
                        label: 'Número de Objetivos',
                        data: [difficultyData.facil, difficultyData.medio, difficultyData.dificil],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(255, 99, 132, 0.8)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });

            // Completion chart
            const completed = goals.filter(g => g.completed || g.completions.length > 0).length;
            const pending = goals.length - completed;

            if (charts.completion) {
                charts.completion.destroy();
            }

            const compCtx = document.getElementById('completionChart').getContext('2d');
            charts.completion = new Chart(compCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completados', 'Pendientes'],
                    datasets: [{
                        data: [completed, pending],
                        backgroundColor: [
                            'rgba(102, 126, 234, 0.8)',
                            'rgba(118, 75, 162, 0.8)'
                        ],
                        borderColor: [
                            'rgba(102, 126, 234, 1)',
                            'rgba(118, 75, 162, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function initCharts() {
            updateDashboardCharts();
        }

        function updateAnalytics() {
            // Get theme-appropriate colors
            const isDark = document.body.classList.contains('dark-theme');
            const textColor = isDark ? '#e0e6ed' : '#333';
            const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            
            // Trend chart
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                last7Days.push({
                    date: date.toISOString().split('T')[0],
                    completed: goals.filter(g => {
                        return g.completions.some(c => c.date.split('T')[0] === date.toISOString().split('T')[0]);
                    }).length
                });
            }

            if (charts.trend) {
                charts.trend.destroy();
            }

            const trendCtx = document.getElementById('trendChart').getContext('2d');
            charts.trend = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: last7Days.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [{
                        label: 'Objetivos Completados',
                        data: last7Days.map(d => d.completed),
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: gridColor
                            },
                            ticks: {
                                color: textColor
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: textColor
                            }
                        }
                    }
                }
            });

            // Frequency chart
            const frequencyData = {
                unico: goals.filter(g => g.frequency === 'unico').length,
                diario: goals.filter(g => g.frequency === 'diario').length,
                semanal: goals.filter(g => g.frequency === 'semanal').length,
                mensual: goals.filter(g => g.frequency === 'mensual').length
            };

            if (charts.frequency) {
                charts.frequency.destroy();
            }

            const freqCtx = document.getElementById('frequencyChart').getContext('2d');
            charts.frequency = new Chart(freqCtx, {
                type: 'pie',
                data: {
                    labels: ['Único', 'Diario', 'Semanal', 'Mensual'],
                    datasets: [{
                        data: [frequencyData.unico, frequencyData.diario, frequencyData.semanal, frequencyData.mensual],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: textColor
                            }
                        }
                    }
                }
            });
        }

        // Goals list management
        function renderGoalsList() {
            const container = document.getElementById('goalsList');
            if (goals.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No tienes objetivos creados aún. ¡Comienza creando tu primer objetivo!</p>';
                return;
            }

            container.innerHTML = goals.map(goal => {
                const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.completed;
                const progress = goal.frequency === 'unico' 
                    ? (goal.completed ? 100 : 0)
                    : Math.min((goal.completions.length / 10) * 100, 100); // Assuming 10 as target for recurring goals

                return `
                    <div class="goal-item ${isOverdue ? 'overdue' : ''}">
                        <div class="goal-description">${goal.description}</div>
                        <div class="goal-meta">
                            <span>Frecuencia: ${goal.frequency}</span>
                            <span>${goal.deadline ? `Vence: ${new Date(goal.deadline).toLocaleDateString()}` : 'Sin fecha límite'}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="goal-actions">
                            ${goal.frequency === 'unico' && !goal.completed ? 
                                `<button class="btn btn-small" onclick="markComplete(${goal.id})">Marcar Completado</button>` :
                                goal.frequency !== 'unico' ? 
                                `<button class="btn btn-small" onclick="recordCompletion(${goal.id})">Registrar Completado</button>` : ''
                            }
                            <button class="btn btn-small btn-secondary" onclick="editGoal(${goal.id})">Editar</button>
                            <button class="btn btn-small btn-danger" onclick="deleteGoal(${goal.id})">Eliminar</button>
                        </div>
                        ${goal.completions.length > 0 ? 
                            `<div style="margin-top: 10px; font-size: 12px; color: #666;">
                                Completado ${goal.completions.length} veces. Última vez: ${new Date(goal.completions[goal.completions.length - 1].date).toLocaleDateString()}
                            </div>` : ''
                        }
                    </div>
                `;
            }).join('');
        }

        function markComplete(goalId) {
            const goal = goals.find(g => g.id === goalId);
            if (goal && goal.frequency === 'unico') {
                goal.completed = true;
                goal.completions.push({
                    date: new Date().toISOString(),
                    success: true
                });
                saveGoals();
                updateDashboard();
                renderGoalsList();
            }
        }

        function recordCompletion(goalId) {
            const goal = goals.find(g => g.id === goalId);
            if (goal && goal.frequency !== 'unico') {
                goal.completions.push({
                    date: new Date().toISOString(),
                    success: true
                });
                goal.nextDue = calculateNextDue(goal.frequency);
                saveGoals();
                updateDashboard();
                renderGoalsList();
            }
        }

        function editGoal(goalId) {
            const goal = goals.find(g => g.id === goalId);
            if (goal) {
                currentEditId = goalId;
                document.getElementById('editTitle').value = goal.title;
                document.getElementById('editDescription').value = goal.description;
                document.getElementById('editDifficulty').value = goal.difficulty;
                document.getElementById('editFrequency').value = goal.frequency;
                document.getElementById('editDeadline').value = goal.deadline || '';
                document.getElementById('editModal').style.display = 'block';
            }
        }

        function deleteGoal(goalId) {
            if (confirm('¿Estás seguro de que quieres eliminar este objetivo? Esta acción no se puede deshacer.')) {
                goals = goals.filter(g => g.id !== goalId);
                saveGoals();
                updateDashboard();
                renderGoalsList();
            }
        }

        // Edit modal functions
        function closeEditModal() {
            document.getElementById('editModal').style.display = 'none';
            currentEditId = null;
        }

        document.getElementById('editForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (currentEditId) {
                const goal = goals.find(g => g.id === currentEditId);
                if (goal) {
                    goal.title = document.getElementById('editTitle').value;
                    goal.description = document.getElementById('editDescription').value;
                    goal.difficulty = document.getElementById('editDifficulty').value;
                    goal.frequency = document.getElementById('editFrequency').value;
                    goal.deadline = document.getElementById('editDeadline').value || null;
                    
                    saveGoals();
                    updateDashboard();
                    renderGoalsList();
                    closeEditModal();
                    alert('¡Objetivo actualizado exitosamente!');
                }
            }
        });

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeEditModal();
            }
        }

        // Auto-check for overdue recurring goals
        function checkOverdueGoals() {
            const now = new Date();
            goals.forEach(goal => {
                if (goal.frequency !== 'unico' && goal.nextDue && new Date(goal.nextDue) < now) {
                    // Goal is overdue, could add notification logic here
                    console.log(`Goal "${goal.title}" is overdue`);
                }
            });
        }

        // Check for overdue goals every minute
        setInterval(checkOverdueGoals, 60000);

        // Sample data for demonstration (remove in production)
        if (goals.length === 0) {
            // Add some sample goals for demonstration
            const sampleGoals = [
                {
                    id: 1,
                    title: "Ejercicio diario",
                    description: "Hacer 30 minutos de ejercicio todos los días",
                    difficulty: "medio",
                    frequency: "diario",
                    deadline: null,
                    createdDate: new Date().toISOString(),
                    completed: false,
                    completions: [
                        { date: new Date(Date.now() - 86400000).toISOString(), success: true },
                        { date: new Date(Date.now() - 172800000).toISOString(), success: true }
                    ],
                    nextDue: new Date(Date.now() + 86400000)
                },
                {
                    id: 2,
                    title: "Leer un libro",
                    description: "Terminar de leer 'El Quijote'",
                    difficulty: "dificil",
                    frequency: "unico",
                    deadline: "2025-12-31",
                    createdDate: new Date().toISOString(),
                    completed: false,
                    completions: [],
                    nextDue: null
                },
                {
                    id: 3,
                    title: "Meditar",
                    description: "Sesión de meditación de 15 minutos",
                    difficulty: "facil",
                    frequency: "diario",
                    deadline: null,
                    createdDate: new Date().toISOString(),
                    completed: false,
                    completions: [
                        { date: new Date().toISOString(), success: true }
                    ],
                    nextDue: new Date(Date.now() + 86400000)
                }
            ];
            
            goals = sampleGoals;
            saveGoals();
        }

        // Initialize with sample data
        updateDashboard();
        renderGoalsList();