import React from 'react';
import '../../styles/ScrumGenerationModal.css';

function ScrumGenerationModal({ isOpen, onClose, scrumData, isLoading, error }) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return '#ff4757';
      case 'MEDIUM': return '#ffa502';
      case 'LOW': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return '높음';
      case 'MEDIUM': return '보통';
      case 'LOW': return '낮음';
      default: return '미정';
    }
  };

  return (
    <div className="scrum-modal-overlay" onClick={handleClose}>
      <div className="scrum-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="scrum-modal-header">
          <h2>AI 스크럼 생성 결과</h2>
          <button className="scrum-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="scrum-modal-body">
          {isLoading && (
            <div className="scrum-loading">
              <div className="scrum-loading-spinner"></div>
              <p>AI가 스크럼을 생성하고 있습니다...</p>
              <button 
                className="scrum-cancel-btn"
                onClick={onClose}
              >
                취소
              </button>
            </div>
          )}

          {error && (
            <div className="scrum-error">
              <h3>오류가 발생했습니다</h3>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && scrumData && (
            <div className="scrum-result">
              {/* 스프린트 정보 */}
              <div className="scrum-sprint-info">
                <h3>{scrumData.sprint_title}</h3>
                <p className="sprint-duration">기간: {scrumData.sprint_duration}</p>
              </div>

              {/* 스프린트 목표 */}
              <div className="scrum-goals-section">
                <h4>스프린트 목표</h4>
                <div className="scrum-goals-list">
                  {scrumData.sprint_goals?.map((goal, index) => (
                    <div key={index} className="scrum-goal-item">
                      <div className="goal-header">
                        <h5>{goal.title}</h5>
                        <div className="goal-meta">
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(goal.priority) }}
                          >
                            {getPriorityText(goal.priority)}
                          </span>
                          <span className="estimated-hours">{goal.estimated_hours}시간</span>
                          <span className="assignee">{goal.assignee}</span>
                        </div>
                      </div>
                      <p className="goal-description">{goal.description}</p>
                      {goal.acceptance_criteria && goal.acceptance_criteria.length > 0 && (
                        <div className="acceptance-criteria">
                          <h6>수락 기준:</h6>
                          <ul>
                            {goal.acceptance_criteria.map((criteria, idx) => (
                              <li key={idx}>{criteria}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 팀 노트 */}
              {scrumData.team_notes && scrumData.team_notes.length > 0 && (
                <div className="scrum-notes-section">
                  <h4>팀 노트</h4>
                  <ul className="scrum-notes-list">
                    {scrumData.team_notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 위험 요소 */}
              {scrumData.risks_and_blockers && scrumData.risks_and_blockers.length > 0 && (
                <div className="scrum-risks-section">
                  <h4>위험 요소 및 차단 요소</h4>
                  <ul className="scrum-risks-list">
                    {scrumData.risks_and_blockers.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 다음 액션 */}
              {scrumData.next_actions && scrumData.next_actions.length > 0 && (
                <div className="scrum-actions-section">
                  <h4>다음 액션</h4>
                  <ul className="scrum-actions-list">
                    {scrumData.next_actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {!isLoading && !error && (
          <div className="scrum-modal-footer">
            <button className="scrum-modal-btn secondary" onClick={onClose}>
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScrumGenerationModal; 