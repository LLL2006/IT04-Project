import { useState, useEffect } from 'react'; 
import MainLayout from '../layouts/MainLayout'; 
import TaskListTable from '../components/TaskListTable'; 
import '../style/TaskManagement.css'; 
import { useAuth } from '../context/authContext';
import UpdateStatusTask from '../components/UpdateStatusTask';

export interface Task {
  id: string | number;
  name: string;
  assignee: string;
  status: string;
  startDate: string;
  endDate: string;
  priority: string;
  progress: string;
  projectId: string | number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

interface TaskWithProject extends Task {
  projectName: string;
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState<TaskWithProject | null>(null);
  
  const { user } = useAuth(); // Lấy thông tin người dùng hiện tại từ AuthContext.
  const userId = user?.id; // Lấy ID của người dùng một cách an toàn.


  const handleOpenUpdateModal = (task: TaskWithProject) => {
    setTaskToUpdate(task); 
    setUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setTaskToUpdate(null); 
    setUpdateModalOpen(false); 
  };

  const handleConfirmUpdate = async () => {
    if (!taskToUpdate) return; 

    // Logic chuyển đổi trạng thái: chỉ hoạt động giữa 'In Progress' và 'Pending'.
    let newStatus;
    if (taskToUpdate.status === 'In Progress') {
      newStatus = 'Pending';
    } else if (taskToUpdate.status === 'Pending') {
      newStatus = 'In Progress';
    } else {
      // Nếu trạng thái của task không phải là một trong hai cái trên, chỉ đóng modal và không làm gì khác.
      handleCloseUpdateModal();
      return; 
    }

    try {
      // Gửi yêu cầu `PATCH` lên server để chỉ cập nhật trường `status`.
      const response = await fetch(`http://localhost:3000/task/${taskToUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task status');

      // Dùng `.map()` để tạo ra một mảng mới, chỉ thay đổi task có ID khớp.
      setTasks(currentTasks => 
        currentTasks.map(t => 
          t.id === taskToUpdate.id ? { ...t, status: newStatus } : t
        )
      );

    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Không thể cập nhật trạng thái.");
    } finally {
      handleCloseUpdateModal();
    }
  };

  useEffect(() => { 
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMyTasks = async () => {
      setLoading(true);
      try {
        // 1. Lấy tất cả các task từ server.
        const tasksRes = await fetch('http://localhost:3000/task');
        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
        const allTasks: Task[] = await tasksRes.json();

        // 2. Lọc ra những task mà người dùng hiện tại được giao (`assignee`).
        const myTasks = allTasks.filter(
          (task) => String(task.assignee).trim() === String(userId).trim()
        );

        // 3. Lấy thông tin project cho từng task đã lọc.
        const tasksWithProject = await Promise.all(
          myTasks.map(async (task) => {
            try {
              const projectRes = await fetch(`http://localhost:3000/projects/${task.projectId}`);
              if (projectRes.ok) {
                const project: Project = await projectRes.json();
                // Gộp thông tin task và project lại với nhau.
                return { ...task, projectName: project.name, projectImage: project.image };
              }
              // Nếu không tìm thấy project, trả về tên mặc định.
              return { ...task, projectName: `Dự án #${task.projectId}` };
            } catch (error) {
              // Xử lý lỗi nếu không fetch được một project cụ thể.
              return { ...task, projectName: `Dự án #${task.projectId}` };
            }
          })
        );

        // 4. Cập nhật state với danh sách task cuối cùng đã có đủ thông tin.
        setTasks(tasksWithProject);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [userId]); 

  return (
    <MainLayout>
      <div className="main-container">
        <div className="container">
          <div className="left-task">
            <div className="task-header">
              <h2>Quản lý nhiệm vụ</h2>
            </div>
          </div>
          <div className="right-task">
            <div className="task-controls">
              <select className="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="">Sắp xếp</option>
                <option value="deadline">Hạn chót</option>
                <option value="priority">Độ ưu tiên</option>
              </select>
              <input type="text" placeholder="Tìm kiếm nhiệm vụ" className="search-task" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="content-table">
          {loading ? (
            <div className="loading-state">Đang tải danh sách nhiệm vụ...</div>
          ) : (
            <TaskListTable
              tasks={tasks}
              sortBy={sortBy}
              searchTerm={searchTerm}
              onUpdateStatus={handleOpenUpdateModal} 
            />
          )}
        </div>
      </div>
      
      <UpdateStatusTask
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        onConfirm={handleConfirmUpdate}
      />
    </MainLayout>
  );
}