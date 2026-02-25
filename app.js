// ===========================
// Lightbeast Task Manager - Enhanced
// ===========================

(function () {
    'use strict';

    // ===========================
    // State Management
    // ===========================
    const state = {
        tasks: [],
        currentView: 'daily',
        currentDate: new Date(),
        theme: 'light',
        filters: {
            search: '',
            status: 'all',
            priority: 'all'
        },
        sortBy: 'manual',
        editingTaskId: null,
        deleteTaskId: null,
        tempSubtasks: [] // For modal subtask editing
    };

    // ===========================
    // DOM Elements
    // ===========================
    const elements = {
        themeToggle: document.getElementById('theme-toggle'),
        viewButtons: document.querySelectorAll('.view-btn'),
        prevPeriod: document.getElementById('prev-period'),
        nextPeriod: document.getElementById('next-period'),
        currentPeriod: document.getElementById('current-period'),
        searchInput: document.getElementById('search-input'),
        searchClear: document.getElementById('search-clear'),
        statusFilter: document.getElementById('status-filter'),
        priorityFilter: document.getElementById('priority-filter'),
        sortBy: document.getElementById('sort-by'),
        quickAddInput: document.getElementById('quick-add-input'),
        expandFormBtn: document.getElementById('expand-form-btn'),
        clearCompletedBtn: document.getElementById('clear-completed-btn'),
        tasksContainer: document.getElementById('tasks-container'),
        taskModal: document.getElementById('task-modal'),
        deleteModal: document.getElementById('delete-modal'),
        taskForm: document.getElementById('task-form'),
        modalCloses: document.querySelectorAll('.modal-close'),
        cancelDelete: document.getElementById('cancel-delete'),
        confirmDelete: document.getElementById('confirm-delete'),
        toast: document.getElementById('toast'),
        // Stats
        statTotal: document.getElementById('stat-total'),
        statActive: document.getElementById('stat-active'),
        statCompleted: document.getElementById('stat-completed'),
        statProgress: document.getElementById('stat-progress'),
        progressBarFill: document.getElementById('progress-bar-fill'),
        // Subtasks
        subtaskInput: document.getElementById('subtask-input'),
        addSubtaskBtn: document.getElementById('add-subtask-btn'),
        subtaskList: document.getElementById('subtask-list')
    };

    // ===========================
    // Utility Functions
    // ===========================

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatDateShort(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getDayName(date) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    function getShortDayName(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    function isToday(date) {
        const today = new Date();
        const d = new Date(date);
        return d.toDateString() === today.toDateString();
    }

    function isOverdue(date) {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d < today;
    }

    function getDateString(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    function getWeekDates(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const weekDate = new Date(monday);
            weekDate.setDate(monday.getDate() + i);
            dates.push(weekDate);
        }
        return dates;
    }

    function getRelativeDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));

        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        if (diff === -1) return 'Yesterday';
        if (diff > 1 && diff <= 7) return `In ${diff} days`;
        if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`;
        return formatDateShort(dateStr);
    }

    function showToast(message, type = 'success') {
        const toastMsg = elements.toast.querySelector('.toast-message');
        if (toastMsg) toastMsg.textContent = message;
        elements.toast.className = `toast ${type}`;

        // Force reflow for re-animation
        elements.toast.offsetHeight;
        elements.toast.classList.add('show');

        clearTimeout(showToast._timeout);
        showToast._timeout = setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // ===========================
    // Storage Functions
    // ===========================

    function saveToStorage() {
        try {
            localStorage.setItem('lb_tasks', JSON.stringify(state.tasks));
            localStorage.setItem('lb_theme', state.theme);
            localStorage.setItem('lb_currentView', state.currentView);
            localStorage.setItem('lb_currentDate', state.currentDate.toISOString());
            localStorage.setItem('lb_filters', JSON.stringify(state.filters));
            localStorage.setItem('lb_sortBy', state.sortBy);
        } catch (e) {
            console.warn('Storage save failed:', e);
        }
    }

    function loadFromStorage() {
        try {
            const tasks = localStorage.getItem('lb_tasks');
            if (tasks) {
                state.tasks = JSON.parse(tasks);
                // Migrate old tasks: add subtasks field if missing
                state.tasks.forEach(t => {
                    if (!Array.isArray(t.subtasks)) t.subtasks = [];
                });
            }

            const theme = localStorage.getItem('lb_theme');
            if (theme) {
                state.theme = theme;
                document.documentElement.setAttribute('data-theme', theme);
            }

            const currentView = localStorage.getItem('lb_currentView');
            if (currentView) state.currentView = currentView;

            const currentDate = localStorage.getItem('lb_currentDate');
            if (currentDate) state.currentDate = new Date(currentDate);

            const filters = localStorage.getItem('lb_filters');
            if (filters) {
                state.filters = JSON.parse(filters);
                elements.searchInput.value = state.filters.search;
                elements.statusFilter.value = state.filters.status;
                elements.priorityFilter.value = state.filters.priority;
                updateSearchClear();
            }

            const sortBy = localStorage.getItem('lb_sortBy');
            if (sortBy) {
                state.sortBy = sortBy;
                elements.sortBy.value = sortBy;
            }
        } catch (e) {
            console.warn('Storage load failed:', e);
        }
    }

    // ===========================
    // Task Functions
    // ===========================

    function addTask(taskData) {
        const task = {
            id: generateId(),
            title: taskData.title,
            description: taskData.description || '',
            dueDate: taskData.dueDate || null,
            priority: taskData.priority || 'medium',
            category: taskData.category || '',
            completed: false,
            subtasks: taskData.subtasks || [],
            order: state.tasks.length,
            createdAt: new Date().toISOString()
        };

        state.tasks.push(task);
        saveToStorage();
        showToast('Task added successfully!');
        render();
    }

    function updateTask(id, updates) {
        const taskIndex = state.tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
            saveToStorage();
            showToast('Task updated!');
            render();
        }
    }

    function deleteTask(id) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveToStorage();
        showToast('Task deleted!');
        render();
    }

    function toggleTaskComplete(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            // If completing, also complete all subtasks
            if (task.completed) {
                task.subtasks.forEach(st => st.completed = true);
            }
            saveToStorage();
            render();
        }
    }

    function toggleSubtask(taskId, subtaskIndex) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.subtasks[subtaskIndex] !== undefined) {
            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;

            // If all subtasks done => mark parent done
            const allDone = task.subtasks.every(st => st.completed);
            if (allDone && task.subtasks.length > 0) {
                task.completed = true;
            } else if (!task.subtasks[subtaskIndex].completed) {
                task.completed = false;
            }

            saveToStorage();
            render();
        }
    }

    function clearCompleted() {
        const completedCount = state.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            showToast('No completed tasks to clear', 'error');
            return;
        }

        state.tasks = state.tasks.filter(t => !t.completed);
        saveToStorage();
        showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}!`);
        render();
    }

    function duplicateTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            const newTask = {
                ...JSON.parse(JSON.stringify(task)),
                id: generateId(),
                completed: false,
                title: task.title + ' (copy)',
                order: state.tasks.length,
                createdAt: new Date().toISOString()
            };
            newTask.subtasks.forEach(st => st.completed = false);
            state.tasks.push(newTask);
            saveToStorage();
            showToast('Task duplicated!');
            render();
        }
    }

    // ===========================
    // Filter & Sort Functions
    // ===========================

    function getFilteredTasks() {
        let filtered = [...state.tasks];

        if (state.filters.search) {
            const search = state.filters.search.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(search) ||
                task.description.toLowerCase().includes(search) ||
                (task.category && task.category.toLowerCase().includes(search))
            );
        }

        if (state.filters.status === 'active') {
            filtered = filtered.filter(task => !task.completed);
        } else if (state.filters.status === 'completed') {
            filtered = filtered.filter(task => task.completed);
        }

        if (state.filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === state.filters.priority);
        }

        return filtered;
    }

    function sortTasks(tasks) {
        const sorted = [...tasks];

        if (state.sortBy === 'dueDate') {
            sorted.sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        } else if (state.sortBy === 'priority') {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        } else if (state.sortBy === 'alphabetical') {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            sorted.sort((a, b) => a.order - b.order);
        }

        return sorted;
    }

    // ===========================
    // Stats
    // ===========================

    function updateStats() {
        const total = state.tasks.length;
        const completed = state.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        // Animate the numbers
        animateValue(elements.statTotal, parseInt(elements.statTotal.textContent) || 0, total, 300);
        animateValue(elements.statActive, parseInt(elements.statActive.textContent) || 0, active, 300);
        animateValue(elements.statCompleted, parseInt(elements.statCompleted.textContent) || 0, completed, 300);
        elements.statProgress.textContent = progress + '%';
        elements.progressBarFill.style.width = progress + '%';
    }

    function animateValue(element, start, end, duration) {
        if (start === end) { element.textContent = end; return; }
        const range = end - start;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            element.textContent = Math.round(start + range * eased);
            if (t < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // ===========================
    // Drag & Drop Functions
    // ===========================

    let draggedTask = null;
    let draggedFrom = null;

    function handleDragStart(e) {
        draggedTask = e.target;
        draggedFrom = e.target.closest('.day-column')?.dataset.date || 'daily';
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedTask = null;
        draggedFrom = null;
        // Remove any lingering drag-over states
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        const dropZone = e.target.closest('.day-tasks') || e.target.closest('.day-column');
        if (dropZone && dropZone.classList.contains('day-column')) {
            dropZone.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const dropZone = e.target.closest('.day-column');
        if (dropZone && !dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();

        const dropZone = e.target.closest('.day-tasks') || e.target.closest('.day-column');
        if (!dropZone || !draggedTask) return;

        const column = dropZone.closest('.day-column');
        if (column) column.classList.remove('drag-over');

        const taskId = draggedTask.dataset.taskId;
        const targetDate = column?.dataset.date;

        if (state.currentView === 'weekly' && targetDate) {
            updateTask(taskId, { dueDate: targetDate });
        } else {
            const afterElement = getDragAfterElement(dropZone, e.clientY);

            if (afterElement == null) {
                dropZone.appendChild(draggedTask);
            } else {
                dropZone.insertBefore(draggedTask, afterElement);
            }
            updateTaskOrder(dropZone);
        }

        return false;
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateTaskOrder(container) {
        const taskCards = container.querySelectorAll('.task-card');
        taskCards.forEach((card, index) => {
            const taskId = card.dataset.taskId;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) task.order = index;
        });
        saveToStorage();
    }

    // ===========================
    // Render Functions
    // ===========================

    const CATEGORY_MAP = {
        'work': 'work',
        'trabajo': 'work',
        'personal': 'personal',
        'health': 'health',
        'salud': 'health',
        'study': 'study',
        'estudio': 'study',
        'finance': 'finance',
        'finanzas': 'finance'
    };

    function getCategoryClass(category) {
        if (!category) return '';
        const slug = category.toLowerCase().trim();
        const mapped = CATEGORY_MAP[slug];
        return mapped ? `category-${mapped}` : 'category-other';
    }

    function renderSubtaskProgress(task) {
        if (!task.subtasks || task.subtasks.length === 0) return '';
        const done = task.subtasks.filter(st => st.completed).length;
        const total = task.subtasks.length;
        const pct = Math.round((done / total) * 100);

        const subtaskItems = task.subtasks.map((st, i) => `
            <label class="card-subtask-item">
                <input type="checkbox" class="card-subtask-check"
                       ${st.completed ? 'checked' : ''}
                       data-subtask-toggle="true"
                       data-task-id="${task.id}"
                       data-subtask-index="${i}">
                <span class="card-subtask-label ${st.completed ? 'done' : ''}">${escapeHtml(st.title)}</span>
            </label>
        `).join('');

        return `
            <div class="subtask-progress">
                <div class="subtask-progress-bar">
                    <div class="subtask-progress-fill" style="width: ${pct}%"></div>
                </div>
                <span class="subtask-progress-text">${done}/${total}</span>
            </div>
            <div class="card-subtask-list">
                ${subtaskItems}
            </div>
        `;
    }

    function renderTaskCard(task) {
        const isTaskOverdue = task.dueDate && isOverdue(task.dueDate) && !task.completed;
        const dateLabel = task.dueDate ? getRelativeDate(task.dueDate) : '';
        const catClass = getCategoryClass(task.category);
        const priorityLabel = task.priority.toUpperCase();

        return `
            <div class="task-card ${task.completed ? 'completed' : ''} priority-${task.priority} ${catClass}"
                 draggable="true"
                 data-task-id="${task.id}">
                <div class="task-header">
                    <input type="checkbox"
                           class="task-checkbox"
                           ${task.completed ? 'checked' : ''}
                           data-task-id="${task.id}"
                           aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
                    <div class="task-content">
                        <div class="task-title-text">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        ${renderSubtaskProgress(task)}
                        <div class="task-meta">
                            <span class="task-badge badge-priority ${task.priority}"><span class="urgency-dot"></span>${priorityLabel}</span>
                            ${task.category ? `<span class="task-badge badge-category">${escapeHtml(task.category)}</span>` : ''}
                            ${task.dueDate ? `<span class="task-badge badge-date ${isTaskOverdue ? 'overdue' : ''}">${dateLabel}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" data-task-id="${task.id}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="task-action-btn duplicate" data-task-id="${task.id}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                        Copy
                    </button>
                    <button class="task-action-btn delete" data-task-id="${task.id}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    function renderEmptyState(message = 'No tasks for this day', sub = 'Add a task to get started!') {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                </div>
                <h3>${message}</h3>
                <p>${sub}</p>
            </div>
        `;
    }

    function renderDailyView() {
        const filtered = getFilteredTasks();
        const todayTasks = filtered.filter(task => {
            if (!task.dueDate) return isToday(state.currentDate);
            return getDateString(task.dueDate) === getDateString(state.currentDate);
        });

        const sorted = sortTasks(todayTasks);

        if (sorted.length === 0) {
            return renderEmptyState();
        }

        return `
            <div class="daily-view day-tasks">
                ${sorted.map(task => renderTaskCard(task)).join('')}
            </div>
        `;
    }

    function renderWeeklyView() {
        const weekDates = getWeekDates(state.currentDate);
        const filtered = getFilteredTasks();

        return `
            <div class="weekly-view">
                ${weekDates.map(date => {
            const dateStr = getDateString(date);
            const dayTasks = filtered.filter(task => {
                if (!task.dueDate) return false;
                return getDateString(task.dueDate) === dateStr;
            });
            const sorted = sortTasks(dayTasks);
            const todayClass = isToday(date) ? 'today-col' : '';

            return `
                        <div class="day-column ${todayClass}" data-date="${dateStr}">
                            <div class="day-header">
                                <span class="day-name">${getShortDayName(date)}</span>
                                <span class="day-date">${formatDateShort(date)}</span>
                                ${isToday(date) ? '<span class="today-badge">Today</span>' : ''}
                            </div>
                            <div class="day-tasks">
                                ${sorted.length === 0 ?
                    '<div class="empty-state"><p>No tasks</p></div>' :
                    sorted.map(task => renderTaskCard(task)).join('')
                }
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    function render() {
        // Update view buttons
        elements.viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === state.currentView);
        });

        // Update period text
        if (state.currentView === 'daily') {
            if (isToday(state.currentDate)) {
                elements.currentPeriod.textContent = 'Today';
            } else {
                elements.currentPeriod.textContent = formatDate(state.currentDate);
            }
        } else {
            const weekDates = getWeekDates(state.currentDate);
            const start = formatDateShort(weekDates[0]);
            const end = formatDateShort(weekDates[6]);
            elements.currentPeriod.textContent = `${start} – ${end}`;
        }

        // Render tasks
        if (state.currentView === 'daily') {
            elements.tasksContainer.innerHTML = renderDailyView();
        } else {
            elements.tasksContainer.innerHTML = renderWeeklyView();
        }

        // Attach drag and drop listeners
        attachDragListeners();

        // Update stats
        updateStats();

        // Update bottom actions visibility
        const hasCompleted = state.tasks.some(t => t.completed);
        const bottomActions = document.getElementById('bottom-actions');
        if (bottomActions) {
            bottomActions.style.display = hasCompleted ? 'block' : 'none';
        }
    }

    function attachDragListeners() {
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
        });

        const dropZones = document.querySelectorAll('.day-tasks, .day-column');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragenter', handleDragEnter);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);
        });
    }

    // ===========================
    // Modal Functions
    // ===========================

    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const firstInput = modal.querySelector('input[type="text"], textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 150);
        }
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openTaskModal(taskId = null) {
        state.editingTaskId = taskId;
        state.tempSubtasks = [];

        const modalTitle = document.getElementById('modal-title');

        if (taskId) {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                modalTitle.innerHTML = `
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Task
                `;
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description;
                document.getElementById('task-due-date').value = task.dueDate || '';
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-category').value = task.category;
                state.tempSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
            }
        } else {
            modalTitle.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Task
            `;
            elements.taskForm.reset();
            document.getElementById('task-priority').value = 'medium';

            if (state.currentView === 'daily') {
                document.getElementById('task-due-date').value = getDateString(state.currentDate);
            }
        }

        renderModalSubtasks();
        openModal(elements.taskModal);
    }

    function openDeleteModal(taskId) {
        state.deleteTaskId = taskId;
        openModal(elements.deleteModal);
    }

    // ===========================
    // Subtasks in Modal
    // ===========================

    function renderModalSubtasks() {
        if (!elements.subtaskList) return;

        elements.subtaskList.innerHTML = state.tempSubtasks.map((st, i) => `
            <div class="subtask-item" data-index="${i}">
                <input type="checkbox" ${st.completed ? 'checked' : ''} data-subtask-index="${i}" class="modal-subtask-check">
                <span${st.completed ? ' class="subtask-done"' : ''}>${escapeHtml(st.title)}</span>
                <button type="button" class="subtask-remove" data-subtask-index="${i}" title="Remove">✕</button>
            </div>
        `).join('');
    }

    function addTempSubtask(title) {
        if (!title.trim()) return;
        state.tempSubtasks.push({ title: title.trim(), completed: false });
        renderModalSubtasks();
    }

    // ===========================
    // Search Clear
    // ===========================
    function updateSearchClear() {
        if (elements.searchClear) {
            elements.searchClear.classList.toggle('hidden', !elements.searchInput.value);
        }
    }

    // ===========================
    // Event Handlers
    // ===========================

    function handleThemeToggle() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        saveToStorage();
    }

    function handleViewChange(view) {
        state.currentView = view;
        saveToStorage();
        render();
    }

    function handlePrevPeriod() {
        if (state.currentView === 'daily') {
            state.currentDate.setDate(state.currentDate.getDate() - 1);
        } else {
            state.currentDate.setDate(state.currentDate.getDate() - 7);
        }
        saveToStorage();
        render();
    }

    function handleNextPeriod() {
        if (state.currentView === 'daily') {
            state.currentDate.setDate(state.currentDate.getDate() + 1);
        } else {
            state.currentDate.setDate(state.currentDate.getDate() + 7);
        }
        saveToStorage();
        render();
    }

    function handleSearch(e) {
        state.filters.search = e.target.value;
        updateSearchClear();
        saveToStorage();
        render();
    }

    function handleStatusFilter(e) {
        state.filters.status = e.target.value;
        saveToStorage();
        render();
    }

    function handlePriorityFilter(e) {
        state.filters.priority = e.target.value;
        saveToStorage();
        render();
    }

    function handleSortChange(e) {
        state.sortBy = e.target.value;
        saveToStorage();
        render();
    }

    function handleQuickAdd(e) {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const title = e.target.value.trim();
            addTask({
                title,
                dueDate: getDateString(state.currentDate),
                priority: 'medium'
            });
            e.target.value = '';
        }
    }

    function handleTaskFormSubmit(e) {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-description').value.trim(),
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value.trim(),
            subtasks: state.tempSubtasks
        };

        if (!taskData.title) {
            showToast('Please enter a task title', 'error');
            return;
        }

        if (state.editingTaskId) {
            updateTask(state.editingTaskId, taskData);
        } else {
            addTask(taskData);
        }

        closeModal(elements.taskModal);
        elements.taskForm.reset();
        state.editingTaskId = null;
        state.tempSubtasks = [];
    }

    function handleTasksContainerClick(e) {
        const target = e.target;

        // Checkbox
        if (target.classList.contains('task-checkbox')) {
            const taskId = target.dataset.taskId;
            toggleTaskComplete(taskId);
            return;
        }

        // Edit button (or child SVG/path)
        const editBtn = target.closest('.task-action-btn.edit');
        if (editBtn) {
            openTaskModal(editBtn.dataset.taskId);
            return;
        }

        // Duplicate button
        const dupBtn = target.closest('.task-action-btn.duplicate');
        if (dupBtn) {
            duplicateTask(dupBtn.dataset.taskId);
            return;
        }

        // Delete button
        const delBtn = target.closest('.task-action-btn.delete');
        if (delBtn) {
            openDeleteModal(delBtn.dataset.taskId);
            return;
        }

        // Subtask checkbox in rendered cards (inline on card)
        if (target.classList.contains('card-subtask-check') || target.dataset.subtaskToggle) {
            const taskId = target.dataset.taskId;
            const stIdx = parseInt(target.dataset.subtaskIndex);
            toggleSubtask(taskId, stIdx);
            return;
        }
    }

    function handleConfirmDelete() {
        if (state.deleteTaskId) {
            deleteTask(state.deleteTaskId);
            state.deleteTaskId = null;
            closeModal(elements.deleteModal);
        }
    }

    // ===========================
    // Event Listeners
    // ===========================

    function attachEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', handleThemeToggle);

        // View toggle
        elements.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => handleViewChange(btn.dataset.view));
        });

        // Period navigation
        elements.prevPeriod.addEventListener('click', handlePrevPeriod);
        elements.nextPeriod.addEventListener('click', handleNextPeriod);

        // Filters and search
        elements.searchInput.addEventListener('input', handleSearch);
        elements.statusFilter.addEventListener('change', handleStatusFilter);
        elements.priorityFilter.addEventListener('change', handlePriorityFilter);
        elements.sortBy.addEventListener('change', handleSortChange);

        // Search clear
        if (elements.searchClear) {
            elements.searchClear.addEventListener('click', () => {
                elements.searchInput.value = '';
                state.filters.search = '';
                updateSearchClear();
                saveToStorage();
                render();
                elements.searchInput.focus();
            });
        }

        // Quick add
        elements.quickAddInput.addEventListener('keydown', handleQuickAdd);

        // Expand form button
        elements.expandFormBtn.addEventListener('click', () => openTaskModal());

        // Clear completed button
        elements.clearCompletedBtn.addEventListener('click', clearCompleted);

        // Task form
        elements.taskForm.addEventListener('submit', handleTaskFormSubmit);

        // Modal close buttons
        elements.modalCloses.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                closeModal(modal);
                if (modal === elements.taskModal) {
                    elements.taskForm.reset();
                    state.editingTaskId = null;
                    state.tempSubtasks = [];
                }
            });
        });

        // Modal overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                closeModal(modal);
                if (modal === elements.taskModal) {
                    elements.taskForm.reset();
                    state.editingTaskId = null;
                    state.tempSubtasks = [];
                }
            });
        });

        // Delete modal buttons
        elements.cancelDelete.addEventListener('click', () => {
            closeModal(elements.deleteModal);
            state.deleteTaskId = null;
        });
        elements.confirmDelete.addEventListener('click', handleConfirmDelete);

        // Tasks container (event delegation)
        elements.tasksContainer.addEventListener('click', handleTasksContainerClick);

        // Subtask editor events
        if (elements.addSubtaskBtn) {
            elements.addSubtaskBtn.addEventListener('click', () => {
                addTempSubtask(elements.subtaskInput.value);
                elements.subtaskInput.value = '';
                elements.subtaskInput.focus();
            });
        }

        if (elements.subtaskInput) {
            elements.subtaskInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTempSubtask(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Modal subtask list delegation
        if (elements.subtaskList) {
            elements.subtaskList.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.subtask-remove');
                if (removeBtn) {
                    const idx = parseInt(removeBtn.dataset.subtaskIndex);
                    state.tempSubtasks.splice(idx, 1);
                    renderModalSubtasks();
                    return;
                }

                if (e.target.classList.contains('modal-subtask-check')) {
                    const idx = parseInt(e.target.dataset.subtaskIndex);
                    state.tempSubtasks[idx].completed = e.target.checked;
                    renderModalSubtasks();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                if (elements.taskModal.classList.contains('active')) {
                    closeModal(elements.taskModal);
                    elements.taskForm.reset();
                    state.editingTaskId = null;
                    state.tempSubtasks = [];
                }
                if (elements.deleteModal.classList.contains('active')) {
                    closeModal(elements.deleteModal);
                    state.deleteTaskId = null;
                }
            }

            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                elements.searchInput.focus();
                elements.searchInput.select();
            }

            // Ctrl/Cmd + N to add new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                openTaskModal();
            }
        });
    }

    // ===========================
    // Initialize App
    // ===========================

    function init() {
        loadFromStorage();
        attachEventListeners();
        render();

        console.log('⚡ Lightbeast Task Manager initialized!');
        console.log('Keyboard shortcuts:');
        console.log('  Ctrl/Cmd + K : Focus search');
        console.log('  Ctrl/Cmd + N : Add new task');
        console.log('  Escape       : Close modal');
        console.log('  Enter (quick add) : Add task instantly');
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
