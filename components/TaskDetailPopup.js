class TaskDetailPopup {
    constructor() {
        this.popupElement = null;
        this.init();
    }

    init() {
        const container = document.createElement('div');
        container.innerHTML = this.getHTML();
        document.body.appendChild(container);

        this.popupElement = document.getElementById('task-detail-popup');
        this.btnClose = document.getElementById('btn-close-detail-popup');
        this.btnEdit = document.getElementById('btn-detail-edit');
        this.btnDelete = document.getElementById('btn-detail-delete');

        this.bindEvents();
    }

    getHTML() {
        return `
        <div id="task-detail-popup" class="detail-popup-overlay">
            <div class="detail-popup-panel glass-panel">

                <!-- Header -->
                <div class="detail-popup-header">
                    <div class="detail-popup-title-group">
                        <div class="detail-popup-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </div>
                        <span class="detail-popup-label">รายละเอียดงาน</span>
                    </div>
                    <div style="display:flex; align-items:center; gap: 0.5rem;">
                        <button id="btn-detail-edit" class="btn btn-outline detail-edit-btn" title="แก้ไขงาน">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            แก้ไข
                        </button>
                        <button id="btn-detail-delete" class="btn btn-outline detail-delete-btn" title="ลบงาน">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            ลบ
                        </button>
                        <button id="btn-close-detail-popup" class="close-btn" title="ปิด">&times;</button>
                    </div>
                </div>

                <!-- Task Title + Status -->
                <div class="detail-title-section">
                    <h2 id="detail-task-title" class="detail-task-title"></h2>
                    <span id="detail-task-status-badge" class="status-badge detail-status-badge"></span>
                </div>

                <!-- Divider -->
                <div class="detail-divider"></div>

                <!-- Meta Info Grid -->
                <div class="detail-meta-grid">
                    <div class="detail-meta-card">
                        <div class="detail-meta-icon detail-meta-icon--blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                            <div class="detail-meta-label">วันที่เริ่ม</div>
                            <div id="detail-start-date" class="detail-meta-value"></div>
                        </div>
                    </div>
                    <div class="detail-meta-card">
                        <div class="detail-meta-icon detail-meta-icon--purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                            <div class="detail-meta-label">วันที่สิ้นสุด</div>
                            <div id="detail-end-date" class="detail-meta-value"></div>
                        </div>
                    </div>
                </div>

                <!-- Duration Bar -->
                <div id="detail-duration-section" class="detail-section">
                    <div class="detail-section-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        ระยะเวลา
                    </div>
                    <div class="detail-duration-bar-wrap">
                        <div class="detail-duration-bar-track">
                            <div id="detail-duration-bar-fill" class="detail-duration-bar-fill"></div>
                        </div>
                        <span id="detail-duration-text" class="detail-duration-text"></span>
                    </div>
                </div>

                <!-- Description -->
                <div id="detail-description-section" class="detail-section" style="display:none;">
                    <div class="detail-section-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        รายละเอียด
                    </div>
                    <div id="detail-description-content" class="detail-notes-box"></div>
                </div>

                <!-- Notes (หมายเหตุ) -->
                <div id="detail-notes-section" class="detail-section" style="display:none;">
                    <div class="detail-section-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        หมายเหตุ
                    </div>
                    <div id="detail-notes-content" class="detail-notes-box"></div>
                </div>

                <!-- Keywords -->
                <div id="detail-keywords-section" class="detail-section" style="display:none;">
                    <div class="detail-section-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                        คีย์เวิร์ด
                    </div>
                    <div id="detail-keywords-container" class="keywords-container" style="margin-top:0;"></div>
                </div>

                <!-- Task ID -->
                <div class="detail-task-id-row">
                    <span class="detail-task-id-label">Task ID:</span>
                    <span id="detail-task-id" class="detail-task-id-value"></span>
                </div>

            </div>
        </div>
        `;
    }

    bindEvents() {
        this.btnClose.addEventListener('click', () => this.close());
        this.popupElement.addEventListener('click', (e) => {
            if (e.target === this.popupElement) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popupElement.classList.contains('show')) {
                this.close();
            }
        });
    }

    open(task, onEditCallback, onDeleteCallback) {
        this._populate(task);

        // Wire up Edit button
        this.btnEdit.onclick = () => {
            this.close();
            if (onEditCallback) onEditCallback(task.id);
        };

        // Wire up Delete button
        this.btnDelete.onclick = () => {
            if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${task.title}" ?`)) {
                this.close();
                if (onDeleteCallback) onDeleteCallback(task.id);
            }
        };

        requestAnimationFrame(() => {
            this.popupElement.classList.add('show');
        });
    }

    close() {
        this.popupElement.classList.remove('show');
    }

    _formatDate(dateStr) {
        if (!dateStr) return '—';
        const [yyyy, mm, dd] = dateStr.split('-');
        return `${dd}/${mm}/${yyyy}`;
    }

    _formatCreatedAt(isoStr) {
        if (!isoStr) return '—';
        const d = new Date(isoStr);
        return d.toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    _calcDuration(startDate, endDate) {
        if (!startDate || !endDate) return null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const totalDays = Math.max(1, Math.round((end - start) / 86400000));
        const elapsed = Math.round((today - start) / 86400000);
        const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
        return { totalDays, elapsed: Math.max(0, elapsed), pct };
    }

    _populate(task) {
        // Title
        document.getElementById('detail-task-title').textContent = task.title;

        // Status badge
        const badge = document.getElementById('detail-task-status-badge');
        const statusClass = task.status.replace(/\s+/g, '').toLowerCase();
        badge.textContent = task.status;
        badge.className = `status-badge detail-status-badge status-badge--${statusClass}`;

        // Dates
        document.getElementById('detail-start-date').textContent = this._formatDate(task.startDate);
        document.getElementById('detail-end-date').textContent = this._formatDate(task.endDate);

        // Duration bar
        const dur = this._calcDuration(task.startDate, task.endDate);
        if (dur) {
            document.getElementById('detail-duration-bar-fill').style.width = `${dur.pct}%`;
            document.getElementById('detail-duration-bar-fill').style.background =
                dur.pct >= 100 ? 'var(--success)' : dur.pct >= 70 ? 'var(--warning)' : 'var(--primary)';
            document.getElementById('detail-duration-text').textContent =
                `${dur.elapsed} / ${dur.totalDays} วัน (${Math.round(dur.pct)}%)`;
            document.getElementById('detail-duration-section').style.display = '';
        } else {
            document.getElementById('detail-duration-section').style.display = 'none';
        }

        // Description
        const descSection = document.getElementById('detail-description-section');
        if (task.description && task.description.trim()) {
            document.getElementById('detail-description-content').innerHTML = task.description.replace(/\n/g, '<br>');
            descSection.style.display = '';
        } else {
            descSection.style.display = 'none';
        }

        // Notes
        const notesSection = document.getElementById('detail-notes-section');
        if (task.notes && task.notes.trim()) {
            document.getElementById('detail-notes-content').innerHTML = task.notes.replace(/\n/g, '<br>');
            notesSection.style.display = '';
        } else {
            notesSection.style.display = 'none';
        }

        // Keywords
        const kwSection = document.getElementById('detail-keywords-section');
        const kwContainer = document.getElementById('detail-keywords-container');
        if (task.keywords && task.keywords.length > 0) {
            kwContainer.innerHTML = task.keywords
                .map(kw => `<span class="tag" style="cursor:default;">${kw}</span>`)
                .join('');
            kwSection.style.display = '';
        } else {
            kwSection.style.display = 'none';
        }

        // Task ID
        document.getElementById('detail-task-id').textContent = task.id;
    }
}
