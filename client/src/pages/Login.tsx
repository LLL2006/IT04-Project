import { useState } from "react";
import "../style/Login.css";
import { useAuth } from "../context/authContext"; // Hook tùy chỉnh để lấy hàm login từ Context
import { useNavigate } from "react-router-dom"; // Hook để điều hướng giữa các trang
import { setUser } from "../slices/uiSlice"; // Action của Redux để cập nhật thông tin user
import { useAppDispatch } from "../store"; // Hook tùy chỉnh để gửi action tới Redux store

export default function Login() {

  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const navigate = useNavigate(); // Lấy hàm navigate để điều hướng người dùng sang trang khác.
  const dispatch = useAppDispatch(); // Lấy hàm dispatch để có thể gửi action tới Redux.


  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value })); 
    
    if (name === "email" || name === "password") {
      setErrors((prev) => ({ ...prev, email: "", password: "", general: "" }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  const validate = () => {
    let valid = true; 
    const newErrors = { email: "", password: "", general: "" };

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
    }

    setErrors(newErrors); 
    return valid; 
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault(); 
    if (!validate()) return; 

    try {
      // 1. Lấy toàn bộ danh sách người dùng từ server.
      const res = await fetch("http://localhost:3000/user");
      const users = await res.json();

      // 2. Dùng hàm `find` để tìm trong mảng user xem có ai khớp email và password không.
      const foundUser = users.find(
        (u: any) => u.email === form.email && u.password === form.password
      );

      // 3. Nếu không tìm thấy user nào, hiển thị thông báo lỗi.
      if (!foundUser) {
        const commonMsg = "Email hoặc mật khẩu không đúng";
        setErrors({ email: commonMsg, password: commonMsg, general: "" });
        return; // Dừng hàm.
      }

      // 4. Nếu tìm thấy user, thực hiện đăng nhập.
      dispatch(setUser(foundUser)); // Cập nhật thông tin user vào Redux store.
      login(foundUser); // Cập nhật thông tin user vào AuthContext và localStorage.
      
      navigate("/project-management");

    } catch (error) {
      console.error("Lỗi kết nối server:", error);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-title">Đăng nhập</div>
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          
          <div>
            <label htmlFor="email" className="login-label">Email</label>
            <input
              type="text" id="email" name="email"
              placeholder="Địa chỉ email"
              className={`login-input ${errors.email ? "error" : ""}`} 
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && (
              <span className={`error-message ${errors.email ? "show" : ""}`}>
                {errors.email}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="password" className="login-label">Mật khẩu</label>
            <input
              type="password" id="password" name="password"
              placeholder="Mật khẩu"
              className={`login-input ${errors.password ? "error" : ""}`}
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && (
              <span className={`error-message ${errors.password ? "show" : ""}`}>
                {errors.password}
              </span>
            )}
          </div>
          
          <button type="submit" className="login-btn">Đăng nhập</button>
          
          <p className="login-link">
            Chưa có tài khoản? 
            <a href="/register">Đăng ký</a>
          </p>
        </form>
      </div>
    </div>
  );
}