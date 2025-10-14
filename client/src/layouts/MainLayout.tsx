import { Link, } from "react-router-dom";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout-root">
      <header className="main-header">
        <div className="header-container">
          <div className="logo">Quản Lý Dự Án</div>
          <nav>
            <Link to="/project-management">Dự Án</Link>
            <Link to="/task-management">Nhiệm Vụ Của Tôi</Link>
            <Link to="/login">Đăng Xuất</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="main-footer">
        <p>&copy; 2025 Team management. All rights reserved.</p>
      </footer>
    </div>
  );
}
