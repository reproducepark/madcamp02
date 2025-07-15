import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import '../../styles/TodoListPage.css';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import GoalSection from '../layout/GoalSection';
import Divider from '../layout/Divider';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';
import PersonalMemoSection from '../layout/PersonalMemoSection';
import { getTeams, getTeamGoals } from '../../services/teamService';
import { getPersonalMemos, createPersonalMemo, deleteMemo } from '../../services/memoService';
import { getSubGoals, createSubGoal, deleteSubGoal, completeSubGoal, uncompleteSubGoal } from '../../services/subgoalService';
import GanttChart from '../layout/GanttChart';
import * as Switch from '@radix-ui/react-switch';

function TodoListPage({ onLogout }) {
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [currentTeamName, setCurrentTeamName] = useState('');
  const [goals, setGoals] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL | COMPLETED | INCOMPLETE
  const [showAllPeriods, setShowAllPeriods] = useState(true);


  // 스크럼 페이지와 동일한 필터링 및 정렬 로직 적용
const filteredGoals = goals
  .map(goal => ({
    ...goal,
    todos: goal.todos.filter(todo => {
      if (filter === 'COMPLETED') return todo.is_completed;
      if (filter === 'INCOMPLETE') return !todo.is_completed;
      return true;
    })
  }))
  .sort((a, b) => {
    // 기존 정렬 유지
    if (filter === 'COMPLETED' || filter === 'INCOMPLETE') {
      if (a.start_date !== b.start_date) {
        return new Date(a.start_date) - new Date(b.start_date);
      }
      if (filter === 'COMPLETED') {
        return new Date(a.real_end_date || 0) - new Date(b.real_end_date || 0);
      } else {
        return new Date(a.planned_end_date || 0) - new Date(b.planned_end_date || 0);
      }
    } else {
      const aIsDone = a.todos.length > 0 && a.todos.every(todo => todo.is_completed);
      const bIsDone = b.todos.length > 0 && b.todos.every(todo => todo.is_completed);
      if (aIsDone !== bIsDone) return aIsDone ? 1 : -1;
      if (a.start_date !== b.start_date) {
        return new Date(a.start_date) - new Date(b.start_date);
      }
      if (!aIsDone) {
        return new Date(a.planned_end_date || 0) - new Date(b.planned_end_date || 0);
      } else {
        return new Date(a.real_end_date || 0) - new Date(b.real_end_date || 0);
      }
    }
  });

  const [activeGoalId, setActiveGoalId] = useState(null);
  const [newInput, setNewInput] = useState('');
  const [memos, setMemos] = useState([]);
  

  const activeGoalName = goals.find(goal => goal.id === activeGoalId)?.title;
  const inputGroupRef = useRef();
  const inputRef = useRef(); // ✅ 추가

  const location = useLocation();
  // ✅ 상태로 교체 (초기값만 location.state에서 받아오기)
  const [selectedUserId, setSelectedUserId] = useState(location.state?.userId ?? null);
  const [selectedUserName, setSelectedUserName] = useState(location.state?.userName ?? null);
  const isTeammateView = !!selectedUserId;  // userId가 있으면 무조건 보기 전용

  

  const token = localStorage.getItem('token');
  let currentUserId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentUserId = decoded.userId;  // JWT payload에서 userId 필드 사용
      console.log("🔍 currentUserId:", currentUserId);
    } catch (err) {
      console.error("JWT 디코드 실패:", err);
    }
  }
  const userId = selectedUserId ?? currentUserId;


   // ✅ activeGoalId 가 바뀔 때 input 에 자동 focus
  useEffect(() => {
    if (activeGoalId) {
      setNewInput(''); // ✅ 선택이 바뀔 때 입력창 초기화
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [activeGoalId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        e.target.closest('.goal-section') ||
        inputGroupRef.current?.contains(e.target)
      ) return;
      setActiveGoalId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ✅ 팀 불러오기
  useEffect(() => {
    const loadTeams = async () => {
      const res = await getTeams();
      if (res.success && res.data.teams.length > 0) {
        // localStorage에서 선택된 팀 정보 확인
        const savedTeam = localStorage.getItem('selectedTeam');
        if (savedTeam) {
          const selectedTeam = JSON.parse(savedTeam);
          // 선택된 팀이 여전히 유효한지 확인
          const isValidTeam = res.data.teams.find(team => team.id === selectedTeam.id);
          if (isValidTeam) {
            setCurrentTeamId(selectedTeam.id);
            setCurrentTeamName(selectedTeam.name);
            return;
          }
        }
        // 저장된 팀이 없거나 유효하지 않으면 첫 번째 팀 선택
        setCurrentTeamId(res.data.teams[0].id);
        setCurrentTeamName(res.data.teams[0].name);
        // localStorage에 첫 번째 팀 정보 저장
        localStorage.setItem('selectedTeam', JSON.stringify({
          id: res.data.teams[0].id,
          name: res.data.teams[0].name
        }));
      }
    };
    loadTeams();
  }, []);

  // 팀 변경 이벤트 감지
  useEffect(() => {
    const handleTeamChange = (event) => {
      const { teamId, teamName } = event.detail;
      setCurrentTeamId(teamId);
      setCurrentTeamName(teamName);

      // ✅ 팀을 변경하면 선택된 유저 초기화 (내 투두 보기)
      setSelectedUserId(null);
      setSelectedUserName(null);
      setShowAllPeriods(false)
    };

    window.addEventListener('teamChanged', handleTeamChange);
    return () => window.removeEventListener('teamChanged', handleTeamChange);
  }, []);

  // location.state가 바뀔 때마다 상태 갱신
  useEffect(() => {
    setSelectedUserId(location.state?.userId ?? null);
    setSelectedUserName(location.state?.userName ?? null);
    setShowAllPeriods(true)
  }, [location.state]);

  // ✅ 팀 목표 + SubGoal 불러오기
  const loadTeamGoals = async () => {
    if (!currentTeamId) return;
      const userId = selectedUserId ?? currentUserId; // 🏹 내꺼 or 팀원꺼
      console.log("📌 getSubGoals에 userId 넘김:", userId);
      
      const res = await getTeamGoals(currentTeamId);

    if (res.success) {
      const goalsWithSubGoals = await Promise.all(res.data.goals.map(async goal => {
        const subRes = await getSubGoals(goal.id, userId); // 🔥 userId 넘김
        return {
          id: goal.id,
          title: goal.content,
          start_date: goal.start_date,
          planned_end_date: goal.planned_end_date,
          real_end_date: goal.real_end_date,
          todos: subRes.success ? subRes.data.subgoals.map(sg => ({
            id: sg.id,
            text: sg.content,
            is_completed: sg.is_completed,
            disabled: false
          })) : []
        };
      }));
      setGoals(goalsWithSubGoals);
    }
  };

  useEffect(() => {
    loadTeamGoals();
  }, [currentTeamId, selectedUserId]);

  // 🗒️ 개인 메모 불러오기
  useEffect(() => {
    const loadMemos = async () => {
      if (!currentTeamId) return;
      const userId = selectedUserId ?? currentUserId;
      const res = await getPersonalMemos(currentTeamId, userId);
      // if (res.success) 
      setMemos(res.memos ?? res.data?.memos ?? []);
    };
    loadMemos();
  }, [currentTeamId, selectedUserId]);


  // ✅ 등록
  const handleAdd = async () => {
    if (!newInput.trim()) {
      showAlert('입력 오류', '내용을 입력해주세요.');
      return;
    }

    if (activeGoalId === 'memo') {
      await createPersonalMemo(newInput.trim(), currentTeamId);
      const res = await getPersonalMemos(currentTeamId, userId);
      setMemos(res.memos ?? res.data?.memos ?? []);
    } else {
      await createSubGoal(activeGoalId, { content: newInput.trim() });
      await loadTeamGoals();
    }

    setNewInput('');
    setActiveGoalId(null);
  };

  // ✅ 토글
  const handleToggleTodo = async (goalId, todoId, is_completed) => {
    try {
      if (is_completed) {
        await uncompleteSubGoal(todoId);
      } else {
        await completeSubGoal(todoId);
      }
      await loadTeamGoals();
    } catch (err) {
      console.error('체크박스 토글 실패:', err);
      showAlert('에러', '완료 상태 변경 실패');
    }
  };

  // ✅ 삭제
  const handleDeleteTodo = async (goalId, todoId) => {
    const confirmed = await showConfirm('할일 삭제', '정말로 삭제할까요?', '삭제', '취소');
    if (confirmed) {
      await deleteSubGoal(todoId);
      await loadTeamGoals();
    }
  };

  // duration 하드코딩
  const durations = [
    { start: '2025-07-03', end: '2025-07-09' },
    { start: '2025-07-10', end: '2025-07-16' },
    { start: '2025-07-17', end: '2025-07-23' },
    { start: '2025-07-24', end: '2025-07-31' }, // 마지막 주차는 8일
  ];

  // 첫 번째 목표의 start_date가 속하는 duration의 시작일을 baseDate로 사용
  let defaultBaseDate = durations[0].start;
  if (goals.length > 0 && goals[0].start_date) {
    const firstGoalDate = goals[0].start_date.slice(0, 10);
    const found = durations.find(d => firstGoalDate >= d.start && firstGoalDate <= d.end);
    if (found) defaultBaseDate = found.start;
  }

  // 슬라이더 상태
  const [sliderDate, setSliderDate] = useState(defaultBaseDate);

  // 전체 기간 보기 버튼 기능 on/off
  const goalsToShow = showAllPeriods
    ? filteredGoals
    : filteredGoals.filter(goal => {
        const start = goal.start_date?.slice(0, 10);
        const end = (goal.real_end_date || goal.planned_end_date)?.slice(0, 10);
        return start && end && sliderDate >= start && sliderDate <= end;
      });

  // baseDate가 바뀌면 sliderDate도 동기화
  useEffect(() => {
    setSliderDate(defaultBaseDate);
  }, [defaultBaseDate]);

  // 현재 duration 구간 찾기
  const currentDuration = durations.find(d => sliderDate >= d.start && sliderDate <= d.end) || durations[0];
  // duration 내 날짜 배열 생성
  const getDateArray = (start, end) => {
    const arr = [];
    let d = new Date(start);
    const endDate = new Date(end);
    while (d <= endDate) {
      arr.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return arr;
  };
  const dateArray = getDateArray(currentDuration.start, currentDuration.end);

  // baseDate가 duration 범위 밖이면 슬라이더를 duration 시작일로 맞춤
  useEffect(() => {
    if (sliderDate < currentDuration.start || sliderDate > currentDuration.end) {
      setSliderDate(currentDuration.start);
    }
    // eslint-disable-next-line
  }, [currentDuration.start, currentDuration.end]);

  // 내 userId 가져오기
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const myUserId = userInfo?.id;

  return (
    <div className="todo-container">
      <TopMenu onLogout={onLogout} />
      <div className="todo-body">
        <Sidebar />
        <main className="todo-main">
          <div className="todo-left-section">

            <section className="todo-schedule-section">
              <div className="todo-schedule-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div className="todo-schedule-title">
                  개인 목표 일정
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Switch.Root
                    checked={showAllPeriods}
                    onCheckedChange={setShowAllPeriods}
                    className="switch-root"
                    style={{ backgroundColor: showAllPeriods ? '#4caf50' : '#ccc' }}
                  >
                    <Switch.Thumb
                      className="switch-thumb"
                      style={{
                        transform: showAllPeriods ? 'translateX(18px)' : 'translateX(2px)'
                      }}
                    />
                  </Switch.Root>
                  <span style={{ fontSize: '0.9rem', color: '#555' }}>전체 기간 보기</span>
                </div>
              </div>

              {!showAllPeriods && (
                <div className="gantt-slider-wrapper">
                  <input
                    type="range"
                    min={0}
                    max={dateArray.length - 1}
                    value={dateArray.findIndex(d => d === sliderDate)}
                    onChange={e => setSliderDate(dateArray[parseInt(e.target.value)])}
                    step={1}
                    className="gantt-slider"
                  />
                </div>
              )}

              <div className="todo-schedule-content">
                <div className="gantt-chart">
                  <GanttChart
                    goals={goals.map(goal => {
                      const myTodos = goal.todos;
                      const completed = myTodos.filter(todo => todo.is_completed).length;
                      const progress = myTodos.length === 0 ? 0 : completed / myTodos.length;
                      return {
                        ...goal,
                        content: goal.title,
                        progress
                      };
                    })}
                    baseDate={defaultBaseDate}
                  />
                </div>
              </div>
            </section>

          </div>
          {/* 오른쪽 영역 (3:1 비율의 1) - 목표 추가 */}
          <aside className="todo-goal-aside">
            <div className="todo-date">
              {selectedUserName 
                ? `${selectedUserName}님의 투두`
                : currentTeamName 
                  ? `${currentTeamName} 팀`
                  : '팀을 선택해주세요'}
            </div>

            <div className="goal-filter-buttons">
              <button 
                className={`filter-btn ${filter === 'INCOMPLETE' ? 'active' : ''}`}
                onClick={() => setFilter('INCOMPLETE')}
              >
                <img src="/assets/icons/checkbox/blank-check-box.png" alt="미완" style={{ width: '20px', height: '20px' }} />
              </button>
              <button 
                className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => setFilter('COMPLETED')}
              >
                <img src="/assets/icons/checkbox/check-box.png" alt="완료" style={{ width: '20px', height: '20px' }} />
              </button>
              <button 
                className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                <img src="/assets/icons/checkbox/blank-check-box.png" alt="미완" style={{ width: '20px', height: '20px' }} />
                  <span style={{
                    color: '#000',         // 검은색
                    fontSize: '14px',      // 조금 더 작게
                    margin: '0 4px'        // 좌우 여백
                  }}>
                    &
                  </span>
                <img src="/assets/icons/checkbox/check-box.png" alt="완료" style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <Divider />

            <div className="todo-content">

              {goalsToShow.map((goal, index) => (
                <React.Fragment key={goal.id}>
                  <GoalSection
                    goalId={goal.id}
                    title={goal.title}
                    todos={goal.todos.map(todo => ({
                      ...todo,
                      onToggle: () => handleToggleTodo(goal.id, todo.id, todo.is_completed)
                    }))}
                    onActivate={setActiveGoalId}
                    onDeleteTodo={(todoId) => handleDeleteTodo(goal.id, todoId)}
                  />
                  {index < goalsToShow.length - 1 && <Divider />}
                </React.Fragment>
              ))}

              <Divider />
              <PersonalMemoSection
                memos={memos}
                onActivate={() => setActiveGoalId('memo')}
                onDeleteMemo={async (memoId) => {
                  await deleteMemo(memoId);
                  const res = await getPersonalMemos(currentTeamId, userId);
                  setMemos(res.memos ?? res.data?.memos ?? []);
                }}
              />
            </div>

            <div className="todo-goal-input-group" ref={inputGroupRef}>
              <input
                ref={inputRef}  // ✅ focus 대상
                className="todo-goal-input"  // 🟢 ScrumPage 와 같은 class
                placeholder={
                  activeGoalId === 'memo'
                    ? "개인 메모를 작성하세요"
                    : activeGoalId
                      ? `${activeGoalName}에 할 일을 추가합니다`
                      : "목표를 선택해 주세요."
                }
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                disabled={!activeGoalId || isTeammateView}  // 🔥 여기!
              />
              <button
                className="todo-goal-btn"  // 🟢 ScrumPage 와 같은 class
                onClick={handleAdd}
                disabled={!activeGoalId || isTeammateView}  // 🔥 여기!
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

export default TodoListPage;