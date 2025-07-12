import { useState, useCallback } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    confirmText: '확인',
    cancelText: '취소',
    onConfirm: null,
    onCancel: null
  });

  const showAlert = useCallback((title, message, confirmText = '확인') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'alert',
        confirmText,
        onConfirm: () => resolve(true),
        onCancel: null
      });
    });
  }, []);

  const showConfirm = useCallback((title, message, confirmText = '확인', cancelText = '취소') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    showAlert,
    showConfirm,
    closeModal
  };
};