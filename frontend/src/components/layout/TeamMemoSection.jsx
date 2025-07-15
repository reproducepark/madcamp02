import React, { useState, useEffect, useRef } from 'react';
import { getTeamMemos, createMemo, deleteMemo } from '../../services/memoService';
import { getCurrentUser } from '../../services/authService';
import { generateScrumPage } from '../../services/llmService';
import ScrumGenerationModal from '../Modal/ScrumGenerationModal';
import '../../styles/TeamMemoSection.css';

function TeamMemoSection({ teamId, teamName }) {
  const [memos, setMemos] = useState([]);
  const [newMemoInput, setNewMemoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingScrum, setIsGeneratingScrum] = useState(false);
  const [scrumModalOpen, setScrumModalOpen] = useState(false);
  const [scrumData, setScrumData] = useState(null);
  const [scrumError, setScrumError] = useState(null);
  const currentUser = getCurrentUser();
  const abortControllerRef = useRef(null);

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
      console.error('❌ 에러 상세:', err.response || err);
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

  // AI 스크럼 생성
  const handleGenerateScrum = async () => {
    if (!teamId || !teamName) {
      console.error('팀 정보가 없습니다.');
      return;
    }

    setIsGeneratingScrum(true);
    setScrumModalOpen(true);
    setScrumData(null);
    setScrumError(null);

    // 이전 요청이 있다면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      // 현재 페이지의 목표 데이터를 가져오기 위해 이벤트를 발생시킴
      const goalsData = await new Promise((resolve) => {
        const handleGoalsData = (event) => {
          window.removeEventListener('getGoalsData', handleGoalsData);
          resolve(event.detail);
        };
        window.addEventListener('getGoalsData', handleGoalsData);
        window.dispatchEvent(new CustomEvent('requestGoalsData'));
      });

      console.log('📊 스크럼 생성 데이터:', {
        teamName,
        goals: goalsData,
        memos
      });

      const result = await generateScrumPage({
        teamName,
        goals: goalsData,
        memos
      });

      // 요청이 취소되었는지 확인
      if (abortControllerRef.current.signal.aborted) {
        console.log('스크럼 생성이 취소되었습니다.');
        return;
      }

      if (result.success) {
        setScrumData(result.scrumPage);
      } else {
        setScrumError(result.error || '스크럼 생성에 실패했습니다.');
      }
    } catch (err) {
      // AbortError는 무시 (사용자가 취소한 경우)
      if (err.name !== 'AbortError') {
        console.error('스크럼 생성 실패:', err);
        setScrumError('스크럼 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGeneratingScrum(false);
      abortControllerRef.current = null;
    }
  };

  // 스크럼 모달 닫기
  const handleCloseScrumModal = () => {
    // 진행 중인 요청이 있다면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setScrumModalOpen(false);
    setScrumData(null);
    setScrumError(null);
    setIsGeneratingScrum(false);
  };

  // 팀이 변경될 때마다 메모 로드
  useEffect(() => {
    console.log('🔄 팀 변경 감지 - 팀 ID:', teamId, '팀 이름:', teamName);
    loadTeamMemos();
  }, [teamId]);

  // 컴포넌트 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      <section className="todo-memo-section">
        <div className="todo-memo-title">
          <span>{teamName ? `${teamName} 팀 메모장` : '메모장'}</span>
          {teamId && (
            <button 
              className="ai-scrum-generate-btn"
              onClick={handleGenerateScrum}
              title="AI 스크럼 생성"
              disabled={isGeneratingScrum}
            >
              🤖 AI 스크럼
            </button>
          )}
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
                  {currentUser && memo.user_id === currentUser.id && (
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

      {/* AI 스크럼 생성 모달 */}
      <ScrumGenerationModal
        isOpen={scrumModalOpen}
        onClose={handleCloseScrumModal}
        scrumData={scrumData}
        isLoading={isGeneratingScrum}
        error={scrumError}
      />
    </>
  );
}

export default TeamMemoSection; 