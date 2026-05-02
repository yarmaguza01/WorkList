class TaskModal {
    constructor(onSave) {
        this.onSave = onSave;
        this.currentKeywords = [];
        this.modalElement = null;
        this.editTaskId = null;
        this.init();
    }

    init() {
        // Create the container if it doesn't exist
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = this.getHTML();
        document.body.appendChild(modalContainer);

        // Bind elements
        this.modalElement = document.getElementById('task-modal-component');
        this.form = document.getElementById('task-form-component');
        this.btnClose = document.getElementById('btn-close-modal-component');
        this.keywordsInput = document.getElementById('task-keywords-comp');
        this.keywordsContainer = document.getElementById('keywords-container-component');

        // Cache form fields
        this.titleInput = document.getElementById('task-title-comp');
        this.statusSelect = document.getElementById('task-status-comp');
        this.startDateInput = document.getElementById('task-start-date-comp');
        this.endDateInput = document.getElementById('task-end-date-comp');
        this.deadlineTimeInput = document.getElementById('task-deadline-time-comp');
        this.notesTextarea = document.getElementById('task-notes-comp');
        this.modalTitle = document.querySelector('#task-modal-component h2');

        this.bindEvents();
    }

    getHTML() {
        return `
        <div id="task-modal-component" class="modal">
            <div class="modal-content glass-panel">
                <div class="modal-header">
                    <h2>เพิ่มงานใหม่</h2>
                    <button type="button" id="btn-close-modal-component" class="btn-icon close-btn">&times;</button>
                </div>
                <form id="task-form-component">
                    <div class="form-group full-width">
                        <label for="task-title-comp">ชื่องาน (Task Name)</label>
                        <input type="text" id="task-title-comp" required placeholder="ระบุชื่องาน...">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="task-status-comp">สถานะ (Status)</label>
                            <select id="task-status-comp" required>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row date-row">
                        <div class="form-group">
                            <label for="task-start-date-comp">วันที่เริ่ม (Start Date)</label>
                            <input type="date" id="task-start-date-comp" required>
                        </div>
                        <div class="date-separator">ถึง</div>
                        <div class="form-group">
                            <label for="task-end-date-comp">วันที่สิ้นสุด (End Date)</label>
                            <input type="date" id="task-end-date-comp" required>
                        </div>
                        <div class="form-group">
                            <label for="task-deadline-time-comp">เวลาเดทไลน์ (Deadline Time)</label>
                            <input type="time" id="task-deadline-time-comp">
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label for="task-notes-comp">หมายเหตุ (Notes)</label>
                        <textarea id="task-notes-comp" rows="3" placeholder="รายละเอียดเพิ่มเติม..."></textarea>
                    </div>

                    <div class="form-group full-width">
                        <label for="task-keywords-comp">คีย์เวิร์ด (Keywords)</label>
                        <input type="text" id="task-keywords-comp" placeholder="พิมพ์คีย์เวิร์ดแล้วกด Enter (เช่น design, bug, feature)">
                        <div id="keywords-container-component" class="keywords-container"></div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-submit">บันทึกงาน</button>
                </form>
            </div>
        </div>
        `;
    }

    bindEvents() {
        // Close modal
        this.btnClose.addEventListener('click', () => this.close());
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });

        // Keywords logic
        this.keywordsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.keywordsInput.value.trim();
                if (value && !this.currentKeywords.includes(value)) {
                    this.currentKeywords.push(value);
                    this.renderKeywords();
                }
                this.keywordsInput.value = '';
            }
        });

        // Form Submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();

            const taskData = {
                title: this.titleInput.value,
                status: this.statusSelect.value,
                startDate: this.startDateInput.value,
                endDate: this.endDateInput.value,
                deadlineTime: this.deadlineTimeInput.value,
                notes: this.notesTextarea.value,
                keywords: [...this.currentKeywords]
            };

            if (this.onSave) {
                this.onSave(taskData, this.editTaskId);
            }

            this.close();
        });
    }

    renderKeywords() {
        this.keywordsContainer.innerHTML = '';
        this.currentKeywords.forEach((kw, index) => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `
                ${kw}
                <span class="remove-tag" data-index="${index}">&times;</span>
            `;

            // Add event listener to the remove button
            tag.querySelector('.remove-tag').addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                this.removeKeyword(idx);
            });

            this.keywordsContainer.appendChild(tag);
        });
    }

    removeKeyword(index) {
        this.currentKeywords.splice(index, 1);
        this.renderKeywords();
    }

    open() {
        this.editTaskId = null;
        this.modalTitle.textContent = 'เพิ่มงานใหม่';
        this.reset();
        this.modalElement.classList.add('show');
    }

    openForEdit(taskData) {
        this.editTaskId = taskData.id;
        this.modalTitle.textContent = 'แก้ไขงาน';

        this.titleInput.value = taskData.title;
        this.statusSelect.value = taskData.status;
        this.startDateInput.value = taskData.startDate;
        this.endDateInput.value = taskData.endDate;
        this.deadlineTimeInput.value = taskData.deadlineTime || '';
        this.notesTextarea.value = taskData.notes || '';

        this.currentKeywords = taskData.keywords ? [...taskData.keywords] : [];
        this.renderKeywords();

        this.modalElement.classList.add('show');
    }

    close() {
        this.modalElement.classList.remove('show');
    }

    reset() {
        this.form.reset();
        this.currentKeywords = [];
        this.renderKeywords();
    }
}
