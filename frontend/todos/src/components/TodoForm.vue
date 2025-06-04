<template>
    <div class="todo-form-container">
        <h2 class="todo-form-title">➕ Thêm công việc mới</h2>
        <form @submit.prevent="handleSubmit">
            <div class="form-group">
                <label for="title">Tiêu đề công việc *</label>
                <input type="text" id="title" v-model="form.title" placeholder="Nhập tiêu đề công việc..." required
                    :disabled="loading" class="form-control">
            </div>
            <div class="form-group">
                <label for="description">Mô tả (tùy chọn)</label>
                <textarea id="description" v-model="form.description" placeholder="Mô tả chi tiết về công việc..."
                    :disabled="loading" class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label for="dueDate">Ngày hết hạn</label>
                <input type="date" id="dueDate" v-model="form.due_date" :disabled="loading" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Đang thêm...' : 'Thêm công việc' }}
            </button>
        </form>
    </div>
</template>

<script>
import { eventBus, EVENTS } from '../eventBus';
import { todoAPI } from '../services/api.js';

export default {
    name: 'TodoForm',
    data() {
        return {
            loading: false,
            form: {
                title: '',
                description: '',
                due_date: ''
            }
        };
    },
    methods: {
        async handleSubmit() {
            if (!this.form.title.trim()) return;

            try {
                this.loading = true;

                const todoData = {
                    title: this.form.title.trim(),
                    description: this.form.description.trim() || null,
                    due_date: this.form.due_date || null
                };
                const response = await todoAPI.create(todoData);
                if (response.data) {
                    eventBus.emit(EVENTS.ITEM_CREATED, response.data);
                    this.resetForm();
                    eventBus.emit('showSuccess', 'Đã thêm công việc mới thành công!');
                }
            } catch (error) {
                console.error('Create todo error:', error);
                eventBus.emit('showError', error.message);
            } finally {
                this.loading = false;
            }
        },

        resetForm() {
            this.form = {
                title: '',
                description: '',
                due_date: ''
            };
        }
    }
};
</script>
