export default function ProjectTable({
  projects,
  onEdit,
  onDelete,
  onDetail,
}: any) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên Dự Án</th>
          <th>Hành Động</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project: any) => (
          <tr key={project.id}>
            <td>{project.id}</td>
            <td>{project.name}</td>
            <td>
              <button className="edit-btn" onClick={() => onEdit(project)}>
                Sửa
              </button>
              <button className="delete-btn" onClick={() => onDelete(project)}>
                Xóa
              </button>
              <button className="detail-btn" onClick={() => onDetail(project)}>
                Chi tiết
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
