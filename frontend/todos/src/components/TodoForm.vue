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

<script setup>
import { ref, reactive } from 'vue'
import { eventBus, EVENTS } from '../eventBus'
import { todoAPI } from '../services/api.js'

const loading = ref(false)
const form = reactive({
    title: '',
    description: '',
    due_date: ''
})

const handleSubmit = async () => {
    if (!form.title.trim()) return

    try {
        loading.value = true

        const todoData = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            due_date: form.due_date || null
        }

        const response = await todoAPI.create(todoData)
        if (response.data) {
            eventBus.emit(EVENTS.ITEM_CREATED, response.data)
            resetForm()
            eventBus.emit('showSuccess', 'Đã thêm công việc mới thành công!')
        }
    } catch (error) {
        console.error('Create todo error:', error)
        eventBus.emit('showError', error.message)
    } finally {
        loading.value = false
    }
}

const resetForm = () => {
    form.title = ''
    form.description = ''
    form.due_date = ''
}
</script>