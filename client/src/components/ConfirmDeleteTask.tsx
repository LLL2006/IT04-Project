import React from "react";

type ConfirmDeleteTaskProps = {
  isOpen: boolean;
  taskName: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

const ConfirmDeleteTask: React.FC<ConfirmDeleteTaskProps> = ({
  isOpen,
  taskName,
  loading,
  error,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="header-modal">
          <h2>Xác nhận xóa</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>
        <hr className="hr-1" />
        <div className="body-modal">
          <p>
            Bạn chắc chắn muốn xóa nhiệm vụ <strong>"{taskName}"</strong>?
          </p>
          {error && <span className="error-message">{error}</span>}
        </div>
        <hr className="hr-2" />
        <div className="footer-modal">
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button
              className="delete-btn-1"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteTask;
