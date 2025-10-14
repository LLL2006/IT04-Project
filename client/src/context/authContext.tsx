import {
  createContext, // Hàm để tạo một đối tượng Context mới
  useContext, // Hook để một component có thể "lắng nghe" và sử dụng Context
  useState,
  useEffect,
  ReactNode, // Kiểu dữ liệu của TypeScript cho các component con (children)
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// `createContext` tạo ra một đối tượng Context. Các component con sẽ "đăng ký" để nhận dữ liệu từ đây.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// cung cấp trạng thái đăng nhập (user, login, logout) cho tất cả các component con bên trong nó.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // 1. Đọc dữ liệu user đã được lưu trong `localStorage` (bộ nhớ cục bộ của trình duyệt).
      const storedUser = localStorage.getItem("user");
      
      // 2. Nếu có dữ liệu...
      if (storedUser) {
        // ...chuyển chuỗi JSON đó ngược lại thành một object và cập nhật vào state `user`.
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Lỗi khi đọc user từ localStorage", error);
      localStorage.removeItem("user"); 
    } finally {
      // Báo hiệu rằng quá trình kiểm tra đã hoàn tất.
      setLoading(false);
    }
  }, []);

  // Hàm `login`: Được gọi khi người dùng đăng nhập thành công.
  const login = (userData: User) => {
    // Cập nhật trạng thái `user` trong component.
    setUser(userData);
    // Lưu thông tin người dùng vào `localStorage` dưới dạng chuỗi JSON để "ghi nhớ" cho lần sau.
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Hàm `logout`: Được gọi khi người dùng đăng xuất.
  const logout = () => {
    // Xóa thông tin người dùng khỏi trạng thái của component.
    setUser(null);
    // Xóa thông tin người dùng khỏi `localStorage`.
    localStorage.removeItem("user");
  };

  if (loading) {
    return <div>Đang tải ứng dụng...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Kiểm tra an toàn: Nếu một component gọi `useAuth` mà không nằm bên trong `<AuthProvider>`,
  // nó sẽ báo lỗi ngay lập tức, giúp lập trình viên dễ dàng tìm ra vấn đề.
  if (context === undefined) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context; // Trả về { user, login, logout }
};