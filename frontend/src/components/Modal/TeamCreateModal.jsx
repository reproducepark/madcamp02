import React, { useState } from 'react';
import { createTeam } from '../../services';
import { useTeamModal } from '../../hooks/useTeamModal';
import '../../styles/TeamModal.css'; // TeamModal.css 임포트

const TeamCreateModal = ({ isOpen, onClose, onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!teamName.trim()) {
      setError('팀 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await createTeam(teamName);
      if (response.success) {
        alert('팀이 성공적으로 생성되었습니다!');
        onTeamCreated(); // 팀 생성 후 부모 컴포넌트에 알림
        onClose();
        setTeamName('');
      } else {
        setError(response.message || '팀 생성에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('Team creation error:', err);
    }
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <h2>새 팀 생성</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="teamName">팀 이름:</label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀 이름을 입력하세요"
              required
              autoFocus
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="button primary">생성</button>
            <button type="button" className="button secondary" onClick={onClose}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamCreateModal;
