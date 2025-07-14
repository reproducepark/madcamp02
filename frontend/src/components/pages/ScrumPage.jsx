import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import ScrumGoalItem from '../layout/ScrumGoalItem';
import TeamMemoSection from '../layout/TeamMemoSection';
import ScrumGanttChart from '../layout/ScrumGanttChart';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';
import { getTeams } from '../../services'; // getTeams import
import '../../styles/ScrumPage.css';
import { createTeamGoal, getTeamGoals, deleteTeamGoal, completeTeamGoal, uncompleteTeamGoal } from '../../services/teamService';


function ScrumPage({ onLogout }) {
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  const location = useLocation();
  const { teamId: navigatedTeamId, teamName: navigatedTeamName } = location.state || {};

  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [currentTeamName, setCurrentTeamName] = useState(null);
  const [scrumGoals, setScrumGoals] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL | COMPLETED | INCOMPLETE
  const filteredGoals = scrumGoals
    .filter(goal => {
      if (filter === 'COMPLETED') return goal.real_end_date !== null;
      if (filter === 'INCOMPLETE') return goal.real_end_date === null;
      return true; // ALL
    })
    .sort((a, b) => {
      if (filter === 'COMPLETED' || filter === 'INCOMPLETE') {
        // 단일 필터인 경우
        if (a.start_date !== b.start_date) {
          return new Date(a.start_date) - new Date(b.start_date);
        }
        if (filter === 'COMPLETED') {
          return new Date(a.real_end_date || 0) - new Date(b.real_end_date || 0);
        } else {
          return new Date(a.planned_end_date || 0) - new Date(b.planned_end_date || 0);
        }
      } else {
        // ALL인 경우, 미완 -> 완료
        const aIsDone = a.real_end_date !== null;
        const bIsDone = b.real_end_date !== null;
        if (aIsDone !== bIsDone) return aIsDone ? 1 : -1;

        // 같은 상태라면 start_date
        if (a.start_date !== b.start_date) {
          return new Date(a.start_date) - new Date(b.start_date);
        }

        if (!aIsDone) {
          // 미완 : planned_end_date 빠른 게 먼저
          return new Date(a.planned_end_date || 0) - new Date(b.planned_end_date || 0);
        } else {
          // 완료 : real_end_date 빠른 게 먼저
          return new Date(a.real_end_date || 0) - new Date(b.real_end_date || 0);
        }
      }
    });


  const [newGoalInput, setNewGoalInput] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  // 간트 차트용 상태
  const [ganttBaseDate, setGanttBaseDate] = useState(today);
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
      try {
        const response = await getTeams();
        if (response.success && response.data.teams.length > 0) {
          // localStorage에서 선택된 팀 정보 확인
          const savedTeam = localStorage.getItem('selectedTeam');
          let selectedTeam = null;

          if (savedTeam) {
            const parsedTeam = JSON.parse(savedTeam);
            // 선택된 팀이 여전히 유효한지 확인
            const isValidTeam = response.data.teams.find(team => team.id === parsedTeam.id);
            if (isValidTeam) {
              selectedTeam = parsedTeam;
            }
          }

          // 네비게이션을 통해 팀 정보가 전달된 경우 해당 팀을 우선 사용
          if (navigatedTeamId && navigatedTeamName) {
            setCurrentTeamId(navigatedTeamId);
            setCurrentTeamName(navigatedTeamName);
            // localStorage에 네비게이션 팀 정보 저장
            localStorage.setItem('selectedTeam', JSON.stringify({
              id: navigatedTeamId,
              name: navigatedTeamName
            }));
          } else if (selectedTeam) {
            // localStorage에 저장된 팀 정보 사용
            setCurrentTeamId(selectedTeam.id);
            setCurrentTeamName(selectedTeam.name);
          } else {
            // 저장된 팀이 없거나 유효하지 않으면 첫 번째 팀 선택
            const firstTeam = response.data.teams[0];
            setCurrentTeamId(firstTeam.id);
            setCurrentTeamName(firstTeam.name);
            // localStorage에 첫 번째 팀 정보 저장
            localStorage.setItem('selectedTeam', JSON.stringify({
              id: firstTeam.id,
              name: firstTeam.name
            }));
          }
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

  // 간트 차트 baseDate 업데이트
  useEffect(() => {
    if (scrumGoals.length > 0) {
      // 가장 빠른 시작 날짜를 baseDate로 설정
      const earliestStart = scrumGoals.reduce((earliest, goal) => {
        const startDate = goal.start_date;
        if (!startDate) return earliest;
        return startDate < earliest ? startDate : earliest;
      }, scrumGoals[0].start_date || today);
      
      setGanttBaseDate(earliestStart);
    }
  }, [scrumGoals, today]);

  // 팀 변경 이벤트 감지
  useEffect(() => {
    const handleTeamChange = (event) => {
      const { teamId, teamName } = event.detail;
      setCurrentTeamId(teamId);
      setCurrentTeamName(teamName);
    };

    window.addEventListener('teamChanged', handleTeamChange);
    return () => window.removeEventListener('teamChanged', handleTeamChange);
  }, []);

const handleToggleGoal = async (goalId, currentCompleted, goalContent) => {
  try {
    if (currentCompleted) {
      const confirmed = await showConfirm(
        '완료 취소',
        `"${goalContent}" 완료 해제 시 하위 목표들의 진행상태도 초기화됩니다.\n정말 진행할까요?`,
        '확인',
        '취소'
      );
      if (!confirmed) return;
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



  return (
    <div className="todo-container">
      <TopMenu onLogout={onLogout} />
      <div className="todo-body">
        <Sidebar />
        <main className="todo-main">
          {/* 왼쪽 영역 (3:1 비율의 3) */}
          <div className="todo-left-section">
            {/* 간트 차트 영역 (상단 절반) */}
            <section className="todo-schedule-section">
              <div className="todo-schedule-title">팀 목표 일정</div>
              <div className="todo-schedule-content">
                <ScrumGanttChart 
                  goals={scrumGoals}
                  baseDate={ganttBaseDate}
                />
              </div>
            </section>

            {/* 메모장 영역 (하단 절반) */}
            <TeamMemoSection 
              teamId={currentTeamId} 
              teamName={currentTeamName} 
            />
          </div>

          {/* 오른쪽 영역 (3:1 비율의 1) - 목표 추가 */}
          <aside className="todo-goal-aside">
            <div className="todo-date">
              {currentTeamName ? `${currentTeamName} 팀 스크럼` : '팀을 선택해주세요'}
            </div>
            <div className="goal-filter-buttons">
              <button 
                className={`filter-btn ${filter === 'INCOMPLETE' ? 'active' : ''}`}
                onClick={() => setFilter('INCOMPLETE')}
              >
                미완
              </button>
              <button 
                className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setFilter('COMPLETED')}
              >
                완료
              </button>
              <button 
                className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                모두
              </button>
            </div>

            <ul className="todo-goal-list">
              {filteredGoals.map((goal) => (
                <ScrumGoalItem
                  key={goal.id}
                  goal={goal}
                  onToggle={() => handleToggleGoal(goal.id, goal.real_end_date !== null, goal.content)}
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