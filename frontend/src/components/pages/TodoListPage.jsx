import React, { useState, useEffect, useRef } from 'react';
import '../../styles/TodoListPage.css';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import GoalSection from '../layout/GoalSection';
import Divider from '../layout/Divider';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';
import PersonalMemoSection from '../layout/PersonalMemoSection';
import { getMemos, createMemo, deleteMemo } from '../../services/memoService';

function TodoListPage() {
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: '프로젝트 계획',
      todos: [
        { id: 1, text: '요구사항 분석', completed: false, disabled: false },
        { id: 2, text: '기술 스택 선정', completed: true, disabled: false }
      ]
    },
    {
      id: 2,
      title: '개발 작업',
      todos: [
        { id: 3, text: '데이터베이스 설계', completed: true, disabled: false },
        { id: 4, text: 'API 개발', completed: false, disabled: false }
      ]
    }
  ]);

  const [activeGoalId, setActiveGoalId] = useState(null);
  const activeGoalName = goals.find(goal => goal.id === activeGoalId)?.title;

  const [newTodoText, setNewTodoText] = useState('');
  const [memos, setMemos] = useState([]);
  const [newInput, setNewInput] = useState('');

  // ✅ 입력창 wrapper ref
  const inputGroupRef = useRef();

  // ✅ 페이지 다른 곳 클릭하면 비활성화
  useEffect(() => {
    const handleClickOutside = (e) => {
      console.log('클릭한 요소:', e.target);

      if (
        e.target.closest('.goal-section') ||
        inputGroupRef.current?.contains(e.target)
      ) {
        console.log('✅ 내부 클릭 - 유지');
        return;
      }

      console.log('🛑 외부 클릭 - 비활성화');
      setActiveGoalId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 🗒️ 개인 메모 불러오기
  useEffect(() => {
    const loadMemos = async () => {
      const res = await getMemos();
      if (res.success) setMemos(res.data.memos);
    }
    loadMemos();
  }, []);

  const handleActivateGoal = (goalId) => {
    setActiveGoalId(goalId);
  };

  const handleAddTodo = async () => {
    if (!newInput.trim()) {
      showAlert('입력 오류', '내용을 입력해주세요.');
      return;
    }

    if (activeGoalId === 'memo') {
      await createMemo(newInput.trim());
      setNewInput('');
      setActiveGoalId(null);
      const res = await getMemos();
      setMemos(res.data.memos);
    } else {
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === activeGoalId
            ? {
                ...goal,
                todos: [
                  ...goal.todos,
                  {
                    id: Date.now(),
                    text: newInput.trim(),
                    completed: false,
                    disabled: false
                  }
                ]
              }
            : goal
        )
      );
      setNewInput('');
      setActiveGoalId(null);
    }
  };

  const handleToggleTodo = (goalId, todoId) => {
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              todos: goal.todos.map(todo =>
                todo.id === todoId
                  ? { ...todo, completed: !todo.completed }
                  : todo
              )
            }
          : goal
      )
    );
  };

  const handleDeleteTodo = async (goalId, todoId) => {
    const confirmed = await showConfirm(
      '할일 삭제',
      '정말로 이 할일을 삭제하시겠습니까?',
      '삭제',
      '취소'
    );
    if (confirmed) {
      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId
            ? {
                ...goal,
                todos: goal.todos.filter(todo => todo.id !== todoId)
              }
            : goal
        )
      );
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
            <div className="todo-center-content">
              중앙에 들어갈 컴포넌트입니다
            </div>
          </div>

          <div className="todo-card">
            <div className="todo-date">2025. 1. 1.</div>
            <Divider />

            <div className="todo-content">
              {goals.map((goal, index) => (
                <React.Fragment key={goal.id}>
                  <GoalSection
                    goalId={goal.id}
                    title={goal.title}
                    todos={goal.todos.map(todo => ({
                      ...todo,
                      onToggle: (todoId) => handleToggleTodo(goal.id, todoId)
                    }))}
                    onActivate={handleActivateGoal}
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
                  const res = await getMemos();
                  setMemos(res.data.memos);
                }}
              />
            </div>

            {/* ✅ 항상 존재하되, 활성화된 목표일 때만 활성화 */}
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
                onClick={handleAddTodo}
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
