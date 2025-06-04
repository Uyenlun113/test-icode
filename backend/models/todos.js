const db = require("../db");

// Lấy tất cả todos với filter
async function getTodos(filter = "all", page = 1, perPage = 10) {
  try {
    let query = db.table("todos").select("*");
    let countQuery = db.table("todos");
    if (filter === "completed") {
      query = query.where("is_completed", 1);
      countQuery = countQuery.where("is_completed", 1);
    } else if (filter === "pending") {
      query = query.where("is_completed", 0);
      countQuery = countQuery.where("is_completed", 0);
    }
    const [{ count: total }] = await countQuery.count("* as count");
    const offset = (page - 1) * perPage;
    const todos = await query.orderBy("created_at", "desc").limit(perPage).offset(offset);
    const transformedTodos = todos.map((todo) => ({
      ...todo,
      completed: Boolean(todo.is_completed),
      is_completed: undefined,
    }));

    return {
      todos: transformedTodos,
      total: parseInt(total),
    };
  } catch (error) {
    console.error("Error in getTodos model:", error);
    throw error;
  }
}

// Lấy todo theo ID
function getById(id) {
  return db
    .table("todos")
    .select("*")
    .where("id", id)
    .first()
    .then((todo) => {
      if (!todo) return null;
      return {
        ...todo,
        completed: Boolean(todo.is_completed),
        is_completed: undefined,
      };
    });
}

// Tạo todo mới
function createTodo(todo) {
  const todoData = {
    ...todo,
    created_at: new Date(),
    updated_at: new Date(),
    is_completed: 0,
  };

  return db
    .table("todos")
    .insert(todoData)
    .returning("*")
    .then((result) => {
      // Transform kết quả trả về
      if (result && result.length > 0) {
        return result.map((todo) => ({
          ...todo,
          completed: Boolean(todo.is_completed),
          is_completed: undefined,
        }));
      }
      return result;
    });
}

// Cập nhật todo
function updateTodo(id, todo) {
  const todoData = {
    ...todo,
    updated_at: new Date(),
  };

  // Nếu có trường completed, chuyển thành is_completed
  if ("completed" in todoData) {
    todoData.is_completed = todoData.completed ? 1 : 0;
    delete todoData.completed;
  }

  return db
    .table("todos")
    .where("id", id)
    .update(todoData)
    .returning("*")
    .then((result) => {
      // Transform kết quả trả về
      if (result && result.length > 0) {
        return result.map((todo) => ({
          ...todo,
          completed: Boolean(todo.is_completed),
          is_completed: undefined,
        }));
      }
      return result;
    });
}

// Xóa todo
function deleteTodo(id) {
  return db.table("todos").where("id", id).del();
}

// Đánh dấu hoàn thành/chưa hoàn thành
async function toggleComplete(id) {
  const currentTodo = await db.table("todos").select("*").where("id", id).first();

  if (!currentTodo) {
    throw new Error("Todo không tồn tại");
  }

  const newStatus = currentTodo.is_completed === 0 ? 1 : 0;

  return db
    .table("todos")
    .where("id", id)
    .update({
      is_completed: newStatus,
      updated_at: new Date(),
    })
    .returning("*")
    .then((result) => {
      // Transform kết quả trả về
      if (result && result.length > 0) {
        return result.map((todo) => ({
          ...todo,
          completed: Boolean(todo.is_completed),
          is_completed: undefined,
        }));
      }
      return result;
    });
}

// Lấy thống kê
async function getStats() {
  const totalCount = await db.table("todos").count("id as count").first();
  const completedCount = await db.table("todos").where("is_completed", 1).count("id as count").first();
  const pendingCount = await db.table("todos").where("is_completed", 0).count("id as count").first();

  return {
    total: parseInt(totalCount.count),
    completed: parseInt(completedCount.count),
    pending: parseInt(pendingCount.count),
  };
}

module.exports = {
  getTodos,
  getById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleComplete,
  getStats,
};
