const todosModel = require("../models/todos");

// GET /api/todos - Lấy tất cả todos
async function getTodos(req, res) {
  try {
    const filter = req.query.filter || "all";
    const todos = await todosModel.getTodos(filter);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách todos thành công",
      data: todos,
    });
  } catch (error) {
    console.error("Lỗi getTodos:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách todos",
      error: error.message,
    });
  }
}

// GET /api/todos/:id - Lấy todo theo ID
async function getTodoById(req, res) {
  try {
    const { id } = req.params;
    const todo = await todosModel.getById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy todo thành công",
      data: todo,
    });
  } catch (error) {
    console.error("Lỗi getTodoById:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy todo",
      error: error.message,
    });
  }
}

// POST /api/todos - Tạo todo mới
async function createTodo(req, res) {
  try {
    const { title, description, due_date } = req.body;

    // Validation
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề là bắt buộc",
      });
    }

    const todoData = {
      title: title.trim(),
      description: description ? description.trim() : null,
      due_date: due_date || null,
    };

    const result = await todosModel.createTodo(todoData);

    // Xử lý kết quả tùy theo DB
    let newTodo;
    if (result && result.length > 0) {
      // PostgreSQL hoặc DB hỗ trợ returning
      newTodo = result[0];
    } else {
      // MySQL - lấy theo insertId
      const insertId = result.insertId || result[0];
      if (insertId) {
        newTodo = await todosModel.getById(insertId);
      }
    }

    res.status(201).json({
      success: true,
      message: "Tạo todo thành công",
      data: newTodo,
    });
  } catch (error) {
    console.error("Lỗi createTodo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo todo",
      error: error.message,
    });
  }
}

// PUT /api/todos/:id - Cập nhật todo
async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const { title, description, due_date, completed } = req.body;

    // Kiểm tra todo có tồn tại không
    const existingTodo = await todosModel.getById(id);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    // Validation
    if (title !== undefined && (!title || title.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề không được để trống",
      });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (completed !== undefined) updateData.completed = Boolean(completed);

    const result = await todosModel.updateTodo(id, updateData);

    // Lấy todo đã cập nhật
    const updatedTodo = await todosModel.getById(id);

    res.status(200).json({
      success: true,
      message: "Cập nhật todo thành công",
      data: updatedTodo,
    });
  } catch (error) {
    console.error("Lỗi updateTodo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật todo",
      error: error.message,
    });
  }
}

// PATCH /api/todos/:id/toggle - Đánh dấu hoàn thành/chưa hoàn thành
async function toggleComplete(req, res) {
  try {
    const { id } = req.params;

    const result = await todosModel.toggleComplete(id);

    // Lấy todo đã cập nhật
    const updatedTodo = await todosModel.getById(id);

    if (!updatedTodo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    const message = updatedTodo.completed ? "Todo đã được đánh dấu hoàn thành" : "Todo đã được hoàn tác";

    res.status(200).json({
      success: true,
      message: message,
      data: updatedTodo,
    });
  } catch (error) {
    console.error("Lỗi toggleComplete:", error);

    if (error.message === "Todo không tồn tại") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi khi thay đổi trạng thái todo",
      error: error.message,
    });
  }
}

// DELETE /api/todos/:id - Xóa todo
async function deleteTodo(req, res) {
  try {
    const { id } = req.params;

    // Kiểm tra todo có tồn tại không
    const existingTodo = await todosModel.getById(id);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: "Todo không tồn tại",
      });
    }

    await todosModel.deleteTodo(id);

    res.status(200).json({
      success: true,
      message: "Xóa todo thành công",
    });
  } catch (error) {
    console.error("Lỗi deleteTodo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa todo",
      error: error.message,
    });
  }
}

// GET /api/todos/stats - Lấy thống kê
async function getStats(req, res) {
  try {
    const stats = await todosModel.getStats();

    res.status(200).json({
      success: true,
      message: "Lấy thống kê thành công",
      data: stats,
    });
  } catch (error) {
    console.error("Lỗi getStats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
      error: error.message,
    });
  }
}

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  toggleComplete,
  deleteTodo,
  getStats,
};
