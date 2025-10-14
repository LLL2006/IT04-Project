import MainLayout from "../layouts/MainLayout";
import ProjectInfo from "../components/ProjectInfo";
import MemberList from "../components/Member";
import TaskTable from "../components/ProjectDetailTable";
import "../style/ProjectDetail.css";
import TaskModal from "../components/AddEditTask";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { fetchProjects, type Project } from "../slices/projectSlice";
import ListMember from "../components/ListMember";
import AddMember from "../components/AddMember";
import { setSelectedProject } from "../slices/uiSlice";

interface DetailedMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Task {
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

export default function ProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const { projects, loading } = useAppSelector((s) => s.projects);
  const users = useAppSelector((s) => s.auth?.user ?? null);
  const [detailedMembers, setDetailedMembers] = useState<DetailedMember[]>([]);
  const [isMembersLoading, setMembersLoading] = useState(false); // Cờ báo hiệu đang fetch thông tin thành viên

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setTasksLoading] = useState(false);
  const [reloadTasks, setReloadTasks] = useState(0);

  // Dùng `useRef` để tạo ra các biến "bền vững" không bị reset sau mỗi lần re-render.
  // Chúng được dùng cho cơ chế caching thủ công để tránh gọi API liên tục.
  const membersCache = useRef<DetailedMember[]>([]); // Lưu trữ kết quả fetch member gần nhất
  const isFetchingMembers = useRef(false); // Cờ để ngăn việc gọi fetch member nhiều lần cùng lúc
  const lastFetchedProjectId = useRef<string | null>(null); // Lưu ID của project đã fetch member gần nhất

  // Fetch projects nếu chưa có
  useEffect(() => {
    if (users?.id && projects.length === 0) {
      console.log("Fetching projects for user:", users.id);
      dispatch(fetchProjects(String(users.id)));
    }
  }, [users?.id, projects.length, dispatch]);

  // Lấy dữ liệu tạm thời từ `location.state` (khi chuyển trang) hoặc ID từ URL
  const stateData = (location.state ?? null) as Partial<Project> | null;
  const idFromQuery = searchParams.get("id");

  // Tìm project từ URL/state - LUÔN ƯU TIÊN projects từ Redux
  const project: Project | null = useMemo(() => {
    let projectId: string | null = null;

    // Lấy ID từ state hoặc query
    if (stateData?.id != null) {
      projectId = String(stateData.id);
    } else if (idFromQuery) {
      projectId = String(idFromQuery);
    }

    if (!projectId) return null;

    // LUÔN TÌM TRONG projects TRƯỚC (có đầy đủ members)
    const foundInProjects = projects.find((p) => String(p.id) === projectId);
    if (foundInProjects) {
      console.log("Found project in Redux store:", foundInProjects);
      return foundInProjects;
    }

    // Fallback: Chỉ dùng stateData khi không tìm thấy trong projects
    if (stateData?.id === projectId) {
      console.warn("⚠️ Using stateData as fallback (might miss members)");
      return {
        id: projectId,
        name: stateData.name ?? "",
        description: stateData.description,
        image: stateData.image,
        projectOwnerId: stateData.projectOwnerId ?? "",
        members: stateData.members ?? [],
      } as Project;
    }

    return null;
  }, [stateData?.id, idFromQuery, projects]);

  // Set selectedProject vào Redux (FIX dependency)
  useEffect(() => {
    if (project) {
      console.log("Set selectedProject:", project);
      dispatch(setSelectedProject(project));
    }
    return () => {
      dispatch(setSelectedProject(null));
    };
  }, [project, dispatch]); //

  const members = useMemo(() => {
    if (!project?.members) {
      console.log("⚠️ Project has no members array");
      return [];
    }
    const result = project.members.map((m) => ({
      ...m,
      userId: String(m.userId),
    }));
    console.log("📋 Members mapped:", result);
    return result;
  }, [project?.members]);

  // Fetch members khi project thay đổi
  const fetchMemberData = useCallback(
    async (projectMembers: typeof members, projectId: string) => {
      if (isFetchingMembers.current) {
        console.log("Already fetching members, skip...");
        return;
      }

      // Nếu đã fetch project này rồi và cache còn đủ → skip
      if (
        lastFetchedProjectId.current === projectId &&
        membersCache.current.length === projectMembers.length
      ) {
        console.log("Using cached members for project:", projectId);
        setDetailedMembers(membersCache.current);
        return;
      }

      isFetchingMembers.current = true;
      setMembersLoading(true);
      lastFetchedProjectId.current = projectId;

      try {
        console.log("Fetching members for project:", projectId);
        const promises = projectMembers.map(async (member) => {
          try {
            const response = await fetch(
              `http://localhost:3000/user/${member.userId}`
            );
            if (response.ok) {
              const userData = await response.json();
              return {
                userId: String(member.userId),
                name: userData.name,
                email: userData.email,
                role: member.role,
              };
            }
            return {
              userId: String(member.userId),
              name: `Unknown User #${member.userId}`,
              email: "N/A",
              role: member.role,
            };
          } catch (error) {
            console.error(`Failed to fetch user ${member.userId}`, error);
            return {
              userId: String(member.userId),
              name: `Unknown User #${member.userId}`,
              email: "N/A",
              role: member.role,
            };
          }
        });

        const enrichedMembers = await Promise.all(promises);
        console.log("Members fetched successfully:", enrichedMembers);

        membersCache.current = enrichedMembers;
        setDetailedMembers(enrichedMembers);
      } catch (error) {
        console.error("Error fetching members:", error);
        setDetailedMembers([]);
        membersCache.current = [];
      } finally {
        setMembersLoading(false);
        isFetchingMembers.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (!project?.id) return;
    const fetchTasksForProject = async () => {
      setTasksLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/task?projectId=${project.id}`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasksForProject();
  }, [project?.id, reloadTasks]);

  useEffect(() => {
    if (!project || !project.members || project.members.length === 0) {
      console.log("⚠️ No members in project");
      setDetailedMembers([]);
      membersCache.current = [];
      setMembersLoading(false);
      lastFetchedProjectId.current = null;
      return;
    }

    fetchMemberData(members, String(project.id));
  }, [project?.id, project?.members, fetchMemberData]);

  const handleOpenEditModal = (task: any) => {
    const membersToUse =
      detailedMembers.length > 0 ? detailedMembers : membersCache.current;

    if (membersToUse.length === 0) {
      alert("Chưa tải được danh sách thành viên. Vui lòng thử lại sau.");
      return;
    }

    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleOpenAddModal = () => {
    const membersToUse =
      detailedMembers.length > 0 ? detailedMembers : membersCache.current;

    if (membersToUse.length === 0) {
      alert("Chưa tải được danh sách thành viên. Vui lòng thử lại sau.");
      return;
    }

    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      const url = selectedTask
        ? `http://localhost:3000/task/${selectedTask.id}`
        : `http://localhost:3000/task`;
      const method = selectedTask ? "PUT" : "POST";
      const payload = { ...taskData, projectId: project?.id ?? null };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save task: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Task saved successfully:", result);

      // Trigger reload TaskTable (CHỈ reload tasks, KHÔNG touch project)
      setReloadFlag((prev) => prev + 1);
      handleCloseModal();
    } catch (err) {
      console.error("Error saving task:", err);
      throw err;
    }
  };

  if (!project) {
    if (loading) return <div>Đang tải dữ liệu dự án...</div>;
    return (
      <div>
        Không tìm thấy dự án.
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  // Luôn dùng cache nếu có, fallback về detailedMembers
  const membersForModal =
    detailedMembers.length > 0 ? detailedMembers : membersCache.current;

  console.log("🎯 Current state:", {
    project: project?.name,
    membersCount: members.length,
    detailedMembersCount: detailedMembers.length,
    cachedMembersCount: membersCache.current.length,
    isLoading: isMembersLoading,
    modalOpen: isTaskModalOpen,
  });

  return (
    <MainLayout>
      <div className="main-container">
        <div className="container">
          <div className="left">
            <ProjectInfo
              name={project.name}
              description={project.description || ""}
              image={project.image || undefined}
              onAddTask={handleOpenAddModal}
            />
          </div>

          <div className="right">
            <MemberList members={members} project={project} />

            <div className="filters">
              <select
                className="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Sắp xếp</option>
                <option value="deadline">Hạn chót</option>
                <option value="priority">Độ ưu tiên</option>
              </select>

              <input
                type="text"
                className="search-task"
                placeholder="Tìm kiếm nhiệm vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="content">
          <TaskTable
            projectId={project.id}
            onEditTask={handleOpenEditModal}
            reloadFlag={reloadFlag}
            searchTerm={searchTerm}
            sortBy={sortBy}
            members={detailedMembers}
            tasks={tasks} 
          />
        </div>

        {isTaskModalOpen && (
          <TaskModal
            key={`modal-${isTaskModalOpen}-${membersForModal.length}`}
            isOpen={isTaskModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveTask}
            initialData={selectedTask}
            members={membersForModal}
            existingTasks={tasks} 
          />
        )}

        <AddMember />
        <ListMember />
      </div>
    </MainLayout>
  );
}
