import axios from "axios";

// Cấu hình base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Todo API methods
export const todoAPI = {
  // Lấy tất cả todos
  async getAll(filter = "all", page = 1, perPage = 3) {
    try {
      const response = await api.get("/todos", {
        params: {
          filter,
          page,
          per_page: perPage,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Lấy todo theo ID
  async getById(id) {
    try {
      const response = await api.get(`/todos/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Tạo todo mới
  async create(todoData) {
    try {
      const response = await api.post("/todos", todoData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Cập nhật todo
  async update(id, todoData) {
    try {
      const response = await api.put(`/todos/${id}`, todoData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Đánh dấu hoàn thành/chưa hoàn thành
  async toggleComplete(id) {
    try {
      const response = await api.patch(`/todos/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Xóa todo
  async delete(id) {
    try {
      const response = await api.delete(`/todos/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Lấy thống kê
  async getStats() {
    try {
      const response = await api.get("/todos/stats");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Xử lý lỗi
  handleError(error) {
    if (error.response) {
      // Server trả về lỗi
      return {
        message: error.response.data.message || "Có lỗi xảy ra",
        status: error.response.status,
        errors: error.response.data.errors || [],
      };
    } else if (error.request) {
      // Không kết nối được server
      return {
        message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
        status: 0,
      };
    } else {
      // Lỗi khác
      return {
        message: error.message || "Có lỗi không xác định xảy ra",
        status: -1,
      };
    }
  },
};
