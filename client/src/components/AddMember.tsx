import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { closeAllModals, setSelectedProject } from "../slices/uiSlice";
import { updateProject, fetchProjects } from "../slices/projectSlice";
import { useAuth } from "../context/authContext";

const API_BASE = "http://localhost:3000";

export default function AddMember() {
  const dispatch = useAppDispatch();
  const { modals, selectedProject } = useAppSelector((s) => s.ui);
  const { user } = useAuth();
  const isOpen = !!modals?.isAddMemberModalOpen;

  const [formData, setFormData] = useState({ email: "", role: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

   const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (formData.email.length < 10 || formData.email.length > 50) {
      newErrors.email = "Email phải có độ dài từ 10 đến 50 ký tự";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng";
    }

    // Validate role
    if (!formData.role.trim()) {
      newErrors.role = "Vai trò không được để trống";
    } else if (formData.role.trim().length < 2 || formData.role.trim().length > 50) {
      newErrors.role = "Vai trò phải có độ dài từ 2 đến 50 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedProject) return;

    setSaving(true);
    try {
      // 1. Gửi yêu cầu API để tìm user dựa trên email đã nhập.
      const userRes = await fetch(
        `${API_BASE}/user?email=${encodeURIComponent(formData.email.trim())}`
      );
      if (!userRes.ok) throw new Error("Không thể kiểm tra email");

      const users = await userRes.json();
       // 2. Kiểm tra xem email có tồn tại trong hệ thống không.
      if (!users || users.length === 0) {
        setErrors({ email: "Email này chưa được đăng ký trong hệ thống" });
        setSaving(false);
        return;
      }

      // 3. Kiểm tra xem người dùng này đã là thành viên của dự án chưa.
      const foundUser = users[0];
      const isAlreadyMember = selectedProject.members?.some(
        (m: any) => String(m.userId) === String(foundUser.id)
      );
      if (isAlreadyMember) {
        setErrors({ email: "Người dùng này đã là thành viên của dự án" });
        setSaving(false);
        return;
      }

      // 4. Tạo mảng thành viên mới bằng cách kết hợp mảng cũ và thành viên mới.
      const updatedMembers = [
        ...(selectedProject.members || []),
        { userId: String(foundUser.id), role: formData.role.trim() },
      ];

      await dispatch(
        updateProject({ id: selectedProject.id, members: updatedMembers })
      ).unwrap();
      dispatch(
        setSelectedProject({ ...selectedProject, members: updatedMembers })
      );

      if (user?.id) await dispatch(fetchProjects(String(user.id)));

      dispatch(closeAllModals());
      setFormData({ email: "", role: "" });
      setErrors({});
    } catch (err: any) {
      setErrors({ _global: err?.message || "Không thể thêm thành viên" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    dispatch(closeAllModals());
    setFormData({ email: "", role: "" });
    setErrors({});
  };

  if (!isOpen) return null;
 
  return createPortal(
    <div
      className="modal"
      onClick={handleClose}
      style={{
        position: "fixed",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px", width: "90%", marginBottom: "400px" }}
      >
        <div className="header-modal">
          <h2>Thêm thành viên</h2>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <hr className="hr-1" />
        <form onSubmit={handleSubmit}>
          <div className="body-modal">
            {errors._global && (
              <div className="error-message global-error">{errors._global}</div>
            )}

            <div className="form-group">
              <label htmlFor="member-email">Email</label>
              <input
                id="member-email"
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "error" : ""}
                disabled={saving}
              />
              {errors.email && (
                <span className="error-message-1">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="member-role">Vai trò</label>
              <input
                id="member-role"
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={errors.role ? "error" : ""}
                disabled={saving}
              />
              {errors.role && (
                <span className="error-message-1">{errors.role}</span>
              )}
            </div>
          </div>

          <hr className="hr-2" />
          <div className="footer-modal">
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleClose}
                disabled={saving}
              >
                Hủy
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
