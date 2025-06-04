const express = require("express");
const router = express.Router();
const todosController = require("../controllers/todos");

// Middleware validation cơ bản
const validateTodo = (req, res, next) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Tiêu đề là bắt buộc và phải là chuỗi không rỗng",
    });
  }

  if (title.length > 255) {
    return res.status(400).json({
      success: false,
      message: "Tiêu đề không được vượt quá 255 ký tự",
    });
  }

  const { description } = req.body;
  if (description && typeof description === "string" && description.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Mô tả không được vượt quá 1000 ký tự",
    });
  }

  next();
};

const validateId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: "ID không hợp lệ",
    });
  }

  next();
};


router.get("/todos/stats", todosController.getStats);
router.get("/todos", todosController.getTodos);
router.get("/todos/:id", validateId, todosController.getTodoById);
router.post("/todos", validateTodo, todosController.createTodo);
router.put("/todos/:id", validateId, validateTodo, todosController.updateTodo);
router.patch("/todos/:id/toggle", validateId, todosController.toggleComplete);
router.delete("/todos/:id", validateId, todosController.deleteTodo);

module.exports = router;
