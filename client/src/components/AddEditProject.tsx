import { useEffect, useState } from "react"; 
import { useAppDispatch, useAppSelector } from "../store"; // Hooks tùy chỉnh để tương tác với Redux
import { addProject, updateProject } from "../slices/projectSlice";
import { closeAllModals } from "../slices/uiSlice"; 
import { useAuth } from "../context/authContext"; // Hook để lấy thông tin người dùng

export default function AddEditProjectModal() {
  const dispatch = useAppDispatch(); // Lấy hàm dispatch để gửi actions tới Redux
  const { modals, selectedProject } = useAppSelector((s) => s.ui); // Lấy trạng thái modal và project đang được chọn từ uiSlice
  const { projects } = useAppSelector((s) => s.projects); // Lấy danh sách tất cả project để kiểm tra tên trùng lặp
  const { user } = useAuth(); // Lấy thông tin người dùng hiện tại

  const isOpen = !!(modals?.isAddProjectModalOpen || modals?.isEditProjectModalOpen);
  const isEdit = !!modals?.isEditProjectModalOpen;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | string | null, 
  });
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Nếu ở chế độ "Sửa" và có project được chọn
    if (isEdit && selectedProject) {
      // Điền dữ liệu của project đó vào form
      setFormData({
        name: String(selectedProject.name || ""),
        description: String(selectedProject.description || ""),
        image: selectedProject.image ?? null,
      });
      // Hiển thị ảnh cũ (nếu có)
      setImagePreview(selectedProject.image ?? "");
    } else {
      // Nếu ở chế độ "Thêm mới", reset form về trạng thái rỗng
      setFormData({ name: "", description: "", image: null });
      setImagePreview("");
    }
    // Luôn xóa các lỗi cũ mỗi khi modal được mở lại
    setErrors({});
  }, [isOpen, isEdit, selectedProject]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setFormData((prev) => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Tên dự án không được để trống";
    else if (formData.name.trim().length < 4)
      newErrors.name = "Tên dự án phải có ít nhất 4 ký tự";
    else {
      const isDuplicate = projects.some((p) => {
        if (isEdit && selectedProject && p.id === selectedProject.id) return false;
        return p.name.trim().toLowerCase() === formData.name.trim().toLowerCase();
      });
      if (isDuplicate) newErrors.name = "Tên dự án đã tồn tại";
    }
    if (!formData.description.trim())
      newErrors.description = "Mô tả không được để trống";
    else if (formData.description.trim().length < 8)
      newErrors.description = "Mô tả phải có ít nhất 8 ký tự";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; 
  };

  const uploadImageToCloudinary = async (file: File) => {
    const data = new FormData(); // FormData là cách chuẩn để gửi file qua HTTP
    data.append("file", file);
    // Lấy các biến môi trường để kết nối Cloudinary
    const preset = import.meta.env.VITE_CLOUDINARY_UNSIGNED_PRESET;
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!preset || !cloud) throw new Error("Cloudinary env not configured");
    data.append("upload_preset", preset);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: data });
    const json = await res.json();

    if (!json?.secure_url) throw new Error("Upload failed");
    return json.secure_url as string; // Trả về URL an toàn của ảnh sau khi upload
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user?.id) return;

    setSaving(true); 
    try {
      let imageUrl: string | null = null;
      // Nếu `formData.image` là một chuỗi (string), có nghĩa là người dùng không thay đổi ảnh khi sửa
      if (typeof formData.image === "string") {
        imageUrl = formData.image;
      } 
      // Nếu `formData.image` là một đối tượng `File`, có nghĩa là người dùng đã chọn ảnh mới
      else if (formData.image instanceof File) {
        imageUrl = await uploadImageToCloudinary(formData.image);
      }

      if (isEdit && selectedProject) {
        await dispatch(
          updateProject({
            id: String(selectedProject.id),
            name: formData.name.trim(),
            description: formData.description.trim(),
            image: imageUrl ?? null,
          })
        ).unwrap(); // `.unwrap()` sẽ throw lỗi nếu thunk bị rejected, giúp `try...catch` hoạt động
      } else {
        await dispatch(
          addProject({
            name: formData.name.trim(),
            description: formData.description.trim(),
            image: imageUrl ?? null,
            projectOwnerId: String(user.id), // Gắn ID của người dùng hiện tại làm chủ sở hữu
          })
        ).unwrap();
      }
      
      dispatch(closeAllModals()); 
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        _global: err?.message ?? "Lỗi khi lưu dự án",
      }));
    } finally {
      setSaving(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="modal show">
      <div className="modal-content" id="project-modal">
        <div className="header-modal">
          <h2>{isEdit ? "Sửa Dự Án" : "Thêm Dự Án"}</h2>
          <button
            className="close-btn"
            onClick={() => dispatch(closeAllModals())}
          >
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
              <label htmlFor="project-name">Tên dự án</label>
              <input
                id="project-name" type="text" name="name"
                value={formData.name} onChange={handleInputChange}
                className={errors.name ? "error" : ""}
                placeholder="Nhập tên dự án"
                disabled={saving}
              />
              {errors.name && (<span className="error-message-1">{errors.name}</span>)}
            </div>

            <div className="form-group">
              <label htmlFor="project-image">Hình ảnh dự án</label>
              <input
                id="project-image" type="file" accept="image/*"
                onChange={handleFileChange}
                disabled={saving}
              />
              {imagePreview && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={imagePreview}
                    alt="preview"
                    style={{ width: 200, borderRadius: 8 }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="project-description">Mô tả dự án</label>
              <textarea
                id="project-description" name="description"
                value={formData.description} onChange={handleInputChange}
                rows={4}
                className={errors.description ? "error" : ""}
                placeholder="Nhập mô tả"
                disabled={saving}
              />
              {errors.description && (<span className="error-message-1">{errors.description}</span>)}
            </div>
          </div>

          <hr className="hr-2" />

          <div className="footer-modal">
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => dispatch(closeAllModals())}
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
    </div>
  );
}