import React, { useEffect, useState, useMemo } from "react";
import ConfirmDeleteTask from "./ConfirmDeleteTask";

interface Task {
  id: string | number;
  name: string;
  assignee: string;
  status: string;
  startDate: string;
  endDate: string;
  priority: string;
  progress: string;
  projectId?: string | number;
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function TaskTable({
  projectId,
  onEditTask,
  reloadFlag,
  searchTerm = "",
  sortBy = "",
  members = [],
}: {
  projectId?: string | number;
  onEditTask?: (task: Task) => void;
  reloadFlag?: number;
  searchTerm?: string;
  sortBy?: string;
  members?: Member[];
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API = "http://localhost:3000/task";

  // Hàm `fetchTasks`: Chịu trách nhiệm gọi API để lấy danh sách task cho dự án hiện tại.
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = projectId ? `${API}?projectId=${projectId}` : API;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      console.log("📋 Fetched tasks:", data);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
      setError("Không thể tải danh sách nhiệm vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      console.log("🔄 Fetching tasks for project:", projectId);
      fetchTasks();
    }
  }, [projectId, reloadFlag]); 

  // Lấy tên người phụ trách từ userId
  const getAssigneeName = (assigneeId: string): string => {
    if (!assigneeId) return "Chưa phân công";

    const member = members.find((m) => String(m.userId) === String(assigneeId));
    if (member) {
      return member.name;
    }

    // Fallback: nếu không tìm thấy trong members, hiển thị ID
    return `User #${assigneeId}`;
  };

  const openEdit = (t: Task) => {
    if (onEditTask) {
      onEditTask(t);
    } else {
      console.error("⚠️ onEditTask callback not provided!");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      const res = await fetch(`${API}/${taskToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks((prev) =>
        prev.filter((p) => String(p.id) !== String(taskToDelete.id))
      );
      setTaskToDelete(null);
    } catch (err) {
      alert("Không thể xóa nhiệm vụ");
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]; // Tạo bản sao để không làm thay đổi state gốc.

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((t) => {
        const assigneeName = getAssigneeName(t.assignee).toLowerCase();
        return (
          t.name.toLowerCase().includes(lower) || assigneeName.includes(lower)
        );
      });
    }

    const key = sortBy.toLowerCase();
    const parseDate = (d: string) => {
      const parts = d.split(/[\/\-]/);
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        return new Date(year, month - 1, day).getTime();
      }
      return new Date(d).getTime();
    };

    if (key === "deadline") {
      filtered.sort((a, b) => parseDate(a.endDate) - parseDate(b.endDate));
    } else if (key === "priority") {
      const order: Record<string, number> = {
        Cao: 3,
        "Trung bình": 2,
        Thấp: 1,
      };
      filtered.sort(
        (a, b) => (order[b.priority] || 0) - (order[a.priority] || 0)
      );
    }

    return filtered;
  }, [tasks, searchTerm, sortBy, members]);

  const grouped = useMemo(() => {
    return filteredAndSortedTasks.reduce((acc: Record<string, Task[]>, t) => {
      acc[t.status] = acc[t.status] || [];
      acc[t.status].push(t);
      return acc;
    }, {});
  }, [filteredAndSortedTasks]);

  const ORDER = ["To do", "In Progress", "Pending", "Done"];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "To do": false,
    "In Progress": false,
    Pending: false,
    Done: false,
  });

  const toggleGroup = (s: string) =>
    setOpenGroups((prev) => ({ ...prev, [s]: !prev[s] }));

  const getPriorityClass = (p: string) =>
    p === "Thấp"
      ? "priority-low"
      : p === "Trung bình"
      ? "priority-medium"
      : p === "Cao"
      ? "priority-high"
      : "";

  const getProgressClass = (p: string) =>
    p === "Đúng tiến độ"
      ? "status-on-schedule"
      : p === "Có rủi ro"
      ? "status-at-risk"
      : p === "Trễ hạn"
      ? "status-late"
      : "";

  if (loading) {
    return <div className="task-list">Đang tải danh sách nhiệm vụ...</div>;
  }

  if (error) {
    return (
      <div className="task-list">
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={fetchTasks}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="task-list" id="table-detail">
      <div className="task-header">
        <h2>Danh Sách Nhiệm Vụ</h2>
      </div>

      <table>
        <thead>
          <tr>
            <th>Tên Nhiệm Vụ</th>
            <th>Người Phụ Trách</th>
            <th>Ưu Tiên</th>
            <th>Ngày Bắt Đầu</th>
            <th>Hạn Chót</th>
            <th>Tiến độ</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          {ORDER.map((status) => {
            const statusTasks = grouped[status] || [];

            return (
              <React.Fragment key={status}>
                <tr
                  onClick={() => toggleGroup(status)}
                  style={{ cursor: "pointer", fontWeight: 600 }}
                  className="status-group-header"
                >
                  <td colSpan={7} className="status-row">
                    {openGroups[status] ? "▼" : "▶"} {status}
                  </td>
                </tr>

                {openGroups[status] &&
                  statusTasks.map((t) => (
                    <tr key={t.id} className="task-row">
                      <td>{t.name}</td>
                      <td>{getAssigneeName(t.assignee)}</td>
                      <td>
                        <span
                          className={`priority ${getPriorityClass(t.priority)}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="date">{t.startDate}</td>
                      <td className="date">{t.endDate}</td>
                      <td>
                        <span
                          className={`progress ${getProgressClass(t.progress)}`}
                        >
                          {t.progress}
                        </span>
                      </td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => openEdit(t)}
                        >
                          Sửa
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => setTaskToDelete(t)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {taskToDelete && (
        <ConfirmDeleteTask
          isOpen={!!taskToDelete}
          taskName={taskToDelete.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setTaskToDelete(null)}
        />
      )}
    </div>
  );
}
