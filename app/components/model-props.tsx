import React from "react";

interface ModalProps2 {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const Modal2: React.FC<ModalProps2> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "white",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <p>是否采纳此建议？</p>
      <button
        onClick={() => {
          onAccept();
          onClose();
        }}
      >
        采纳
      </button>
      <button
        onClick={() => {
          onReject();
          onClose();
        }}
      >
        不采纳
      </button>
    </div>
  );
};

export default Modal2;
