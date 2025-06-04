<template>
    <div class="todo-item" :class="{ completed: todo.completed }">
        <div class="status-badge" :class="todo.completed ? 'completed' : 'pending'">
            {{ todo.completed ? 'Hoàn thành' : 'Đang thực hiện' }}
        </div>

        <div v-if="!isEditing" class="todo-content">
            <div class="todo-header">
                <h3 class="todo-title">{{ todo.title }}</h3>
                <p v-if="todo.description" class="todo-description">
                    {{ todo.description }}
                </p>
            </div>

            <div class="todo-meta">
                <div class="todo-info">
                    <div v-if="todo.due_date" class="due-date"
                        :class="{ overdue: isOverdue(todo.due_date) && !todo.completed }">
                        {{ formatDate(todo.due_date) }}
                        <span v-if="isOverdue(todo.due_date) && !todo.completed"> (Quá
                            hạn)</span>
                    </div>
                    <div class="created-date">
                        Tạo lúc: {{ formatDateTime(todo.created_at) }}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn btn-success" @click="$emit('toggle-complete', todo.id)" :disabled="isUpdating">
                        {{ isUpdating ? '⏳' : (todo.completed ? 'Hoàn tác' : 'Hoàn thành')
                        }}
                    </button>
                    <button class="btn btn-warning" @click="startEdit" :disabled="isUpdating">
                        Sửa
                    </button>
                    <button class="btn btn-danger" @click="$emit('delete-todo', todo.id)" :disabled="isUpdating">
                        {{ isUpdating ? '⏳' : 'Xóa' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-else class="edit-form">
            <div class="form-group">
                <label>Tiêu đề công việc</label>
                <input type="text" v-model="editForm.title" @keyup.enter="saveEdit" :disabled="isUpdating"
                    class="form-control">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea v-model="editForm.description" :disabled="isUpdating" class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label>Ngày hết hạn</label>
                <input type="date" v-model="editForm.due_date" :disabled="isUpdating" class="form-control">
            </div>
            <div class="edit-actions">
                <button class="btn btn-success" @click="saveEdit" :disabled="isUpdating">
                    {{ isUpdating ? 'Đang lưu...' : 'Lưu' }}
                </button>
                <button class="btn btn-danger" @click="cancelEdit" :disabled="isUpdating">
                    Hủy
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TodoItem',
    props: {
        todo: {
            type: Object,
            required: true
        },
        isUpdating: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isEditing: false,
            editForm: {
                title: '',
                description: '',
                due_date: ''
            }
        };
    },
    methods: {
        startEdit() {
            this.isEditing = true;
            this.editForm = {
                title: this.todo.title,
                description: this.todo.description || '',
                due_date: this.formatDateForInput(this.todo.due_date)
            };
        },

        saveEdit() {
            if (!this.editForm.title.trim()) {
                this.$emit('show-error', 'Tiêu đề không được để trống');
                return;
            }

            const todoData = {
                title: this.editForm.title.trim(),
                description: this.editForm.description.trim() || null,
                due_date: this.editForm.due_date || null
            };

            this.$emit('save-edit', this.todo.id, todoData);
            this.isEditing = false;
        },

        cancelEdit() {
            this.isEditing = false;
        },

        formatDate(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return dateString;
            }
        },

        formatDateTime(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return dateString;
            }
        },

        formatDateForInput(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            } catch (error) {
                return '';
            }
        },

        isOverdue(dateString) {
            if (!dateString) return false;
            try {
                const dueDate = new Date(dateString);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < today;
            } catch (error) {
                return false;
            }
        }
    }
};
</script>