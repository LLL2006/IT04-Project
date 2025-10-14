import React, { useMemo, useState } from 'react';

interface Task {
  id: string | number;
  name: string;
  assignee: string;
  status: string;
  startDate: string;
  endDate: string;
  priority: string;
  progress: string;
  projectId: string | number;
  projectName: string;
  projectImage?: string;
}

interface TaskListTableProps {
  tasks: Task[]; 
  sortBy?: string; 
  searchTerm?: string;
  onUpdateStatus: (task: Task) => void;
}

export default function TaskListTable({
  tasks,
  sortBy = '',
  searchTerm = '',
  onUpdateStatus,
}: TaskListTableProps) {

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]; 

    // 1. Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.projectName.toLowerCase().includes(lower)
      );
    }

    const parseDate = (d: string) => new Date(d).getTime();

    // 2. Sắp xếp danh sách đã lọc
    if (sortBy === 'deadline') {
      filtered.sort((a, b) => parseDate(a.endDate) - parseDate(b.endDate));
    } else if (sortBy === 'priority') {
      const order: Record<string, number> = { Cao: 3, 'Trung bình': 2, Thấp: 1 };
      filtered.sort((a, b) => (order[b.priority] || 0) - (order[a.priority] || 0));
    }

    return filtered;
  }, [tasks, searchTerm, sortBy]);

  // `useMemo` để nhóm các task đã được lọc và sắp xếp lại theo `projectId`.
  const tasksByProject = useMemo(() => {
    // Dùng `reduce` để duyệt qua mảng `filteredAndSortedTasks` và xây dựng object nhóm.
    const grouped: Record<string, Task[]> = {};
    filteredAndSortedTasks.forEach((task) => {
      const key = String(task.projectId);
      if (!grouped[key]) grouped[key] = []; // Nếu chưa có nhóm cho project này, tạo một mảng rỗng.
      grouped[key].push(task); // Thêm task vào nhóm tương ứng.
    });
    return grouped;
  }, [filteredAndSortedTasks]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const getPriorityClass = (p: string) =>
    p === 'Thấp' ? 'priority-low' : p === 'Trung bình' ? 'priority-medium' : p === 'Cao' ? 'priority-high' : '';

  const getProgressClass = (p: string) =>
    p === 'Đúng tiến độ' ? 'status-on-schedule' : p === 'Có rủi ro' ? 'status-at-risk' : p === 'Trễ hạn' ? 'status-late' : '';
  
  const getStatusClass = (s: string) => {
    switch (s) {
      case 'To do': return 'status-todo';
      case 'In Progress': return 'status-inprogress';
      case 'Pending': return 'status-pending';
      case 'Done': return 'status-done';
      default: return '';
    }
  };

  return (
    <div className="task-list-table">
      <h2>Danh Sách Nhiệm Vụ</h2>
      <table>
        <thead>
          <tr>
            <th>Tên Nhiệm Vụ</th>
            <th>Độ ưu tiên</th>
            <th>Trạng thái</th>
            <th>Ngày Bắt Đầu</th>
            <th>Hạn Chót</th>
            <th>Tiến độ</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(tasksByProject).map(([projectId, projectTasks]) => {
            const firstTask = projectTasks[0]; 
            const isExpanded = expandedProjects[projectId] ?? true; 

            return (
              <React.Fragment key={projectId}>
                <tr className="project-group-header" onClick={() => toggleProject(projectId)} style={{ cursor: 'pointer' }}>
                  <td colSpan={6}>
                    <div className="project-header-content">
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      <span className="project-name">{firstTask.projectName}</span>
                    </div>
                  </td>
                </tr>

                {isExpanded && projectTasks.map((task) => (
                  <tr key={task.id} className="task-row">
                    <td className="task-name">{task.name}</td>
                    <td>
                      <span id="text-center" className={`priority ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(task.status)}`}>{task.status}</span>
                      <img className='image' src="../../src/assets/Vector.png" alt="Edit Status" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          onUpdateStatus(task); 
                        }}/>
                    </td>
                    <td className="date">{task.startDate}</td>
                    <td className="date">{task.endDate}</td>
                    <td>
                      <span className={`progress ${getProgressClass(task.progress)}`}>{task.progress}</span>
                    </td>
                  </tr>
                ))}
              </React.Fragment> 
            );
          })}
        </tbody>
      </table>
    </div>
  );
}