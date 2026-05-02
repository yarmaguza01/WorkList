// State
let tasks = [];

// DOM Elements
const tasksList = document.getElementById('tasks-list');
const statTotal = document.getElementById('stat-total');
const statProgress = document.getElementById('stat-progress');
const statCompleted = document.getElementById('stat-completed');
const toast = document.getElementById('toast');

let currentFileHandle = null;
const btnConnectFile = document.getElementById('btn-connect-file');
const btnCreateFile = document.getElementById('btn-create-file');
const connectedFileName = document.getElementById('connected-file-name');

btnConnectFile.addEventListener('click', connectLocalFile);
if (btnCreateFile) btnCreateFile.addEventListener('click', createNewLocalFile);

// Filter Elements
const filterText = document.getElementById('filter-text');
const filterDate = document.getElementById('filter-date');
const filterStatus = document.getElementById('filter-status');

[filterText, filterDate, filterStatus].forEach(el => {
    el.addEventListener('input', renderTasks);
});

// Initialize TaskModal Component
const taskModalComponent = new TaskModal((taskData, editTaskId) => {
    if (editTaskId) {
        const index = tasks.findIndex(t => t.id === editTaskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            showToast('แก้ไขงานสำเร็จ!');
        }
    } else {
        const newTask = {
            id: generateId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };
        tasks.unshift(newTask);
        showToast('เพิ่มงานสำเร็จ!');
    }

    saveToLocal();
    renderTasks();
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
    
    // Filtering Logic
    const textQuery = filterText.value.toLowerCase();
    const dateQuery = filterDate.value;
    const statusQuery = filterStatus.value;
    
    const filteredTasks = tasks.filter(task => {
        const matchText = !textQuery || 
            task.title.toLowerCase().includes(textQuery) || 
            (task.keywords && task.keywords.some(kw => kw.toLowerCase().includes(textQuery)));
            
        const matchDate = !dateQuery || 
            task.startDate === dateQuery || 
            task.endDate === dateQuery;
            
        const matchStatus = !statusQuery || task.status === statusQuery;
        
        return matchText && matchDate && matchStatus;
    });

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <p>${tasks.length === 0 ? 'ยังไม่มีรายการงาน เริ่มต้นด้วยการเพิ่มงานใหม่ด้านบน' : 'ไม่พบงานที่ตรงกับเงื่อนไขการค้นหา'}</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = '';
    
    filteredTasks.forEach(task => {
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
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-icon" onclick="editTask('${task.id}')" title="แก้ไขงาน">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn btn-icon" onclick="deleteTask('${task.id}')" title="ลบงาน">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
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

window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        taskModalComponent.openForEdit(task);
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
async function connectLocalFile() {
    try {
        [currentFileHandle] = await window.showOpenFilePicker({
            types: [
                {
                    description: 'WorkList Data File',
                    accept: {
                        'text/plain': ['.txt', '.json']
                    }
                }
            ],
            excludeAcceptAllOption: true,
            multiple: false
        });
        
        const file = await currentFileHandle.getFile();
        const contents = await file.text();
        
        if (contents.trim()) {
            try {
                const importedData = JSON.parse(contents);
                if (Array.isArray(importedData)) {
                    tasks = importedData;
                    renderTasks();
                    showToast('เชื่อมต่อและโหลดข้อมูลสำเร็จ!');
                } else {
                    throw new Error("Invalid format");
                }
            } catch(e) {
                console.error(e);
                showToast('รูปแบบข้อมูลในไฟล์ไม่ถูกต้อง', true);
                currentFileHandle = null;
                return;
            }
        } else {
            // Empty file
            tasks = [];
            renderTasks();
            showToast('เชื่อมต่อไฟล์ว่างเปล่าสำเร็จ');
        }
        
        updateFileStatus(file.name);
        
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อไฟล์', true);
        }
    }
}

async function createNewLocalFile() {
    try {
        currentFileHandle = await window.showSaveFilePicker({
            suggestedName: 'worklist_data.txt',
            types: [{
                description: 'WorkList Data File',
                accept: {'text/plain': ['.txt', '.json']}
            }]
        });
        
        // Initialize with empty tasks
        tasks = [];
        renderTasks();
        
        // Write empty array to the new file
        const writable = await currentFileHandle.createWritable();
        await writable.write(JSON.stringify(tasks, null, 2));
        await writable.close();
        
        showToast('สร้างไฟล์ใหม่และเชื่อมต่อสำเร็จ!');
        updateFileStatus(currentFileHandle.name);
        
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            showToast('เกิดข้อผิดพลาดในการสร้างไฟล์', true);
        }
    }
}

function updateFileStatus(filename) {
    if (filename) {
        connectedFileName.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; color: var(--success);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> เชื่อมต่อแล้ว: ${filename}`;
    } else {
        connectedFileName.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> ยังไม่เชื่อมต่อไฟล์`;
    }
}

async function saveToLocal() {
    if (!currentFileHandle) {
        // Fallback to localStorage
        localStorage.setItem('worklist_tasks', JSON.stringify(tasks));
        return;
    }
    
    try {
        const writable = await currentFileHandle.createWritable();
        await writable.write(JSON.stringify(tasks, null, 2));
        await writable.close();
        
        // Also save to localStorage as backup
        localStorage.setItem('worklist_tasks', JSON.stringify(tasks));
    } catch (err) {
        console.error(err);
        showToast('ไม่สามารถบันทึกทับไฟล์ได้ (อาจไม่ได้รับสิทธิ์)', true);
        // Fallback
        localStorage.setItem('worklist_tasks', JSON.stringify(tasks));
    }
}

// Run Init
init();
