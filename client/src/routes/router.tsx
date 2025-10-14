import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProjectManagement from "../pages/ProjectManagement";
import ProjectDetails from "../pages/ProjectDetails";
import TaskManagement from "../pages/TaskManagement";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/project-management",
    element: (
      <ProtectedRoute>
        <ProjectManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/project-detail",
    element: (
      <ProtectedRoute>
        <ProjectDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: "/task-management",
    element: (
      <ProtectedRoute>
        <TaskManagement />
      </ProtectedRoute>
    ),
  },

  { path: "*", element: <Login /> },
]);
