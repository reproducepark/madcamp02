import React, { useState } from 'react';
import '../../styles/TodoListPage.css'; // 새로 생성할 CSS 파일을 import 합니다.
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import GoalSection from '../layout/GoalSection';
import Divider from '../layout/Divider';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';

function TodoListPage() {
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  
  // 더미 데이터 - 목표들
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: '프로젝트 계획',
      todos: [
        { id: 1, text: '요구사항 분석', completed: false, disabled: false },
        { id: 2, text: '기술 스택 선정', completed: true, disabled: false },
        { id: 3, text: '팀 구성', completed: false, disabled: false },
        { id: 4, text: '일정 수립', completed: false, disabled: false },
        { id: 5, text: '예산 계획', completed: false, disabled: false }
      ]
    },
    {
      id: 2,
      title: '개발 작업',
      todos: [
        { id: 6, text: '데이터베이스 설계', completed: true, disabled: false },
        { id: 7, text: 'API 개발', completed: false, disabled: false },
        { id: 8, text: '프론트엔드 개발', completed: false, disabled: false },
        { id: 9, text: '테스트 코드 작성', completed: false, disabled: false }
      ]
    },
    {
      id: 3,
      title: '디자인 작업',
      todos: [
        { id: 10, text: 'UI/UX 디자인', completed: false, disabled: false },
        { id: 11, text: '프로토타입 제작', completed: false, disabled: false },
        { id: 12, text: '디자인 시스템 구축', completed: false, disabled: false }
      ]
    },
    {
      id: 4,
      title: '배포 준비',
      todos: [
        { id: 13, text: '서버 환경 구성', completed: false, disabled: false },
        { id: 14, text: 'CI/CD 파이프라인 구축', completed: false, disabled: false },
        { id: 15, text: '모니터링 시스템 구축', completed: false, disabled: false },
        { id: 16, text: '백업 시스템 구축', completed: false, disabled: false }
      ]
    }
  ]);

  const handleAddTodo = (goalId) => {
    console.log(`목표 ${goalId}에 할일 추가`);
    // 실제 구현에서는 새로운 할일을 해당 목표에 추가
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

  const renderGoalSection = (goal) => {
    return (
      <GoalSection 
        key={goal.id}
        title={goal.title}
        todos={goal.todos.map(todo => ({
          ...todo,
          onToggle: (todoId) => handleToggleTodo(goal.id, todoId)
        }))}
        onAddTodo={() => handleAddTodo(goal.id)}
        onDeleteTodo={(todoId) => handleDeleteTodo(goal.id, todoId)}
      />
    );
  };

  return (
    <div className="app-wrapper">
      {/* 상단 메뉴 */}
      <TopMenu />
            <div className="container">
        {/* 사이드바 */}
        <Sidebar />
      {/* 본문 */}
      <main className="main-content">
        {/* 중앙 컴포넌트 */}
        <div className="todo-center-card">
          <div className="todo-center-title">중앙 영역</div>
          <div className="todo-center-content">
            중앙에 들어갈 컴포넌트입니다
          </div>
        </div>
        
        <div className="todo-card">
          {/* 날짜 */}
          <div className="todo-date">2025. 1. 1.</div>
          <Divider />
          {/* 스크롤 가능한 콘텐츠 영역 */}
          <div className="todo-content">
            {/* 목표들 자동 렌더링 */}
            {goals.map((goal, index) => (
              <React.Fragment key={goal.id}>
                {renderGoalSection(goal)}
                {index < goals.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </div>
          {/* 하단 고정 영역 */}
          <div className="todo-footer">
            <div className="memo">메모</div>
            <div className="button-group">
              <button className="action-button">할일 추가</button>
              <button className="action-button">등록</button>
            </div>
          </div>
        </div>
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