import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { closeAllModals, setSelectedProject } from "../slices/uiSlice";
import { updateProject } from "../slices/projectSlice";

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

const API_BASE = "http://localhost:3000";

export default function ListMember() {
  const dispatch = useAppDispatch(); // Lấy hàm dispatch để gửi actions tới Redux.
  const { modals, selectedProject } = useAppSelector((s) => s.ui); // Lấy trạng thái modal và project đang được chọn từ uiSlice.
  const isOpen = !!modals?.isMemberListModalOpen;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !selectedProject?.members) {
      setMembers([]);
      return;
    }

    const fetchMembersData = async () => {
      setLoading(true);
      try {
        const promises = selectedProject.members.map((m: any) =>
          fetch(`${API_BASE}/user/${m.userId}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        );
        const users = await Promise.all(promises);

        const enriched = selectedProject.members.map(
          (m: any, index: number) => ({
            userId: String(m.userId),
            role: m.role,
            name: users[index]?.name || `User ${m.userId}`,
            email: users[index]?.email || "",
          })
        );

        setMembers(enriched);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembersData();
  }, [isOpen, selectedProject]);

  const handleClose = () => {
    dispatch(closeAllModals());
  };

  const handleSave = async () => {
    if (!selectedProject) return;

    // Validate: phải có ít nhất 1 member
    if (members.length === 0) {
      alert("Dự án phải có ít nhất 1 thành viên");
      return;
    }

    try {
      const updatedMembers = members.map((m) => ({ userId: m.userId, role: m.role }));
      await dispatch(updateProject({ id: selectedProject.id, members: updatedMembers })).unwrap();
      dispatch(setSelectedProject({ ...selectedProject, members: updatedMembers }));
      dispatch(closeAllModals());
    } catch (error) {
      alert("Không thể lưu thay đổi");
    }
  };

  const handleRemoveMember = (userId: string, role: string) => {
    // Không cho xóa Project Owner
    if (role === "Project Owner" || role === "Project owner") {
      alert("Không thể xóa Project Owner");
      return;
    }

    // Không cho xóa nếu chỉ còn 1 member
    if (members.length <= 1) {
      alert("Dự án phải có ít nhất 1 thành viên");
      return;
    }

    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleRoleChange = (userId: string, currentRole: string, newRole: string) => {
    // Không cho sửa role của Project Owner
    if (currentRole === "Project Owner" || currentRole === "Project owner") {
      alert("Không thể thay đổi vai trò của Project Owner");
      return;
    }

    setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)));
  };

  const getAvatarColor = (index: number) => {
    const colors = ["#2196F3", "#9C27B0", "#FF9800", "#4CAF50", "#F44336"];
    return colors[index % colors.length];
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      id="member-list-modal"
      className="modal"
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        style={{
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div className="header-modal">
          <h2>Thành viên</h2>
          <button className="close-btn" onClick={handleClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <div className="body-modal">
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Đang tải...</p>
          ) : members.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px" }}>
              Chưa có thành viên nào
            </p>
          ) : (
            <table className="member-table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Vai trò</th>
                  <th style={{ width: "80px" }}>Hành động</th>
                </tr>
              </thead>
              <tbody id="member-list">
                {members.map((member, index) => (
                  <tr key={member.userId}>
                    <td>
                      <div
                        className="member-info"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          className="member-avatar"
                          style={{
                            backgroundColor: getAvatarColor(index),
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "16px",
                            flexShrink: 0,
                          }}
                        >
                          {(member.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="member-details">
                          <div
                            className="member-name"
                            style={{ fontWeight: 500, marginBottom: "4px" }}
                          >
                            {member.name}
                          </div>
                          <div
                            className="member-email"
                            style={{ fontSize: "13px", color: "#666" }} 
                          >
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId,member.role, e.target.value)
                        }
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "14px",
                          width: "100%",
                        }}
                        placeholder="Nhập vai trò"
                      />
                    </td>
                    <td>
                      <button
                        className="remove-member-btn"
                        onClick={() => handleRemoveMember(member.userId, member.role)}
                        title="Xóa thành viên"
                        style={{
                          padding: "6px 10px",
                          background: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="footer-modal">
          <button className="cancel-btn" onClick={handleClose}>
            Đóng
          </button>
          <button className="save-btn" onClick={handleSave}>
            Lưu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
