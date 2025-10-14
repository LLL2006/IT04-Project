import { useAppDispatch, useAppSelector } from "../store";
import { deleteProject } from "../slices/projectSlice";
import { closeAllModals } from "../slices/uiSlice";

type ConfirmDeleteModalProps = {
  isOpen?: boolean;
  name?: string;
  entityLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void;
};

export default function ConfirmDeleteModal(props: ConfirmDeleteModalProps) {
  const dispatch = useAppDispatch();

  const { modals, selectedProject } = useAppSelector((state) => state.ui);
  const { loading: projectsLoading, error: projectsError } = useAppSelector(
    (state) => state.projects
  );

  const isOpen = props.isOpen ?? modals.isDeleteProjectModalOpen;
  const name = props.name ?? selectedProject?.name ?? "";
  const entityLabel = props.entityLabel ?? "dự án";
  const loading = props.loading ?? projectsLoading;
  const error = props.error ?? projectsError;

  const handleClose = props.onClose ?? (() => dispatch(closeAllModals()));

  const handleConfirm =
    props.onConfirm ??
    (async () => {
      if (!selectedProject) return;
      try {
        await dispatch(deleteProject(selectedProject.id)).unwrap();
        dispatch(closeAllModals());
      } catch (err) {
        console.error("Error deleting project:", err);
      }
    });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="header-modal">
          <h2>Xác nhận xóa</h2>
          <button
            className="close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        <hr className="hr-1" />
        <div className="body-modal">
          <p>
            Bạn chắc chắn muốn xóa {entityLabel} <strong>"{name}"</strong>?
          </p>
          {error && <span className="error-message">{error}</span>}
        </div>
        <hr className="hr-2" />
        <div className="footer-modal">
          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="delete-btn-1"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
