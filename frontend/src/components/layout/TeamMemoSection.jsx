import React, { useState, useEffect, useRef } from 'react';
import { getTeamMemos, createMemo, deleteMemo } from '../../services/memoService';
import { getCurrentUser } from '../../services/authService';
import { gatherDataForLLM } from '../../services/scrumService';
import { useTeamModal } from '../../hooks/useTeamModal';
import ScrumGenerationModal from '../Modal/ScrumGenerationModal';
import '../../styles/TeamMemoSection.css';

function TeamMemoSection({ teamId, teamName }) {
  const [memos, setMemos] = useState([]);
  const [newMemoInput, setNewMemoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingScrum, setIsGeneratingScrum] = useState(false);
  const [llmResult, setLlmResult] = useState(null);
  const {
    isOpen: isScrumModalOpen,
    openModal: openScrumModal,
    closeModal: closeScrumModal
  } = useTeamModal();
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
    if (!teamId) {
      console.error('팀 정보가 없습니다.');
      return;
    }

    setIsGeneratingScrum(true);
    setLlmResult(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const llmDataResponse = await gatherDataForLLM(teamId);
      if (signal.aborted) return;

      if (!llmDataResponse.success) {
        throw new Error(llmDataResponse.error || 'LLM용 데이터를 수집하는 데 실패했습니다.');
      }

      console.log('Sending data to LLM:', JSON.stringify(llmDataResponse.data, null, 2));

      const result = await window.electronAPI.llmGenerateText(
        JSON.stringify(llmDataResponse.data)
      );

      if (signal.aborted) return;

      console.log("Received from LLM:", result);

      if (result.success) {
        setLlmResult(result.text);
      } else {
        setLlmResult(`Error: ${result.message}`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('스크럼 생성 실패:', err);
        setLlmResult(`Error: ${err.message}`);
      }
    } finally {
      if (!signal.aborted) {
        setIsGeneratingScrum(false);
      }
      abortControllerRef.current = null;
    }
  };

  const handleOpenScrumModal = () => {
    openScrumModal();
    handleGenerateScrum();
  };

  const handleCloseScrumModal = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGeneratingScrum(false);
    }
    setLlmResult(null);
    closeScrumModal();
  };

  const handleCopyScrumResult = () => {
    if (llmResult) {
      navigator.clipboard.writeText(llmResult);
      // 사용자에게 복사되었음을 알리는 기능 추가 가능
    }
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
          <button
            className="ai-scrum-generate-btn"
            onClick={handleOpenScrumModal}
            title="AI 스크럼 생성"
            disabled={isGeneratingScrum || !teamId}
          >
            스크럼 생성하기
          </button>
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

      <ScrumGenerationModal
        isOpen={isScrumModalOpen}
        onClose={handleCloseScrumModal}
        isGenerating={isGeneratingScrum}
        result={llmResult}
        onCopy={handleCopyScrumResult}
      />
    </>
  );
}

export default TeamMemoSection; 