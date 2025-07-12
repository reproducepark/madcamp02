import React, { useState, useEffect } from 'react';
import { updateTeam, deleteTeam, addTeamMember, removeTeamMember, getTeams } from '../../services';
import { useTeamModal } from '../../hooks/useTeamModal';
import '../../styles/TeamModal.css'; // TeamModal.css 임포트

const TeamManageModal = ({ isOpen, onClose, team, onTeamUpdated, onTeamDeleted }) => {
  const [currentTeamName, setCurrentTeamName] = useState(team?.name || '');
  const [newMemberId, setNewMemberId] = useState('');
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState(team?.members || []);

  useEffect(() => {
    if (team) {
      setCurrentTeamName(team.name);
      setTeamMembers(team.members || []);
    }
  }, [team]);

  const handleNameChange = async () => {
    setError('');
    if (!currentTeamName.trim()) {
      setError('팀 이름을 입력해주세요.');
      return;
    }
    try {
      const response = await updateTeam(team.id, currentTeamName);
      if (response.success) {
        alert('팀 이름이 성공적으로 변경되었습니다!');
        onTeamUpdated();
      } else {
        setError(response.message || '팀 이름 변경에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('Team name update error:', err);
    }
  };

  const handleAddMember = async () => {
    setError('');
    if (!newMemberId.trim()) {
      setError('추가할 멤버의 ID를 입력해주세요.');
      return;
    }
    try {
      const response = await addTeamMember(team.id, newMemberId);
      if (response.success) {
        alert('멤버가 성공적으로 추가되었습니다!');
        setTeamMembers([...teamMembers, { id: newMemberId, name: response.data.memberName }]); // Assuming API returns memberName
        setNewMemberId('');
        onTeamUpdated();
      } else {
        setError(response.message || '멤버 추가에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('Add member error:', err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setError('');
    if (window.confirm('정말로 이 멤버를 팀에서 제외하시겠습니까?')) {
      try {
        const response = await removeTeamMember(team.id, memberId);
        if (response.success) {
          alert('멤버가 성공적으로 제외되었습니다!');
          setTeamMembers(teamMembers.filter(member => member.id !== memberId));
          onTeamUpdated();
        } else {
          setError(response.message || '멤버 제외에 실패했습니다.');
        }
      } catch (err) {
        setError('네트워크 오류가 발생했습니다.');
        console.error('Remove member error:', err);
      }
    }
  };

  const handleDeleteTeam = async () => {
    setError('');
    if (window.confirm('정말로 이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const response = await deleteTeam(team.id);
        if (response.success) {
          alert('팀이 성공적으로 삭제되었습니다!');
          onTeamDeleted();
          onClose();
        } else {
          setError(response.message || '팀 삭제에 실패했습니다.');
        }
      } catch (err) {
        setError('네트워크 오류가 발생했습니다.');
        console.error('Delete team error:', err);
      }
    }
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <h2>팀 관리: {team?.name}</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label htmlFor="teamName">팀 이름:</label>
          <input
            type="text"
            id="teamName"
            value={currentTeamName}
            onChange={(e) => setCurrentTeamName(e.target.value)}
            autoFocus
          />
          <button className="button primary" onClick={handleNameChange}>이름 변경</button>
        </div>

        <h3>팀 멤버</h3>
        <ul className="team-members-list">
          {teamMembers.length > 0 ? (
            teamMembers.map(member => (
              <li key={member.id}>
                {member.name} ({member.id})
                <button className="button danger" onClick={() => handleRemoveMember(member.id)}>X</button>
              </li>
            ))
          ) : (
            <li>아직 팀 멤버가 없습니다.</li>
          )}
        </ul>

        <div className="form-group">
          <label htmlFor="newMemberId">멤버 추가 (ID):</label>
          <input
            type="text"
            id="newMemberId"
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
            placeholder="추가할 멤버의 사용자 ID"
          />
          <button className="button primary" onClick={handleAddMember}>멤버 추가</button>
        </div>

        <div className="danger-zone">
          <h3>위험 구역</h3>
          <button className="button danger" onClick={handleDeleteTeam}>팀 삭제</button>
        </div>

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default TeamManageModal;
