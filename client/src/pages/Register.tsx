import "../style/Register.css"; 
import { useState } from "react"; 
import { useNavigate } from "react-router-dom"; // Hook để điều hướng giữa các trang
import { useAuth } from "../context/authContext"; // Hook tùy chỉnh để lấy hàm login từ AuthContext
import { useAppDispatch } from "../store"; // Hook tùy chỉnh để gửi action tới Redux store
import { setUser } from "../slices/uiSlice"; // Action của Redux để cập nhật thông tin user

export default function Register() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const dispatch = useAppDispatch(); // Lấy hàm dispatch để có thể gửi action tới Redux.
  const navigate = useNavigate(); // Lấy hàm navigate để điều hướng người dùng sang trang khác.
  const { login } = useAuth(); // Lấy hàm login từ AuthContext để cập nhật trạng thái đăng nhập.

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    let valid = true; 
    const newErrors = { name: "", email: "", password: "", confirmPassword: "" };

    if (!form.name) {
      newErrors.name = "Vui lòng nhập họ và tên";
      valid = false;
    }
    if (!form.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) { 
      newErrors.email = "Email không hợp lệ";
      valid = false;
    }
    if (!form.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
      valid = false;
    } else if (form.password.length < 8) {
      newErrors.password = "Mật khẩu phải ít nhất 8 ký tự";
      valid = false;
    }
    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      valid = false;
    } else if (!form.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      valid = false;
    }

    setErrors(newErrors); 
    return valid; 
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault(); 
    if (!validate()) return; 

    try {
      // 1. Lấy toàn bộ danh sách người dùng từ server để kiểm tra.
      const res = await fetch("http://localhost:3000/user");
      const users = await res.json();

      // 2. Kiểm tra xem email đã tồn tại trong danh sách chưa.
      const emailToCheck = form.email.trim().toLowerCase();
      const exists = users.some(
        (u: any) => (u.email || "").trim().toLowerCase() === emailToCheck
      );

      // Nếu email đã tồn tại, hiển thị lỗi và dừng lại.
      if (exists) {
        setErrors((prev) => ({ ...prev, email: "Email đã được đăng ký" }));
        return;
      }

      // 3. Logic tự tính toán ID cho người dùng mới.
      // Lấy ID của user cuối cùng trong danh sách, chuyển thành số và cộng thêm 1.
      const lastId = users.length > 0 ? parseInt(users[users.length - 1].id.replace(/\D/g, "")) : 0;
      const newId = lastId + 1;

      // 4. Chuẩn bị dữ liệu người dùng mới để gửi lên server.
      const newUser = {
        id: newId.toString(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      };

      // 5. Gửi yêu cầu POST để tạo user mới trên server.
      const resAdd = await fetch("http://localhost:3000/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      // 6. Nếu tạo user thành công, thực hiện tự động đăng nhập.
      if (resAdd.ok) {
        const registeredUser = await resAdd.json(); // Lấy lại thông tin user vừa tạo từ server.

        dispatch(setUser(registeredUser)); // Cập nhật user vào Redux store.
        login(registeredUser); // Cập nhật user vào AuthContext và localStorage.
        
        navigate("/project-management");
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <div className="register-bg">
      <div className="register-container">
        <h2 className="register-title">Đăng ký</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <input
              type="text" name="name" placeholder="Họ và tên"
              className={`register-input ${errors.name ? 'error' : ''}`} 
              value={form.name} onChange={handleChange}
            />
            {errors.name && (<span className="error-message show">{errors.name}</span>)}
          </div>

          <div className="form-group">
            <input
              type="text" name="email" placeholder="Địa chỉ email"
              className={`register-input ${errors.email ? 'error' : ''}`}
              value={form.email} onChange={handleChange}
            />
            {errors.email && (<span className="error-message show">{errors.email}</span>)}
          </div>

          <div className="form-group">
            <input
              type="password" name="password" placeholder="Mật khẩu"
              className={`register-input ${errors.password ? 'error' : ''}`}
              value={form.password} onChange={handleChange}
            />
            {errors.password && (<span className="error-message show">{errors.password}</span>)}
          </div>

          <div className="form-group">
            <input
              type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu"
              className={`register-input ${errors.confirmPassword ? "error" : ""}`}
              value={form.confirmPassword} onChange={handleChange}
            />
            {errors.confirmPassword && (<span className="error-message show">{errors.confirmPassword}</span>)}
          </div>
          
          <button type="submit" className="register-btn">Đăng ký</button>
          
          <div className="register-login-link">
            Đã có tài khoản? 
            <a href="/login">Đăng nhập</a>
          </div>
        </form>
      </div>
    </div>
  );
}