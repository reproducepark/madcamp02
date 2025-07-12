import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import ScrumGoalItem from '../layout/ScrumGoalItem';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';
import '../../styles/ScrumPage.css';

function ScrumPage() {
  const { modalState, showAlert, showConfirm, closeModal } = useModal();
  
  // 더미 데이터 - 스크럼 목표들
  const [scrumGoals, setScrumGoals] = useState([
    {
      id: 1,
      text: '스프린트 계획 수립',
      completed: false,
      startDate: '2025-01-01',
      endDate: '2025-01-07'
    },
    {
      id: 2,
      text: '데일리 스크럼 진행',
      completed: true,
      startDate: '2025-01-01',
      endDate: '2025-01-15'
    },
    {
      id: 3,
      text: '스프린트 리뷰 준비',
      completed: false,
      startDate: '2025-01-08',
      endDate: '2025-01-14'
    },
    {
      id: 4,
      text: '레트로스펙티브 진행',
      completed: false,
      startDate: '2025-01-15',
      endDate: '2025-01-15'
    }
  ]);

  const [newGoalInput, setNewGoalInput] = useState('');

  const handleToggleGoal = (goalId) => {
    setScrumGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === goalId 
          ? { ...goal, completed: !goal.completed }
          : goal
      )
    );
  };

  const handleDeleteGoal = async (goalId) => {
    const confirmed = await showConfirm(
      '목표 삭제',
      '정말로 이 목표를 삭제하시겠습니까?',
      '삭제',
      '취소'
    );
    
    if (confirmed) {
      setScrumGoals(prevGoals => 
        prevGoals.filter(goal => goal.id !== goalId)
      );
    }
  };

  const handleAddGoal = () => {
    if (newGoalInput.trim()) {
      const newGoal = {
        id: Date.now(),
        text: newGoalInput.trim(),
        completed: false,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
      
      setScrumGoals(prevGoals => [...prevGoals, newGoal]);
      setNewGoalInput('');
      showAlert('목표 추가', '새로운 목표가 추가되었습니다.');
    } else {
      showAlert('입력 오류', '목표 내용을 입력해주세요.');
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
            <div className="todo-date">2025. 1. 1.</div>
            <ul className="todo-goal-list">
              {scrumGoals.map((goal) => (
                <ScrumGoalItem
                  key={goal.id}
                  goal={goal}
                  onToggle={handleToggleGoal}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </ul>
            <div className="todo-goal-input-group">
              <input 
                className="todo-goal-input" 
                placeholder="목표 내용, 시작날짜 종료날짜"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <button className="todo-goal-btn" onClick={handleAddGoal}>등록</button>
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