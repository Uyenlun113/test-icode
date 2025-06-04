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
        <div v-if="pagination.totalPages > 1" class="pagination-section">
            <div class="pagination-info">
                Hiển thị {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} -
                {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }}
                trong tổng số {{ pagination.total }} công việc
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" @click="goToPage(1)"
                    :disabled="pagination.currentPage === 1 || loadingTodos">
                    ⏮️
                </button>
                <span class="pagination-current">
                    {{ pagination.currentPage }} / {{ pagination.totalPages }}
                </span>
                <button class="pagination-btn" @click="goToPage(pagination.totalPages)"
                    :disabled="pagination.currentPage === pagination.totalPages || loadingTodos">
                    ⏭️
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
    </div>
</template>

<script>
import TodoForm from './components/TodoForm.vue';
import TodoItem from './components/TodoItem.vue';
import { eventBus, EVENTS } from './eventBus';
import { todoAPI } from './services/api.js';

export default {
    name: 'TodoApp',
    components: {
        TodoForm,
        TodoItem
    },
    data() {
        return {
            todos: [],
            stats: null,
            currentFilter: 'all',
            loadingTodos: false,
            error: null,
            successMessage: null,
            pagination: {
                currentPage: 1,
                perPage: 10,
                total: 0,
                totalPages: 0
            }
        };
    },
    methods: {
        async loadTodos() {
            try {
                this.loadingTodos = true;
                this.error = null;

                const [todosResponse, statsResponse] = await Promise.all([
                    todoAPI.getAll(this.currentFilter, this.pagination.currentPage, this.pagination.perPage),
                    todoAPI.getStats()
                ]);

                this.todos = todosResponse.data?.todos || [];
                this.pagination = {
                    ...this.pagination,
                    ...todosResponse.data?.pagination
                };
                this.stats = statsResponse.data || { total: 0, pending: 0, completed: 0 };
            } catch (error) {
                this.error = error.message;
                console.error('Load todos error:', error);
            } finally {
                this.loadingTodos = false;
            }
        },

        async setFilter(filter) {
            if (this.currentFilter === filter) return;
            this.currentFilter = filter;
            this.pagination.currentPage = 1;
            await this.loadTodos();
        },

        async goToPage(page) {
            if (page < 1 || page > this.pagination.totalPages || page === this.pagination.currentPage) return;
            this.pagination.currentPage = page;
            await this.loadTodos();
        },

        async changePerPage() {
            this.pagination.currentPage = 1;
            await this.loadTodos();
        },

        async handleItemCreated() {
            // Reload toàn bộ danh sách thay vì chỉnh thủ công
            this.pagination.currentPage = 1;
            await this.loadTodos();
        },

        handleItemUpdated({ id, data }) {
            const todoIndex = this.todos.findIndex(t => t.id === id);
            if (todoIndex !== -1) {
                this.todos[todoIndex] = data;
            }
        },

        async handleItemDeleted({ id, todo }) {
            const todoIndex = this.todos.findIndex(t => t.id === id);
            if (todoIndex !== -1) {
                this.todos.splice(todoIndex, 1);

                // Update stats
                if (this.stats) {
                    this.stats.total--;
                    if (todo.completed) {
                        this.stats.completed--;
                    } else {
                        this.stats.pending--;
                    }
                }

                // Update pagination
                this.pagination.total--;
                this.pagination.totalPages = Math.ceil(this.pagination.total / this.pagination.perPage);

                // Nếu không còn item ở trang hiện tại, quay lại trang trước
                if (this.todos.length === 0 && this.pagination.currentPage > 1) {
                    this.pagination.currentPage--;
                    await this.loadTodos();
                }
            }
        },

        handleItemToggleComplete({ id, data }) {
            const todoIndex = this.todos.findIndex(t => t.id === id);
            if (todoIndex !== -1) {
                const oldCompleted = this.todos[todoIndex].completed;
                this.todos[todoIndex] = data;

                // Update stats
                if (this.stats && oldCompleted !== data.completed) {
                    if (data.completed) {
                        this.stats.completed++;
                        this.stats.pending--;
                    } else {
                        this.stats.completed--;
                        this.stats.pending++;
                    }
                }
            }
        },

        handleShowSuccess(message) {
            this.showSuccess(message);
        },

        handleShowError(message) {
            this.showError(message);
        },

        getEmptyStateMessage() {
            switch (this.currentFilter) {
                case 'completed':
                    return 'Chưa có công việc nào được hoàn thành';
                case 'pending':
                    return 'Tuyệt vời! Bạn đã hoàn thành tất cả công việc';
                default:
                    return 'Chưa có công việc nào';
            }
        },

        getEmptyStateSubMessage() {
            switch (this.currentFilter) {
                case 'completed':
                    return 'Hãy hoàn thành một số công việc để xem chúng ở đây';
                case 'pending':
                    return 'Hãy nghỉ ngơi hoặc thêm công việc mới';
                default:
                    return 'Hãy thêm công việc đầu tiên của bạn';
            }
        },

        showSuccess(message) {
            this.successMessage = message;
            setTimeout(() => {
                this.successMessage = null;
            }, 3000);
        },

        showError(message) {
            this.error = message;
        },

        clearMessages() {
            this.error = null;
            this.successMessage = null;
        }
    },

    async mounted() {
        await this.loadTodos();

        eventBus.on(EVENTS.ITEM_CREATED, this.handleItemCreated);
        eventBus.on(EVENTS.ITEM_UPDATED, this.handleItemUpdated);
        eventBus.on(EVENTS.ITEM_DELETED, this.handleItemDeleted);
        eventBus.on(EVENTS.ITEM_TOGGLE_COMPLETE, this.handleItemToggleComplete);
        eventBus.on('showSuccess', this.handleShowSuccess);
        eventBus.on('showError', this.handleShowError);
    },

    beforeUnmount() {
        eventBus.off(EVENTS.ITEM_CREATED, this.handleItemCreated);
        eventBus.off(EVENTS.ITEM_UPDATED, this.handleItemUpdated);
        eventBus.off(EVENTS.ITEM_DELETED, this.handleItemDeleted);
        eventBus.off(EVENTS.ITEM_TOGGLE_COMPLETE, this.handleItemToggleComplete);
        eventBus.off('showSuccess', this.handleShowSuccess);
        eventBus.off('showError', this.handleShowError);
    }
};
</script>
