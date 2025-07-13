import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import ScrumGoalItem from '../layout/ScrumGoalItem';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';
import { getTeams } from '../../services'; // getTeams import
import '../../styles/ScrumPage.css';
import { createTeamGoal, getTeamGoals, deleteTeamGoal, completeTeamGoal, uncompleteTeamGoal } from '../../services/teamService';

function ScrumPage() {
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  const location = useLocation();
  const { teamId: navigatedTeamId, teamName: navigatedTeamName } = location.state || {};

  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [currentTeamName, setCurrentTeamName] = useState(null);
  const [scrumGoals, setScrumGoals] = useState([]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const loadGoals = async () => {
    if (!currentTeamId) return;
    try {
      const response = await getTeamGoals(currentTeamId);
      setScrumGoals(response.data.goals);
    } catch (err) {
      console.error('목표 로딩 실패:', err);
    }
  };

  // 팀 정보 설정 useEffect
  useEffect(() => {
    const fetchAndSetDefaultTeam = async () => {
      if (navigatedTeamId && navigatedTeamName) {
        // 네비게이션을 통해 팀 정보가 전달된 경우 해당 팀을 사용
        setCurrentTeamId(navigatedTeamId);
        setCurrentTeamName(navigatedTeamName);
      } else {
        // 네비게이션 정보가 없는 경우, 사용자 팀 목록에서 첫 번째 팀을 기본값으로 설정
        try {
          const response = await getTeams();
          if (response.success && response.data.teams.length > 0) {
            const firstTeam = response.data.teams[0];
            setCurrentTeamId(firstTeam.id);
            setCurrentTeamName(firstTeam.name);
          } else {
            // 팀이 없는 경우
            setCurrentTeamId(null);
            setCurrentTeamName(null);
          }
        } catch (error) {
          console.error("팀 목록을 불러오는 데 실패했습니다:", error);
          setCurrentTeamId(null);
          setCurrentTeamName(null);
        }
      }
    };

    fetchAndSetDefaultTeam();
  }, [navigatedTeamId, navigatedTeamName]); // location.state가 변경될 때마다 실행

  // 스크럼 목표 설정 useEffect
  useEffect(() => {
    if (!currentTeamId) {
      // 팀이 선택되지 않은 경우 기본 목표 또는 빈 목록
      // setScrumGoals([
      //   {
      //     id: 1,
      //     text: '기본 스프린트 계획 수립',
      //     completed: false,
      //     startDate: '2025-01-01',
      //     endDate: '2025-01-07'
      //   },
      // ]);
    }
  }, [currentTeamId, currentTeamName]);

  useEffect(() => {
    loadGoals();
  }, [currentTeamId]);

const handleToggleGoal = async (goalId, currentCompleted) => {
  try {
    if (currentCompleted) {
      await uncompleteTeamGoal(goalId);
    } else {
      await completeTeamGoal(goalId);
    }
    await loadGoals();
  } catch (err) {
    console.error('체크박스 처리 실패:', err);
  }
};

const handleDeleteGoal = async (goalId) => {
  const confirmed = await showConfirm(
    '목표 삭제',
    '정말로 이 목표를 삭제하시겠습니까?',
    '삭제',
    '취소'
  );
  if (confirmed) {
    try {
      await deleteTeamGoal(goalId);
      await loadGoals(); // 최신 목록 다시 불러오기
      showAlert('삭제 완료', '목표가 삭제되었습니다.');
    } catch (err) {
      console.error('🔥 Failed to delete goal', err);
      showAlert('삭제 실패', '목표 삭제 중 오류가 발생했습니다.');
    }
  }
};

  const handleAddGoal = async () => {
    console.log('handleAddGoal called', { currentTeamId, newGoalInput, startDate, endDate });

    if (!newGoalInput.trim()) {
      showAlert('입력 오류', '목표 내용을 입력해주세요.');
      return;
    }
    if (!startDate || !endDate) {
      showAlert('입력 오류', '시작 날짜와 종료 날짜를 모두 선택해주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showAlert('입력 오류', '종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
      return;
    }
    if (!currentTeamId) {
      showAlert('팀 없음', '팀을 먼저 선택해주세요.');
      return;
    }

    try {
      console.log('👉 Now calling createTeamGoal API');
      await createTeamGoal(currentTeamId, {
        content: newGoalInput.trim(),
        startDate,
        plannedEndDate: endDate
      });
      await loadGoals(); // 최신 데이터 반영
      setNewGoalInput('');
      setStartDate(today);
      setEndDate(today);
      showAlert('목표 추가', '새로운 목표가 추가되었습니다.');
    } catch (err) {
      console.error('🔥 Failed to create goal', err);
    }
  };

  const handleCreateScrum = () => {
    showAlert('스크럼 생성', '새로운 스크럼이 생성되었습니다.');
  };

  return (
    <div className="todo-container">
      <TopMenu />
      <div className="todo-body">
        <Sidebar />
        <main className="todo-main">
          {/* 왼쪽 영역 (3:1 비율의 3) */}
          <div className="todo-left-section">
            {/* 시간표 영역 (상단 절반) */}
            <section className="todo-schedule-section">
              <div className="todo-schedule-title">시간표</div>
              <div className="todo-schedule-content">
                시간표 컴포넌트가 들어갈 공간입니다
              </div>
            </section>

            {/* 메모장 영역 (하단 절반) */}
            <section className="todo-memo-section">
              <div className="todo-memo-title">메모장</div>
              <div className="todo-memo-content">필요한거 알아낸거 궁금한거</div>
              <div className="todo-memo-btn-group">
                <button className="todo-memo-btn" onClick={handleCreateScrum}>스크럼 생성</button>
              </div>
            </section>
          </div>

          {/* 오른쪽 영역 (3:1 비율의 1) - 목표 추가 */}
          <aside className="todo-goal-aside">
            <div className="todo-date">
              {currentTeamName ? `${currentTeamName} 팀 스크럼` : '팀을 선택해주세요'}
            </div>
            <ul className="todo-goal-list">
              {scrumGoals.map((goal) => (
              <ScrumGoalItem
                key={goal.id}
                goal={goal}
                onToggle={() => handleToggleGoal(goal.id, goal.real_end_date !== null)}
                onDelete={handleDeleteGoal}
              />
              ))}
            </ul>
            <div className="todo-goal-input-group">
              <div className="date-input-container">
                <input 
                  type="date"
                  className="date-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!currentTeamId}
                />
                <span>~</span>
                <input 
                  type="date"
                  className="date-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!currentTeamId}
                />
              </div>
              <input 
                className="todo-goal-input"
                placeholder="목표 내용"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                disabled={!currentTeamId}
              />
              <button 
                className="todo-goal-btn" 
                onClick={handleAddGoal}
                disabled={!currentTeamId}
              >
                등록
              </button>
            </div>

          </aside>
        </main>
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
}

export default ScrumPage;