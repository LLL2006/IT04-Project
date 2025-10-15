import { useEffect, useState } from "react";

interface TaskData {
  id?: string | number;
  name: string;
  assignee: string;
  status: string;
  startDate: string;
  endDate: string;
  priority: string;
  progress: string;
  projectId?: string | number;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskData) => Promise<void> | void;
  initialData?: TaskData | null;
  existingTasks?: TaskData[];
  members: { userId: string; name: string; email: string; role: string }[];
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingTasks = [],
  members = [],
}: TaskModalProps) {
  const empty = {
    name: "",
    assignee: "",
    status: "",
    startDate: "",
    endDate: "",
    priority: "",
    progress: "",
  };
  const [task, setTask] = useState<TaskData>({ ...empty });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Nếu có `initialData`, có nghĩa là đang ở chế độ "Sửa".
      if (initialData) {
        setTask({
          id: initialData.id,
          name: initialData.name ?? "",
          assignee: String(initialData.assignee || ""),
          status: initialData.status ?? "",
          startDate: initialData.startDate ?? "",
          endDate: initialData.endDate ?? "",
          priority: initialData.priority ?? "",
          progress: initialData.progress ?? "",
          projectId: initialData.projectId,
        });
      } else {
          // Nếu không có `initialData`, đây là chế độ "Thêm mới", reset form về rỗng.
        setTask({ ...empty });
      }
      setErrors({});
      setGlobalError("");
    }
  }, [isOpen, initialData?.id, members.length]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = task.startDate ? new Date(task.startDate) : null;
    const end = task.endDate ? new Date(task.endDate) : null;

    if (!task.name.trim()) newErrors.name = "Tên nhiệm vụ không được để trống";
    else if (task.name.trim().length < 3 || task.name.trim().length > 50)
      newErrors.name = "Tên nhiệm vụ phải có độ dài từ 3 đến 50 ký tự";

    if (!task.assignee) newErrors.assignee = "Chọn người phụ trách";
    if (!task.status) newErrors.status = "Chọn trạng thái";
    if (!task.startDate) newErrors.startDate = "Chọn ngày bắt đầu";
    if (!task.endDate) newErrors.endDate = "Chọn hạn cuối";
    if (!task.priority) newErrors.priority = "Chọn độ ưu tiên";
    if (!task.progress) newErrors.progress = "Chọn tiến độ";

     const isDuplicate = existingTasks.some(
      (existingTask) =>
        existingTask.name.trim().toLowerCase() === task.name.trim().toLowerCase() &&
        existingTask.id !== task.id
    );
    if (isDuplicate) {
      newErrors.name = "Tên nhiệm vụ đã tồn tại trong dự án này.";
    }


    if (start && start < today)
      newErrors.startDate = "Ngày bắt đầu phải lớn hơn ngày hiện tại";
    if (start && end && end <= start)
      newErrors.endDate = "Hạn chót phải lớn hơn ngày bắt đầu";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setGlobalError("");
      await onSave(task);
      onClose();
    } catch (err) {
      setGlobalError("Không thể lưu nhiệm vụ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="task-modal" className="modal-overlay">
      <div className="modal-content">
        <div className="header-modal">
          <h2>{initialData ? "Sửa nhiệm vụ" : "Thêm nhiệm vụ"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="body-modal">
            {globalError && (
              <div className="error-message global-error">{globalError}</div>
            )}

            <div className="form-group">
              <label>Tên nhiệm vụ</label> 
              <input
                name="name"
                value={task.name}
                onChange={handleChange}
                placeholder="Nhập tên nhiệm vụ"
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label>Người phụ trách</label>
              <select
                name="assignee"
                value={task.assignee}
                onChange={handleChange}
                className={errors.assignee ? "input-error" : ""}
                disabled={members.length === 0}
              >
                <option value="">
                  {members.length === 0
                    ? "Đang tải danh sách thành viên..."
                    : "Chọn người phụ trách"}
                </option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
              {errors.assignee && (
                <span className="error-message">{errors.assignee}</span>
              )}
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select
                name="status"
                value={task.status}
                onChange={handleChange}
                className={errors.status ? "input-error" : ""}
              >
                <option value="">Chọn trạng thái</option>
                <option value="To do">To do</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Done">Done</option>
              </select>
              {errors.status && (
                <span className="error-message">{errors.status}</span>
              )}
            </div>

            <div className="form-group">
              <label>Ngày bắt đầu</label>
              <input
                type="date"
                name="startDate"
                value={task.startDate}
                onChange={handleChange}
                className={errors.startDate ? "input-error" : ""}
              />
              {errors.startDate && (
                <span className="error-message">{errors.startDate}</span>
              )}
            </div>

            <div className="form-group">
              <label>Hạn cuối</label>
              <input
                type="date"
                name="endDate"
                value={task.endDate}
                onChange={handleChange}
                className={errors.endDate ? "input-error" : ""}
              />
              {errors.endDate && (
                <span className="error-message">{errors.endDate}</span>
              )}
            </div>

            <div className="form-group">
              <label>Độ ưu tiên</label>
              <select
                name="priority"
                value={task.priority}
                onChange={handleChange}
                className={errors.priority ? "input-error" : ""}
              >
                <option value="">Chọn độ ưu tiên</option>
                <option value="Thấp">Thấp</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Cao">Cao</option>
              </select>
              {errors.priority && (
                <span className="error-message">{errors.priority}</span>
              )}
            </div>

            <div className="form-group">
              <label>Tiến độ</label>
              <select
                name="progress"
                value={task.progress}
                onChange={handleChange}
                className={errors.progress ? "input-error" : ""}
              >
                <option value="">Chọn tiến độ</option>
                <option value="Đúng tiến độ">Đúng tiến độ</option>
                <option value="Có rủi ro">Có rủi ro</option>
                <option value="Trễ hạn">Trễ hạn</option>
              </select>
              {errors.progress && (
                <span className="error-message">{errors.progress}</span>
              )}
            </div>
          </div>

          <div className="footer-modal">
            <div className="modal-action">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                Hủy
              </button>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
