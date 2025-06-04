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
export default {
    name: 'TodoForm',
    props: {
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            form: {
                title: '',
                description: '',
                due_date: ''
            }
        };
    },
    methods: {
        handleSubmit() {
            if (!this.form.title.trim()) return;

            const todoData = {
                title: this.form.title.trim(),
                description: this.form.description.trim() || null,
                due_date: this.form.due_date || null
            };

            this.$emit('add-todo', todoData);
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