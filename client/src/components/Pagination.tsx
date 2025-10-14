export default function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        {"<"}
      </button>
      {[...Array(total)].map((_, i) => (
        <button
          key={i}
          className={`page-btn-number${page === i + 1 ? " active" : ""}`}
          onClick={() => onChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button
        className="page-btn"
        disabled={page === total}
        onClick={() => onChange(page + 1)}
      >
        {">"}
      </button>
    </div>
  );
}
