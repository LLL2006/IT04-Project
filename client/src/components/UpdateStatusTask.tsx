// Định nghĩa các props mà component này sẽ nhận
interface UpdateStatusTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function UpdateStatusTask({
  isOpen,
  onClose,
  onConfirm,
}: UpdateStatusTaskProps) {
  // Nếu modal không mở, không render gì cả
  if (!isOpen) {
    return null;
  }

  return (
    <div>
      <div className="modal-overlay-1">
        <div
          className="modal-content-1"
          style={{ maxWidth: "480px", maxHeight: "230px" }}
        >
          <div className="header-modal">
            <h2>Cập nhật trạng thái</h2>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="body-modal">
            <p>Xác nhận cập nhật trạng thái nhiệm vụ?</p>
          </div>
          <div className="footer-modal">
            <div className="modal-actions-1">
              <button className="cancel-btn" onClick={onClose}>
                Hủy
              </button>
              <button className="save-btn" onClick={onConfirm}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
