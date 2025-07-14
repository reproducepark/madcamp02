import React, { useState, useEffect } from 'react';
import { getTeamMemos, createMemo, deleteMemo } from '../../services/memoService';
import { getCurrentUser } from '../../services/authService';
import '../../styles/TeamMemoSection.css';

function TeamMemoSection({ teamId, teamName }) {
  const [memos, setMemos] = useState([]);
  const [newMemoInput, setNewMemoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = getCurrentUser();

  // 팀 메모 로드
  const loadTeamMemos = async () => {
    if (!teamId) return;
    
    console.log('🔄 팀 메모 로딩 시작 - 팀 ID:', teamId, '팀 이름:', teamName);
    setIsLoading(true);
    try {
      const response = await getTeamMemos(teamId);
      console.log('📋 팀 메모 응답:', response);
      console.log('👤 현재 사용자:', currentUser);
      setMemos(response.data.memos || []);
    } catch (err) {
      console.error('❌ 팀 메모 로딩 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 메모 추가
  const handleAddMemo = async () => {
    if (!newMemoInput.trim() || !teamId) return;

    try {
      await createMemo(newMemoInput.trim(), teamId);
      setNewMemoInput('');
      await loadTeamMemos(); // 메모 목록 새로고침
    } catch (err) {
      console.error('메모 생성 실패:', err);
    }
  };

  // 메모 삭제
  const handleDeleteMemo = async (memoId) => {
    try {
      await deleteMemo(memoId);
      await loadTeamMemos(); // 메모 목록 새로고침
    } catch (err) {
      console.error('메모 삭제 실패:', err);
    }
  };

  // 팀이 변경될 때마다 메모 로드
  useEffect(() => {
    console.log('🔄 팀 변경 감지 - 팀 ID:', teamId, '팀 이름:', teamName);
    loadTeamMemos();
  }, [teamId]);

  return (
    <section className="todo-memo-section">
      <div className="todo-memo-title">
        {teamName ? `${teamName} 팀 메모장` : '메모장'}
      </div>
      
      <div className="todo-memo-content">
        {isLoading ? (
          <div className="memo-loading">로딩 중...</div>
        ) : memos.length === 0 ? (
          <div className="memo-empty">아직 메모가 없습니다.</div>
        ) : (
          <div className="memo-list">
            {memos.map((memo) => (
              <div key={memo.id} className="memo-item">
                <div className="memo-content">{memo.content}</div>
                {currentUser && memo.user_id === currentUser.num && (
                  <button 
                    className="memo-delete-btn"
                    onClick={() => handleDeleteMemo(memo.id)}
                    title="삭제"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="todo-memo-input-group">
        <input
          type="text"
          className="memo-input"
          placeholder="메모를 입력하세요..."
          value={newMemoInput}
          onChange={(e) => setNewMemoInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddMemo()}
          disabled={!teamId}
        />
        <button 
          className="memo-add-btn"
          onClick={handleAddMemo}
          disabled={!teamId || !newMemoInput.trim()}
        >
          추가
        </button>
      </div>
    </section>
  );
}

export default TeamMemoSection; 