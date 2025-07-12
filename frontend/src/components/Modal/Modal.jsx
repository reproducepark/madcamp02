import React, { useEffect } from 'react';
import '../../styles/Modal.css';

function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'alert', // 'alert' 또는 'confirm'
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel
}) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열렸을 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          {type === 'confirm' && (
            <button className="modal-button modal-button-cancel" onClick={handleCancel}>
              {cancelText}
            </button>
          )}
          <button 
            className={`modal-button modal-button-${type === 'confirm' ? 'confirm' : 'primary'}`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal; 