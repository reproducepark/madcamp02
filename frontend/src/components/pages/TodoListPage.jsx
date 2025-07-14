import React, { useState, useEffect, useRef } from 'react';
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

function TodoListPage() {
  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [currentTeamName, setCurrentTeamName] = useState('');
  const [goals, setGoals] = useState([]);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [newInput, setNewInput] = useState('');
  const [memos, setMemos] = useState([]);

  const activeGoalName = goals.find(goal => goal.id === activeGoalId)?.title;
  const inputGroupRef = useRef();

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
    };

    window.addEventListener('teamChanged', handleTeamChange);
    return () => window.removeEventListener('teamChanged', handleTeamChange);
  }, []);

  // ✅ 팀 목표 + SubGoal 불러오기
  const loadTeamGoals = async () => {
    if (!currentTeamId) return;
    const res = await getTeamGoals(currentTeamId);
    if (res.success) {
      const goalsWithSubGoals = await Promise.all(res.data.goals.map(async goal => {
        const subRes = await getSubGoals(goal.id);
        return {
          id: goal.id,
          title: goal.content,
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
  }, [currentTeamId]);

  // 🗒️ 개인 메모 불러오기
  useEffect(() => {
    const loadMemos = async () => {
      if (!currentTeamId) return;
      const res = await getPersonalMemos(currentTeamId);
      if (res.success) setMemos(res.data.memos);
    };
    loadMemos();
  }, [currentTeamId]);

  // ✅ 등록
  const handleAdd = async () => {
    if (!newInput.trim()) {
      showAlert('입력 오류', '내용을 입력해주세요.');
      return;
    }

    if (activeGoalId === 'memo') {
      await createPersonalMemo(newInput.trim(), currentTeamId);
      const res = await getPersonalMemos(currentTeamId);
      setMemos(res.data.memos);
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

  return (
    <div className="app-wrapper">
      <TopMenu />
      <div className="container">
        <Sidebar />
        <main className="main-content">
          <div className="todo-center-card">
            <div className="todo-center-title">중앙 영역</div>
          </div>

          <div className="todo-card">
            <div className="todo-date">
              {currentTeamName ? `${currentTeamName} 팀` : '팀을 선택해주세요'}
            </div>
            <Divider />

            <div className="todo-content">
              {goals.map((goal, index) => (
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
                  {index < goals.length - 1 && <Divider />}
                </React.Fragment>
              ))}

              <Divider />
              <PersonalMemoSection
                memos={memos}
                onActivate={() => setActiveGoalId('memo')}
                onDeleteMemo={async (memoId) => {
                  await deleteMemo(memoId);
                  const res = await getPersonalMemos(currentTeamId);
                  setMemos(res.data.memos);
                }}
              />
            </div>

            <div className="todo-goal-input-group" ref={inputGroupRef}>
              <input
                placeholder={
                  activeGoalId === 'memo'
                    ? "개인 메모를 작성하세요"
                    : activeGoalId
                      ? `${activeGoalName}에 할 일을 추가합니다`
                      : "목표를 선택해 주세요."
                }
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                disabled={!activeGoalId}
              />
              <button
                className="todo-goal-btn"
                onClick={handleAdd}
                disabled={!activeGoalId}
              >
                등록
              </button>
            </div>
          </div>
        </main>
      </div>

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
