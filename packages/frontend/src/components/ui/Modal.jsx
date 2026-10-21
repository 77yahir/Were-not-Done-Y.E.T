import { useEffect } from "react";
import closeIcon from "../../assets/icons/close.svg";

// Pop-up box styled like the Figma "SignUp" frame
function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}>
        <div className="modal-inner">
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close">
            <img src={closeIcon} alt="" width="28" height="28" />
          </button>

          <h2 className="modal-title">{title}</h2>

          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
