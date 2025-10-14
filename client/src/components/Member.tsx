import { useEffect, useState } from "react"; 
import { useAppDispatch } from "../store"; 
import {
  openAddMemberModal,
  openMemberListModal,
  setSelectedProject,
} from "../slices/uiSlice";

interface Member {
  userId: string;
  role: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface EnrichedMember extends Member {
  name: string;
  email: string;
}

interface MemberListProps {
  members?: Member[];
  project?: any;
}

const API_BASE = "http://localhost:3000";

export default function MemberList({ members = [], project }: MemberListProps) {
  const dispatch = useAppDispatch(); // Lấy hàm dispatch để gửi actions tới Redux.

  // State `enrichedMembers`: Lưu trữ danh sách thành viên sau khi đã lấy thêm thông tin (tên, email) từ API.
  const [enrichedMembers, setEnrichedMembers] = useState<EnrichedMember[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (members.length === 0) {
      setEnrichedMembers([]);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true); // Bắt đầu loading.
      try {
        const promises = members.map((member) =>
          fetch(`${API_BASE}/user/${member.userId}`).then((res) => res.json())
        );
        // Chờ cho đến khi tất cả các yêu cầu hoàn thành.
        const users: UserData[] = await Promise.all(promises);

        // Sau khi có dữ liệu user, gộp nó với dữ liệu `members` ban đầu.
        const enriched = members.map((member, index) => ({
          ...member, // Giữ lại `userId` và `role`.
          name: users[index]?.name || `User ${member.userId}`, // Lấy tên, nếu không có thì dùng tên mặc định.
          email: users[index]?.email || "",
        }));

        setEnrichedMembers(enriched);
      } catch (error) {
        console.error("Error fetching user data:", error);
        const fallback = members.map((member) => ({
          ...member,
          name: `User ${member.userId}`,
          email: "",
        }));
        setEnrichedMembers(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [JSON.stringify(members)]); 


  const handleAddMember = () => {
    if (project) {
      dispatch(setSelectedProject(project));
    }
    dispatch(openAddMemberModal());
  };

  const handleViewAllMembers = () => {
    if (project) {
      dispatch(setSelectedProject(project));
    }
    dispatch(openMemberListModal());
  };

  
  // Hàm này trả về một màu sắc từ danh sách dựa trên `index`, giúp tạo avatar có màu khác nhau.
  const getAvatarColor = (index: number) => {
    const colors = ["#2196F3", "#9C27B0", "#FF9800", "#4CAF50", "#F44336"];
    return colors[index % colors.length];
  };


  if (loading) {
    return (
      <div className="member-list-container">
        <div className="member-list-header"><h3>Thành viên</h3></div>
        <div className="member-list-content"><p>Đang tải...</p></div>
      </div>
    );
  }

  return (
    <div className="member-list-container">
      <div className="member-list-header">
        <h3>Thành viên</h3>
        <button type="button" className="add-member-btn" onClick={handleAddMember}>
          + Thêm thành viên
        </button>
      </div>

      <div className="member-list-content">
        {enrichedMembers.length === 0 ? (
          <p>Chưa có thành viên nào</p>
        ) : (
          <>
            {enrichedMembers.slice(0, 2).map((member, index) => (
              <div key={member.userId} className="member-item">
                <div className="avatar" style={{ backgroundColor: getAvatarColor(index) }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="member-more-btn"
              onClick={handleViewAllMembers}
            >
              ⋯
            </button>
          </>
        )}
      </div>
    </div>
  );
}