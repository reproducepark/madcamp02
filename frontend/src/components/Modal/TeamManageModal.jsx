import React, { useState, useEffect, useRef } from 'react';
import { updateTeam, deleteTeam, addTeamMember, removeTeamMember } from '../../services';
import { useModal } from '../../hooks/useModal';
import Modal from './Modal';
import '../../styles/TeamModal.css'; // TeamModal.css 임포트

const TeamManageModal = ({ isOpen, onClose, team, onTeamUpdated, onTeamDeleted }) => {
  const [currentTeamName, setCurrentTeamName] = useState(team?.name || '');
  const [newMemberId, setNewMemberId] = useState('');
  const [teamMembers, setTeamMembers] = useState(team?.members || []);
  const teamNameInputRef = useRef(null);
  const newMemberInputRef = useRef(null);
  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  useEffect(() => {
    if (isOpen) {
      if (team) {
        setCurrentTeamName(team.name);
        setTeamMembers(team.members || []);
      } else {
        setCurrentTeamName('');
        setTeamMembers([]);
      }
      // 모달이 열릴 때 약간의 지연 후 포커스를 줍니다.
      setTimeout(() => teamNameInputRef.current?.focus(), 100);
    } else {
        // 모달이 닫힐 때 상태 초기화
        setCurrentTeamName('');
        setNewMemberId('');
        setTeamMembers([]);
    }
  }, [isOpen, team]);

  const handleNameChange = async () => {
    if (!currentTeamName.trim()) {
      await showAlert('오류', '팀 이름을 입력해주세요.');
      teamNameInputRef.current?.focus();
      return;
    }
    try {
      const response = await updateTeam(team.id, currentTeamName);
      if (response.success) {
        await showAlert('성공', '팀 이름이 성공적으로 변경되었습니다!');
        onTeamUpdated();
      } else {
        await showAlert('오류', response.message || '팀 이름 변경에 실패했습니다.');
      }
    } catch (err) {
      await showAlert('오류', '네트워크 오류가 발생했습니다.');
      console.error('Team name update error:', err);
    } finally {
      teamNameInputRef.current?.focus();
    }
  };

  const handleAddMember = async () => {
    if (!newMemberId.trim()) {
      await showAlert('오류', '추가할 멤버의 ID를 입력해주세요.');
      newMemberInputRef.current?.focus();
      return;
    }
    try {
      const response = await addTeamMember(team.id, newMemberId);
      if (response.success) {
        await showAlert('성공', '멤버가 성공적으로 추가되었습니다!');
        setTeamMembers([...teamMembers, { id: newMemberId, name: response.data.memberName }]); // Assuming API returns memberName
        setNewMemberId('');
        onTeamUpdated();
      } else {
        await showAlert('오류', response.message || '멤버 추가에 실패했습니다.');
      }
    } catch (err) {
      await showAlert('오류', '네트워크 오류가 발생했습니다.');
      console.error('Add member error:', err);
    } finally {
      newMemberInputRef.current?.focus();
    }
  };

  const handleRemoveMember = async (memberId) => {
    const confirmed = await showConfirm('확인', '정말로 이 멤버를 팀에서 제외하시겠습니까?');
    if (confirmed) {
      try {
        const response = await removeTeamMember(team.id, memberId);
        if (response.success) {
          await showAlert('성공', '멤버가 성공적으로 제외되었습니다!');
          setTeamMembers(teamMembers.filter(member => member.id !== memberId));
          onTeamUpdated();
        } else {
          await showAlert('오류', response.message || '멤버 제외에 실패했습니다.');
        }
      } catch (err) {
        await showAlert('오류', '네트워크 오류가 발생했습니다.');
        console.error('Remove member error:', err);
      }
    }
  };

  const handleDeleteTeam = async () => {
    const confirmed = await showConfirm('경고', '정말로 이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (confirmed) {
      try {
        const response = await deleteTeam(team.id);
        if (response.success) {
          await showAlert('성공', '팀이 성공적으로 삭제되었습니다!');
          onTeamDeleted();
          onClose();
        } else {
          await showAlert('오류', response.message || '팀 삭제에 실패했습니다.');
        }
      } catch (err) {
        await showAlert('오류', '네트워크 오류가 발생했습니다.');
        console.error('Delete team error:', err);
      }
    }
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <h2>팀 관리: {team?.name || ''}</h2>

        <div className="form-group">
          <label htmlFor="teamName">팀 이름:</label>
          <input
            type="text"
            id="teamName"
            ref={teamNameInputRef}
            value={currentTeamName}
            onChange={(e) => setCurrentTeamName(e.target.value)}
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
            ref={newMemberInputRef}
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

      {/* 모달 */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </div>
  );
};

export default TeamManageModal;
