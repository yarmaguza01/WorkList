// State
let tasks = [];

// DOM Elements
const tasksList = document.getElementById('tasks-list');
const statTotal = document.getElementById('stat-total');
const statProgress = document.getElementById('stat-progress');
const statCompleted = document.getElementById('stat-completed');
const toast = document.getElementById('toast');

const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const fileInput = document.getElementById('file-input');

// Initialize TaskModal Component
const taskModalComponent = new TaskModal((newTaskData) => {
    const newTask = {
        id: generateId(),
        ...newTaskData,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveToLocal();
    renderTasks();
    showToast('เพิ่มงานสำเร็จ!');
});

const btnAddTask = document.getElementById('btn-add-task');
btnAddTask.addEventListener('click', () => {
    taskModalComponent.open();
});


// Initialize
function init() {
    // Attempt to load from localStorage as fallback
    const saved = localStorage.getItem('worklist_tasks');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
            renderTasks();
        } catch(e) {
            console.error("Error loading tasks", e);
        }
    }
}

// Helpers
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatDateDisplay(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}



// Rendering Tasks
function renderTasks() {
    updateStats();
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <p>ยังไม่มีรายการงาน เริ่มต้นด้วยการเพิ่มงานใหม่ด้านบน</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const statusClass = task.status.replace(/\s+/g, '').toLowerCase();
        
        const card = document.createElement('div');
        card.className = `task-card status-${statusClass}`;
        
        const dateDisplay = `${formatDateDisplay(task.startDate)} - ${formatDateDisplay(task.endDate)}`;
        
        let keywordsHtml = '';
        if (task.keywords && task.keywords.length > 0) {
            keywordsHtml = `
                <div class="keywords-container" style="margin-top: 0.5rem">
                    ${task.keywords.map(kw => `<span class="tag">${kw}</span>`).join('')}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="task-main">
                <div class="task-title-row">
                    <div class="task-title">${task.title}</div>
                    <div class="status-badge">${task.status}</div>
                </div>
                
                <div class="task-meta">
                    <div class="meta-item" title="ระยะเวลา">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${dateDisplay}
                    </div>
                    <div class="meta-item" title="เดทไลน์เวลา">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${task.deadlineTime || 'ไม่ได้ระบุ'}
                    </div>
                </div>
                
                ${task.notes ? `<div class="task-notes">${task.notes.replace(/\\n/g, '<br>')}</div>` : ''}
                ${keywordsHtml}
            </div>
            
            <div class="task-actions">
                <select class="action-select" onchange="updateStatus('${task.id}', this.value)">
                    <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <button class="btn btn-icon" onclick="deleteTask('${task.id}')" title="ลบงาน">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        
        tasksList.appendChild(card);
    });
}

function updateStats() {
    const total = tasks.length;
    const progress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    
    statTotal.textContent = `Total: ${total}`;
    statProgress.textContent = `In Progress: ${progress}`;
    statCompleted.textContent = `Completed: ${completed}`;
}

window.updateStatus = function(id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        saveToLocal();
        renderTasks();
        showToast(`อัปเดตสถานะเป็น ${newStatus}`);
    }
}

window.deleteTask = function(id) {
    if(confirm('คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveToLocal();
        renderTasks();
        showToast('ลบงานสำเร็จ');
    }
}

// Local Storage Fallback
function saveToLocal() {
    localStorage.setItem('worklist_tasks', JSON.stringify(tasks));
}

// Export / Import
btnExport.addEventListener('click', () => {
    if (tasks.length === 0) {
        showToast('ไม่มีข้อมูลสำหรับบันทึก', true);
        return;
    }
    
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `worklist_backup_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('ดาวน์โหลดไฟล์ข้อมูลสำเร็จ');
});

btnImport.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                tasks = importedData;
                saveToLocal();
                renderTasks();
                showToast('โหลดข้อมูลสำเร็จ');
            } else {
                throw new Error("Invalid format");
            }
        } catch(error) {
            console.error(error);
            showToast('รูปแบบไฟล์ไม่ถูกต้อง', true);
        }
        // reset input
        fileInput.value = '';
    };
    reader.readAsText(file);
});

// Run Init
init();
