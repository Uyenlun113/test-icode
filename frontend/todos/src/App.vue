<template>
    <div class="app-container">
        <div class="app-header">
            <h1>Quản lý Công việc</h1>
        </div>
        <div v-if="error" class="app-error">
            {{ error }}
            <button @click="clearMessages" class="close-btn">✕</button>
        </div>
        <div v-if="successMessage" class="app-success">
            {{ successMessage }}
            <button @click="clearMessages" class="close-btn">✕</button>
        </div>
        <TodoForm />
        <div v-if="stats" class="filter-section">
            <button class="filter-btn" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')"
                :disabled="loadingTodos">
                Tất cả ({{ stats.total }})
            </button>
            <button class="filter-btn" :class="{ active: currentFilter === 'pending' }" @click="setFilter('pending')"
                :disabled="loadingTodos">
                Chưa hoàn thành ({{ stats.pending }})
            </button>
            <button class="filter-btn" :class="{ active: currentFilter === 'completed' }"
                @click="setFilter('completed')" :disabled="loadingTodos">
                Đã hoàn thành ({{ stats.completed }})
            </button>
        </div>


        <div v-if="loadingTodos && todos.length === 0" class="loading-container">
            ⏳ Đang tải dữ liệu...
        </div>
        <div v-else class="todo-list">
            <transition-group name="todo" tag="div">
                <TodoItem v-for="todo in todos" :key="todo.id" :todo="todo" />
            </transition-group>
        </div>
        <div v-if="!loadingTodos && todos.length === 0" class="empty-state">
            <h3>{{ getEmptyStateMessage() }}</h3>
            <p>{{ getEmptyStateSubMessage() }}</p>
        </div>
        <div v-if="pagination.total > 0" class="pagination-section">
            <div class="pagination-info">
                Hiển thị {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} -
                {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }}
                trong tổng số {{ pagination.total }} công việc
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" @click="goToPage(pagination.currentPage - 1)"
                    :disabled="pagination.currentPage === 1 || loadingTodos">
                    ⬅️ Trước
                </button>
                <button class="pagination-btn" @click="goToPage(1)"
                    :disabled="pagination.currentPage === 1 || loadingTodos">
                    ⏮️
                </button>
                <span class="pagination-current">
                    {{ pagination.currentPage }} / {{ Math.max(pagination.totalPages, 1) }}
                </span>
                <button class="pagination-btn" @click="goToPage(pagination.totalPages)"
                    :disabled="pagination.currentPage === pagination.totalPages || loadingTodos || pagination.totalPages <= 1">
                    ⏭️
                </button>
                <button class="pagination-btn" @click="goToPage(pagination.currentPage + 1)"
                    :disabled="pagination.currentPage === pagination.totalPages || loadingTodos || pagination.totalPages <= 1">
                    Sau ➡️
                </button>
            </div>
            <div class="items-per-page">
                <label>
                    Hiển thị:
                    <select v-model="pagination.perPage" @change="changePerPage" :disabled="loadingTodos">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                    mục/trang
                </label>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import TodoForm from './components/TodoForm.vue'
import TodoItem from './components/TodoItem.vue'
import { eventBus, EVENTS } from './eventBus'
import { todoAPI } from './services/api.js'

// Reactive data
const todos = ref([])
const stats = ref(null)
const currentFilter = ref('all')
const loadingTodos = ref(false)
const error = ref(null)
const successMessage = ref(null)

const pagination = reactive({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0
})

// Methods
const loadTodos = async () => {
    try {
        loadingTodos.value = true
        error.value = null

        const [todosResponse, statsResponse] = await Promise.all([
            todoAPI.getAll(currentFilter.value, pagination.currentPage, pagination.perPage),
            todoAPI.getStats()
        ])

        todos.value = todosResponse.data?.todos || []
        Object.assign(pagination, todosResponse.data?.pagination || {})
        stats.value = statsResponse.data || { total: 0, pending: 0, completed: 0 }
    } catch (err) {
        error.value = err.message
        console.error('Load todos error:', err)
    } finally {
        loadingTodos.value = false
    }
}

