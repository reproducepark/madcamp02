import React, { useState } from 'react';
import '../../styles/TodoListPage.css'; // 스타일은 기존 투두리스트와 공유
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import GoalSection from '../layout/GoalSection';
import Divider from '../layout/Divider';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';

function TeammateTodoListPage({ onLogout }) { // 컴포넌트 이름 변경
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  
  // 더미 데이터 - 실제로는 선택된 팀원의 데이터를 불러와야 함
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: '팀원 A의 프로젝트 계획', // 예시 데이터
      todos: [
        { id: 1, text: '요구사항 분석', completed: true, disabled: true },
        { id: 2, text: '기술 스택 선정', completed: true, disabled: true },
        { id: 3, text: '팀 구성', completed: false, disabled: true },
        { id: 4, text: '일정 수립', completed: false, disabled: true },
        { id: 5, text: '예산 계획', completed: false, disabled: true }
      ]
    },
    {
      id: 2,
      title: '팀원 A의 개발 작업',
      todos: [
        { id: 6, text: '데이터베이스 설계', completed: true, disabled: true },
        { id: 7, text: 'API 개발', completed: true, disabled: true },
        { id: 8, text: '프론트엔드 개발', completed: false, disabled: true },
        { id: 9, text: '테스트 코드 작성', completed: false, disabled: true }
      ]
    }
  ]);

  // 팀원 페이지에서는 수정/삭제/추가 기능이 비활성화되어야 하므로 핸들러는 비워두거나 제거
  const handleAddTodo = (goalId) => {
    console.log('팀원 페이지에서는 추가할 수 없습니다.');
  };

  const handleToggleTodo = (goalId, todoId) => {
    console.log('팀원 페이지에서는 토글할 수 없습니다.');
  };

  const handleDeleteTodo = async (goalId, todoId) => {
    console.log('팀원 페이지에서는 삭제할 수 없습니다.');
  };

  const renderGoalSection = (goal) => {
    return (
      <GoalSection 
        key={goal.id}
        title={goal.title}
        todos={goal.todos.map(todo => ({
          ...todo,
          onToggle: () => {},
        }))}
        onAddTodo={() => {}}
        onDeleteTodo={() => {}}
        isTeammateView={true} // 보기 전용임을 나타내는 prop 전달
      />
    );
  };

  return (
    <div className="app-wrapper">
      <TopMenu onLogout={onLogout} />
      <div className="container">
        <Sidebar />
        <main className="main-content">
          <div className="todo-center-card">
            <div className="todo-center-title">팀원 Todo 리스트</div>
            <div className="todo-center-content">
              {/* 여기에 팀원 선택 드롭다운 등을 추가할 수 있습니다. */}
              팀원 A의 할 일 목록입니다.
            </div>
          </div>
          
          <div className="todo-card">
            <div className="todo-date">2025. 1. 1.</div>
            <Divider />
            <div className="todo-content">
              {goals.map((goal, index) => (
                <React.Fragment key={goal.id}>
                  {renderGoalSection(goal)}
                  {index < goals.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </div>
            <div className="todo-footer">
              <div className="memo">팀원 보기 모드</div>
              <div className="button-group">
                {/* 보기 모드에서는 버튼 비활성화 */}
              </div>
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

export default TeammateTodoListPage;