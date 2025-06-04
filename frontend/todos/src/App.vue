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
        <TodoForm :loading="addingTodo" @add-todo="addTodo" ref="todoForm" />
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
            Đang tải dữ liệu...
        </div>
        <div v-else class="todo-list">
            <transition-group name="todo" tag="div">
                <TodoItem v-for="todo in filteredTodos" :key="todo.id" :todo="todo"
                    :is-updating="updatingTodos.includes(todo.id)" @toggle-complete="toggleComplete"
                    @delete-todo="deleteTodo" @save-edit="saveEdit" @show-error="showError" />
            </transition-group>
        </div>
        <div v-if="!loadingTodos && filteredTodos.length === 0" class="empty-state">
            <h3>{{ getEmptyStateMessage() }}</h3>
            <p>{{ getEmptyStateSubMessage() }}</p>
        </div>
    </div>
</template>

<script>
import TodoForm from './components/TodoForm.vue';
import TodoItem from './components/TodoItem.vue';
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
            addingTodo: false,
            updatingTodos: [],
            error: null,
            successMessage: null
        };
    },
    computed: {
        filteredTodos() {
            switch (this.currentFilter) {
                case 'completed':
                    return this.todos.filter(todo => todo.completed);
                case 'pending':
                    return this.todos.filter(todo => !todo.completed);
                default:
                    return this.todos;
            }
        }
    },
    methods: {
        async loadTodos() {
            try {
                this.loadingTodos = true;
                this.error = null;

                const [todosResponse, statsResponse] = await Promise.all([
                    todoAPI.getAll(this.currentFilter),
                    todoAPI.getStats()
                ]);

                this.todos = todosResponse.data || [];
                this.stats = statsResponse.data || { total: 0, pending: 0, completed: 0 };
            } catch (error) {
                this.error = error.message;
                console.error('Load todos error:', error);
            } finally {
                this.loadingTodos = false;
            }
        },

        async addTodo(todoData) {
            try {
                this.addingTodo = true;
                this.error = null;

                const response = await todoAPI.create(todoData);

                if (response.data) {
                    this.todos.unshift(response.data);

                    if (this.stats) {
                        this.stats.total++;
                        this.stats.pending++;
                    }

                    this.$refs.todoForm.resetForm();
                    this.showSuccess('✅ Đã thêm công việc mới thành công!');

                    if (this.currentFilter === 'completed') {
                        this.currentFilter = 'all';
                    }
                }
            } catch (error) {
                this.error = error.message;
            } finally {
                this.addingTodo = false;
            }
        },

        async toggleComplete(id) {
            try {
                this.updatingTodos.push(id);
                this.error = null;

                const response = await todoAPI.toggleComplete(id);

                const todoIndex = this.todos.findIndex(t => t.id === id);
                if (todoIndex !== -1) {
                    const oldCompleted = this.todos[todoIndex].completed;
                    this.todos[todoIndex] = response.data;

                    if (this.stats && oldCompleted !== response.data.completed) {
                        if (response.data.completed) {
                            this.stats.completed++;
                            this.stats.pending--;
                        } else {
                            this.stats.completed--;
                            this.stats.pending++;
                        }
                    }
                }
                this.showSuccess(response.message);
            } catch (error) {
                this.error = error.message;
            } finally {
                this.updatingTodos = this.updatingTodos.filter(todoId => todoId !== id);
            }
        },

        async deleteTodo(id) {
            if (!confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
                return;
            }
            try {
                this.updatingTodos.push(id);
                this.error = null;
                await todoAPI.delete(id);
                const todoIndex = this.todos.findIndex(t => t.id === id);
                if (todoIndex !== -1) {
                    const todo = this.todos[todoIndex];
                    this.todos.splice(todoIndex, 1);
                    if (this.stats) {
                        this.stats.total--;
                        if (todo.completed) {
                            this.stats.completed--;
                        } else {
                            this.stats.pending--;
                        }
                    }
                }

                this.showSuccess('🗑️ Đã xóa công việc thành công!');
            } catch (error) {
                this.error = error.message;
            } finally {
                this.updatingTodos = this.updatingTodos.filter(todoId => todoId !== id);
            }
        },
        async saveEdit(id, todoData) {
            try {
                this.updatingTodos.push(id);
                this.error = null;
                const response = await todoAPI.update(id, todoData);
                const todoIndex = this.todos.findIndex(t => t.id === id);
                if (todoIndex !== -1) {
                    this.todos[todoIndex] = response.data;
                }
                this.showSuccess('Đã cập nhật công việc thành công!');
            } catch (error) {
                this.error = error.message;
            } finally {
                this.updatingTodos = this.updatingTodos.filter(todoId => todoId !== id);
            }
        },

        async setFilter(filter) {
            if (this.currentFilter === filter) return;
            this.currentFilter = filter;
            await this.loadTodos();
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
    }
};
</script>