const setFilter = async (filter) => {
    if (currentFilter.value === filter) return
    currentFilter.value = filter
    pagination.currentPage = 1
    await loadTodos()
}

const goToPage = async (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) return
    pagination.currentPage = page
    await loadTodos()
}

const changePerPage = async () => {
    pagination.currentPage = 1
    await loadTodos()
}

const handleItemCreated = async () => {
    pagination.currentPage = 1
    await loadTodos()
}

const handleItemUpdated = ({ id, data }) => {
    const todoIndex = todos.value.findIndex(t => t.id === id)
    if (todoIndex !== -1) {
        todos.value[todoIndex] = data
    }
}

const handleItemDeleted = async ({ id, todo }) => {
    const todoIndex = todos.value.findIndex(t => t.id === id)
    if (todoIndex !== -1) {
        todos.value.splice(todoIndex, 1)
        if (stats.value) {
            stats.value.total--
            if (todo.completed) {
                stats.value.completed--
            } else {
                stats.value.pending--
            }
        }
        pagination.total--
        pagination.totalPages = Math.ceil(pagination.total / pagination.perPage)
        if (todos.value.length === 0 && pagination.currentPage > 1) {
            pagination.currentPage--
            await loadTodos()
        }
    }
}

const handleItemToggleComplete = ({ id, data }) => {
    const todoIndex = todos.value.findIndex(t => t.id === id)
    if (todoIndex !== -1) {
        const oldCompleted = todos.value[todoIndex].completed
        todos.value[todoIndex] = data
        if (stats.value && oldCompleted !== data.completed) {
            if (data.completed) {
                stats.value.completed++
                stats.value.pending--
            } else {
                stats.value.completed--
                stats.value.pending++
            }
        }
    }
}

const handleShowSuccess = (message) => {
    showSuccess(message)
}

const handleShowError = (message) => {
    showError(message)
}

const getEmptyStateMessage = () => {
    switch (currentFilter.value) {
        case 'completed':
            return 'Chưa có công việc nào được hoàn thành'
        case 'pending':
            return 'Tuyệt vời! Bạn đã hoàn thành tất cả công việc'
        default:
            return 'Chưa có công việc nào'
    }
}

const getEmptyStateSubMessage = () => {
    switch (currentFilter.value) {
        case 'completed':
            return 'Hãy hoàn thành một số công việc để xem chúng ở đây'
        case 'pending':
            return 'Hãy nghỉ ngơi hoặc thêm công việc mới'
        default:
            return 'Hãy thêm công việc đầu tiên của bạn'
    }
}

const showSuccess = (message) => {
    successMessage.value = message
    setTimeout(() => {
        successMessage.value = null
    }, 3000)
}

const showError = (message) => {
    error.value = message
}

const clearMessages = () => {
    error.value = null
    successMessage.value = null
}

onMounted(async () => {
    await loadTodos()
    eventBus.on(EVENTS.ITEM_CREATED, handleItemCreated)
    eventBus.on(EVENTS.ITEM_UPDATED, handleItemUpdated)
    eventBus.on(EVENTS.ITEM_DELETED, handleItemDeleted)
    eventBus.on(EVENTS.ITEM_TOGGLE_COMPLETE, handleItemToggleComplete)
    eventBus.on('showSuccess', handleShowSuccess)
    eventBus.on('showError', handleShowError)
})

onUnmounted(() => {
    eventBus.off(EVENTS.ITEM_CREATED, handleItemCreated)
    eventBus.off(EVENTS.ITEM_UPDATED, handleItemUpdated)
    eventBus.off(EVENTS.ITEM_DELETED, handleItemDeleted)
    eventBus.off(EVENTS.ITEM_TOGGLE_COMPLETE, handleItemToggleComplete)
    eventBus.off('showSuccess', handleShowSuccess)
    eventBus.off('showError', handleShowError)
})
</script>