import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export interface ProjectMember {
  userId: string;
  role: string;
}

export interface Project {
  projectOwnerId: string;
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  members: ProjectMember[];
}

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
  error: null,
  searchTerm: "",
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 7,
};

const API_BASE_URL = "http://localhost:3000";

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects?_sort=id&_order=asc`);
      if (!response.ok) throw new Error("Failed to fetch projects");

      const data = await response.json();

      // Lọc projects của user (owner hoặc member)
      const filtered = data.filter(
        (p: any) =>
          String(p.projectOwnerId) === String(userId) ||
          (Array.isArray(p.members) && p.members.some((m: any) => String(m.userId) === String(userId)))
      );

      // Chuẩn hóa dữ liệu
      return filtered.map((p: any) => ({
        ...p,
        id: String(p.id),
        projectOwnerId: String(p.projectOwnerId),
        members: (p.members || []).map((m: any) => ({
          userId: String(m.userId),
          role: m.role,
        })),
      }));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch projects");
    }
  }
);

export const addProject = createAsyncThunk(
  "projects/addProject",
  async (projectData: Omit<Project, "id" | "members">, { rejectWithValue }) => {
    try {
      // Fetch để tính ID mới
      const listRes = await fetch(`${API_BASE_URL}/projects`);
      if (!listRes.ok) throw new Error("Failed to read current projects");
      const list = await listRes.json();

      // Tìm ID lớn nhất
      const maxId = list.reduce((max: number, item: any) => {
        const numId = Number(item?.id);
        return Number.isFinite(numId) && numId > max ? numId : max;
      }, 0);

      const nextId = String(maxId + 1);
      const ownerId = String(projectData.projectOwnerId);

      const newProject = {
        id: nextId,
        name: projectData.name.trim(),
        description: projectData.description?.trim() || "",
        image: projectData.image || null,
        projectOwnerId: ownerId,
        members: [{ userId: ownerId, role: "Project Owner" }],
      };

      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) throw new Error("Failed to create project");

      const result = await response.json();

      return {
        ...result,
        id: String(result.id),
        projectOwnerId: String(result.projectOwnerId),
        members: (result.members || []).map((m: any) => ({
          userId: String(m.userId),
          role: m.role,
        })),
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create project");
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, ...projectData }: Partial<Project> & { id: string }, { rejectWithValue }) => {
    try {
      const projectId = String(id);
      if (!projectId) throw new Error(`Invalid project ID: ${id}`);

      // Fetch dữ liệu cũ để merge
      const oldRes = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (!oldRes.ok) throw new Error("Project not found");
      const oldData = await oldRes.json();

      const updatedProject = {
        ...oldData,
        ...projectData,
      };

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });

      if (!response.ok) throw new Error("Failed to update project");
      const result = await response.json();

      return {
        ...result,
        id: String(result.id),
        projectOwnerId: String(result.projectOwnerId),
        members: (result.members || []).map((m: any) => ({
          userId: String(m.userId),
          role: m.role,
        })),
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update project");
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const projectId = String(id);
      if (!projectId) throw new Error(`Invalid ID: ${id}`);

      const checkRes = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (checkRes.status === 404) throw new Error(`Project not found (id=${projectId})`);
      if (!checkRes.ok) throw new Error(`Failed to verify project (id=${projectId})`);

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete project");

      return projectId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete project");
    }
  }
);

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // Action `setSearchTerm`: Cập nhật lại từ khóa tìm kiếm trong state.
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload; 
      state.currentPage = 1; // Reset về trang 1 mỗi khi người dùng bắt đầu một tìm kiếm mới.
    },
    // Action `setCurrentPage`: Cập nhật lại trang hiện tại khi người dùng chuyển trang.
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // `.addCase(fetchProjects.pending)`: Chạy khi `fetchProjects` bắt đầu được gọi.
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true; // Bật trạng thái loading để hiển thị spinner trên UI.
        state.error = null;   // Xóa lỗi cũ nếu có.
      })
      // `.addCase(fetchProjects.fulfilled)`: Chạy khi `fetchProjects` hoàn thành thành công.
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false; // Tắt trạng thái loading.
        state.projects = action.payload; // Cập nhật danh sách dự án với dữ liệu nhận được từ API.
        state.totalPages = Math.ceil(action.payload.length / state.itemsPerPage); // Tính lại tổng số trang.
      })
      // `.addCase(fetchProjects.rejected)`: Chạy khi `fetchProjects` gặp lỗi.
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false; // Tắt trạng thái loading.
        state.error = action.payload as string; // Lưu lại thông báo lỗi để hiển thị trên UI.
      })

      .addCase(addProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload); // Thêm dự án mới vào cuối mảng `projects`.
        state.totalPages = Math.ceil(state.projects.length / state.itemsPerPage);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        // Tìm vị trí (index) của dự án cần cập nhật trong mảng `projects`.
        const idx = state.projects.findIndex((p) => p.id === action.payload.id);
        // Nếu tìm thấy, thay thế dự án cũ bằng dự án đã được cập nhật từ API.
        if (idx !== -1) {
          state.projects[idx] = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const deletedId = action.payload; // Lấy ID của dự án đã xóa.
        // Dùng `filter` để tạo một mảng `projects` mới, loại bỏ dự án có ID trùng khớp.
        state.projects = state.projects.filter((p) => p.id !== deletedId);

        const filtered = state.projects.filter((p) =>
          p.name.toLowerCase().includes(state.searchTerm.toLowerCase())
        );
        const newTotalPages = Math.max(1, Math.ceil(filtered.length / state.itemsPerPage));
        if (state.currentPage > newTotalPages) {
          state.currentPage = newTotalPages;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to delete project";
      });
  },
});

export const { setSearchTerm, setCurrentPage } = projectSlice.actions;
export default projectSlice.reducer;