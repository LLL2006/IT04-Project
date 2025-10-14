interface Props {
  name: string;
  description: string;
  image?: string | null;
  onAddTask: () => void;
}

export default function ProjectInfo({
  name,
  description,
  image,
  onAddTask,
}: Props) {
  return (
    <div className="project-details">
      <h2 className="title-project">{name}</h2>

      <div className="info-project">
        {image && (
          <img
            src={image}
            alt={name}
            style={{ maxWidth: "200px", objectFit: "cover" }}
          />
        )}
        <p className="description">{description}</p>
      </div>

      <button className={image ? "add-task-btn" : "add-task-btn-1"} onClick={onAddTask}> 
        + Thêm nhiệm vụ
      </button>
    </div>
  );
}
