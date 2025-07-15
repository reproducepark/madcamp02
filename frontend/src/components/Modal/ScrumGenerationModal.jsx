import React from 'react';
import '../../styles/Modal.css';
import '../../styles/ScrumGenerationModal.css';

function ScrumGenerationModal({ 
  isOpen, 
  onClose, 
  isGenerating, 
  result, 
  onCopy 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container scrum-generation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">스크럼 생성 결과</h3>
          <button onClick={onClose} className="modal-close" aria-label="닫기">&times;</button>
        </div>
        
        <div className="modal-body">
          {isGenerating && (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>스크럼을 생성하고 있습니다...</p>
            </div>
          )}
          {result && (
            <div className="llm-result-container">
              <pre className="llm-result-raw">{result}</pre>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onCopy}
            className="modal-button modal-button-primary"
            disabled={!result || isGenerating}
          >
            복사하기
          </button>
          <button 
            onClick={onClose}
            className="modal-button modal-button-cancel"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScrumGenerationModal; 