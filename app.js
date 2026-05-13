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
const btnDisconnectFile = document.getElementById('btn-disconnect-file');
const connectedFileName = document.getElementById('connected-file-name');

btnConnectFile.addEventListener('click', connectLocalFile);
if (btnCreateFile) btnCreateFile.addEventListener('click', createNewLocalFile);
if (btnDisconnectFile) btnDisconnectFile.addEventListener('click', disconnectFile);

// ── IndexedDB: persist FileSystemFileHandle ────────────────────────────────
const DB_NAME = 'worklist_db';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';
const HANDLE_KEY = 'default';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveHandle(handle) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

async function loadHandle() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

async function clearHandle() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

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

// Initialize TaskDetailPopup Component
const taskDetailPopup = new TaskDetailPopup();

const btnAddTask = document.getElementById('btn-add-task');
btnAddTask.addEventListener('click', () => {
    taskModalComponent.open();
});


// Initialize
async function init() {
    try {
        const handle = await loadHandle();
        if (!handle) return; // ไม่มีไฟล์ที่บันทึกไว้

        // ขอ permission ใหม่ (security requirement ของ File System Access API)
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            await clearHandle();
            return;
        }

        currentFileHandle = handle;
        const file = await handle.getFile();
        const contents = await file.text();

        if (contents.trim()) {
            tasks = JSON.parse(contents);
            renderTasks();
        }
        updateFileStatus(file.name);
        showToast(`เชื่อมต่อ "${file.name}" อัตโนมัติ`);
    } catch (err) {
        console.error('Auto-connect failed:', err);
    }
}

// Helpers
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatDateDisplay(dateString) {
    if (!dateString) return '';
    // Split directly to avoid UTC→local timezone offset shifting the date
    const [yyyy, mm, dd] = dateString.split('-');
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
            (task.description && task.description.toLowerCase().includes(textQuery)) ||
            (task.notes && task.notes.toLowerCase().includes(textQuery)) ||
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
        card.dataset.taskId = task.id;

        const dateDisplay = `${formatDateDisplay(task.startDate)} - ${formatDateDisplay(task.endDate)}`;

        // บอกว่ามีข้อมูลอะไรบ้าง (indicator chips)
        let indicatorsHtml = '';
        const chips = [];
        if (task.description && task.description.trim()) chips.push(`<span class="card-indicator"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>รายละเอียด</span>`);
        if (task.notes && task.notes.trim()) chips.push(`<span class="card-indicator"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>หมายเหตุ</span>`);
        if (task.keywords && task.keywords.length > 0) chips.push(`<span class="card-indicator"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>${task.keywords.length} คีย์เวิร์ด</span>`);
        if (chips.length > 0) indicatorsHtml = `<div class="card-indicators">${chips.join('')}</div>`;

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

                ${indicatorsHtml}
            </div>
            
            <div class="task-actions">
                <select class="action-select" onchange="updateStatus('${task.id}', this.value)">
                    <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        `;

        // คลิกที่ card เพื่อดูรายละเอียด (ยกเว้น interactive elements)
        card.addEventListener('click', (e) => {
            if (e.target.closest('button, select, option, a')) return;
            window.viewTask(task.id);
        });

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

window.updateStatus = function (id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        saveToLocal();
        renderTasks();
        showToast(`อัปเดตสถานะเป็น ${newStatus}`);
    }
}

window.viewTask = function (id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        taskDetailPopup.open(
            task,
            (taskId) => window.editTask(taskId),
            (taskId) => window.deleteTask(taskId)
        );
    }
}

window.editTask = function (id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        taskModalComponent.openForEdit(task);
    }
}

window.deleteTask = function (id) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveToLocal();
        renderTasks();
        showToast('ลบงานสำเร็จ');
    }
}

// ── File Connection ────────────────────────────────────────────────────────
async function connectLocalFile() {
    try {
        [currentFileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'WorkList Data File',
                accept: { 'text/plain': ['.txt', '.json'] }
            }],
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
                    throw new Error('Invalid format');
                }
            } catch (e) {
                console.error(e);
                showToast('รูปแบบข้อมูลในไฟล์ไม่ถูกต้อง', true);
                currentFileHandle = null;
                return;
            }
        } else {
            tasks = [];
            renderTasks();
            showToast('เชื่อมต่อไฟล์ว่างเปล่าสำเร็จ');
        }

        await saveHandle(currentFileHandle);
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
                accept: { 'text/plain': ['.txt', '.json'] }
            }]
        });

        tasks = [];
        renderTasks();

        const writable = await currentFileHandle.createWritable();
        await writable.write(JSON.stringify(tasks, null, 2));
        await writable.close();

        await saveHandle(currentFileHandle);
        showToast('สร้างไฟล์ใหม่และเชื่อมต่อสำเร็จ!');
        updateFileStatus(currentFileHandle.name);

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            showToast('เกิดข้อผิดพลาดในการสร้างไฟล์', true);
        }
    }
}

async function disconnectFile() {
    if (!confirm('ตัดการเชื่อมต่อไฟล์และล้างข้อมูลหน้าจอ?')) return;
    currentFileHandle = null;
    tasks = [];
    await clearHandle();
    renderTasks();
    updateFileStatus(null);
    showToast('ตัดการเชื่อมต่อแล้ว');
}

function updateFileStatus(filename) {
    if (filename) {
        connectedFileName.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; color: var(--success);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> เชื่อมต่อแล้ว: ${filename}`;
        if (btnDisconnectFile) btnDisconnectFile.style.display = 'inline-flex';
    } else {
        connectedFileName.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> ยังไม่เชื่อมต่อไฟล์`;
        if (btnDisconnectFile) btnDisconnectFile.style.display = 'none';
    }
}

async function saveToLocal() {
    if (!currentFileHandle) return; // ไม่มีไฟล์เชื่อมต่อ ไม่บันทึก

    try {
        const writable = await currentFileHandle.createWritable();
        await writable.write(JSON.stringify(tasks, null, 2));
        await writable.close();
    } catch (err) {
        console.error(err);
        showToast('ไม่สามารถบันทึกทับไฟล์ได้ (อาจไม่ได้รับสิทธิ์)', true);
    }
}

// Run Init
init();
