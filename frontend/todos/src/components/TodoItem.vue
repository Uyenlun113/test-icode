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
                        Ngày hết hạn : {{ formatDate(todo.due_date) }}
                        <span v-if="isOverdue(todo.due_date) && !todo.completed"> (Quá hạn)</span>
                    </div>
                    <div class="created-date">
                        Tạo lúc: {{ formatDateTime(todo.created_at) }}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn btn-success" @click="toggleComplete" :disabled="isUpdating">
                        {{ isUpdating ? '⏳' : (todo.completed ? 'Hoàn tác' : 'Hoàn thành') }}
                    </button>
                    <button class="btn btn-warning" @click="startEdit" :disabled="isUpdating">
                        Sửa
                    </button>
                    <button class="btn btn-danger" @click="deleteTodo" :disabled="isUpdating">
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
                    {{ isUpdating ? '⏳ Đang lưu...' : 'Lưu' }}
                </button>
                <button class="btn btn-danger" @click="cancelEdit" :disabled="isUpdating">
                    Hủy
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { eventBus, EVENTS } from '../eventBus'
import { todoAPI } from '../services/api.js'

// Props
const props = defineProps({
    todo: {
        type: Object,
        required: true
    }
})

// Reactive data
const isEditing = ref(false)
const isUpdating = ref(false)
const editForm = reactive({
    title: '',
    description: '',
    due_date: ''
})

// Methods
const toggleComplete = async () => {
    try {
        isUpdating.value = true
        const response = await todoAPI.toggleComplete(props.todo.id)

        // Emit event để update item trong list
        eventBus.emit(EVENTS.ITEM_TOGGLE_COMPLETE, {
            id: props.todo.id,
            data: response.data
        })

        eventBus.emit('showSuccess', response.message)
    } catch (error) {
        eventBus.emit('showError', error.message)
    } finally {
        isUpdating.value = false
    }
}

const deleteTodo = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
        return
    }

    try {
        isUpdating.value = true
        await todoAPI.delete(props.todo.id)
        eventBus.emit(EVENTS.ITEM_DELETED, {
            id: props.todo.id,
            todo: props.todo
        })

        eventBus.emit('showSuccess', '🗑️ Đã xóa công việc thành công!')
    } catch (error) {
        eventBus.emit('showError', error.message)
    } finally {
        isUpdating.value = false
    }
}

const startEdit = () => {
    isEditing.value = true
    editForm.title = props.todo.title
    editForm.description = props.todo.description || ''
    editForm.due_date = formatDateForInput(props.todo.due_date)
}

const saveEdit = async () => {
    if (!editForm.title.trim()) {
        eventBus.emit('showError', 'Tiêu đề không được để trống')
        return
    }

    try {
        isUpdating.value = true
        const todoData = {
            title: editForm.title.trim(),
            description: editForm.description.trim() || null,
            due_date: editForm.due_date || null
        }

        const response = await todoAPI.update(props.todo.id, todoData)
        eventBus.emit(EVENTS.ITEM_UPDATED, {
            id: props.todo.id,
            data: response.data
        })

        isEditing.value = false
        eventBus.emit('showSuccess', 'Đã cập nhật công việc thành công!')
    } catch (error) {
        eventBus.emit('showError', error.message)
    } finally {
        isUpdating.value = false
    }
}

const cancelEdit = () => {
    isEditing.value = false
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch (error) {
        return dateString
    }
}

const formatDateTime = (dateString) => {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        return dateString
    }
}

const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    } catch (error) {
        console.error('Error formatting date for input:', error)
        return ''
    }
}

const isOverdue = (dateString) => {
    if (!dateString) return false
    try {
        const dueDate = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate < today
    } catch (error) {
        return false
    }
}
</script>