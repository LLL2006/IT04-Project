import { useEffect, useMemo } from "react"; 
import { useAppDispatch, useAppSelector } from "../store/index"; 
import {
  fetchProjects,
  setSearchTerm,
  setCurrentPage,
  type Project,
} from "../slices/projectSlice"; 
import {
  openAddProjectModal,
  openEditProjectModal,
  openDeleteProjectModal,
} from "../slices/uiSlice"; 
import MainLayout from "../layouts/MainLayout"; 
import ProjectTable from "../components/ProjectManagementTable"; 
import Pagination from "../components/Pagination";
import AddEditProjectModal from "../components/AddEditProject"; 
import ConfirmDeleteModal from "../components/ConfirmDeleteProject"; 
import "../style/ProjectManagement.css"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext"; // Hook để lấy thông tin người dùng từ Context

export default function ProjectManagement() {
  const navigate = useNavigate(); 
  const dispatch = useAppDispatch(); // Lấy hàm dispatch để gửi actions tới Redux store
  const { user } = useAuth(); // Lấy thông tin người dùng hiện tại từ AuthContext

  // Dùng `useAppSelector` để "đọc" các state từ slice `projects`
  const { projects, loading, error, searchTerm, currentPage, itemsPerPage } =
    useAppSelector((state) => state.projects);


  // Tự động fetch danh sách dự án khi đã có thông tin người dùng.
  useEffect(() => {
    if (user?.id) {
      // Gửi action `fetchProjects` với `userId` để slice có thể lọc đúng dự án
      dispatch(fetchProjects(user.id));
    }
  }, [user, dispatch]); // Mảng phụ thuộc: effect sẽ chạy lại nếu `user` hoặc `dispatch` thay đổi


  const ownedProjects = useMemo(() => {
    if (!user) return []; 
    // Lọc ra những dự án mà người dùng hiện tại là chủ sở hữu
    return projects.filter((p) => String(p.projectOwnerId) === String(user.id));
  }, [projects, user]);

  // Lọc các dự án sở hữu dựa trên từ khóa tìm kiếm (`searchTerm` từ Redux)
  const filteredProjects = ownedProjects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sắp xếp các dự án đã lọc theo ID tăng dần
  const sortedProjects = filteredProjects.slice().sort((a, b) => a.id - b.id);


  // Tính toán vị trí bắt đầu của mục trên trang hiện tại
  const startIndex = (currentPage - 1) * itemsPerPage;
  // "Cắt" mảng dự án đã sắp xếp để chỉ lấy các mục cho trang hiện tại
  const paginatedProjects = sortedProjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  // Tính lại tổng số trang dựa trên số lượng dự án đã được lọc
  const filteredTotalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const handleAddProject = () => {
    dispatch(openAddProjectModal()); 
  };

  const handleEditProject = (project: any) => {
    dispatch(openEditProjectModal(project)); 
  };

  const handleDetailProject = (project: Project) => {
    // Dùng `Maps` để chuyển đến trang chi tiết
    // `state` được dùng để truyền dữ liệu qua, giúp trang chi tiết không cần gọi lại API
    navigate(`/project-detail`, {
      state: {
        id: project.id,
        name: project.name,
        description: project.description,
        image: project.image,
      },
    });
  };

  const handleDeleteProject = (project: any) => {
    dispatch(openDeleteProjectModal(project)); 
  };

  // Khi người dùng gõ vào ô tìm kiếm
  const handleSearchChange = (value: string) => {
    dispatch(setSearchTerm(value)); // Gửi action để cập nhật `searchTerm` trong Redux
  };

  // Khi người dùng click vào một trang trong phần phân trang
  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page)); // Gửi action để cập nhật `currentPage` trong Redux
  };


  if (loading && projects.length === 0) {
    return (
      <MainLayout>
        <div className="content">
          <div>Đang tải...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="project-management">
        <div id="content" className="content">
          <h1>Quản Lý Dự Án Nhóm</h1>
          <div className="addSearch">
            <button className="add-project-btn" onClick={handleAddProject}>
              + Thêm Dự Án
            </button>
            <input
              className="search-input"
              placeholder="Tìm kiếm dự án"
              value={searchTerm} 
              onChange={(e) => handleSearchChange(e.target.value)} 
            />
          </div>
          <div className="projectList">Danh Sách Dự Án</div>

          {error && <div className="error-message">{error}</div>}

          <ProjectTable
            projects={paginatedProjects}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onDetail={handleDetailProject}
          />

          <Pagination
            page={currentPage}
            total={filteredTotalPages}
            onChange={handlePageChange}
          />

          <AddEditProjectModal />
          <ConfirmDeleteModal />
        </div>
      </div>
    </MainLayout>
  );
}