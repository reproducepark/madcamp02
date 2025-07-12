import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logoutUser, getTeams } from '../../services';
import { useTeamModal } from '../../hooks/useTeamModal';
import TeamCreateModal from '../Modal/TeamCreateModal';
import TeamManageModal from '../Modal/TeamManageModal';
import './TopMenu.css';

function TopMenu() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTeammateDropdown, setShowTeammateDropdown] = useState(false);
  const [teams, setTeams] = useState([
    { id: 'team1', name: '하드코딩팀 A', members: [{ id: 'user1', name: '사용자1' }, { id: 'user2', name: '사용자2' }] },
    { id: 'team2', name: '하드코딩팀 B', members: [{ id: 'user3', name: '사용자3' }] },
  ]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useTeamModal();
  const { isOpen: isManageModalOpen, openModal: openManageModal, closeModal: closeManageModal } = useTeamModal();

  const navigate = useNavigate();
  const location = useLocation();

  const isScrumPage = location.pathname.startsWith('/scrum');
  const isTeamViewPage = location.pathname === '/scrum/teammate-todolist';

  // fetchTeams 함수와 useEffect 훅은 하드코딩을 위해 주석 처리합니다.
  // const fetchTeams = async () => {
  //   try {
  //     const response = await getTeams();
  //     if (response.success) {
  //       setTeams(response.data);
  //     } else {
  //       console.error('Failed to fetch teams:', response.message);
  //       setTeams([]);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching teams:', error);
  //     setTeams([]);
  //   }
  // };

  // useEffect(() => {
  //   if (isDropdownOpen) {
  //     fetchTeams();
  //   }
  // }, [isDropdownOpen]);

  const handleLogout = () => {
    logoutUser();
  };

  // 하드코딩된 데이터에서는 팀 생성/업데이트/삭제 시 목록 새로고침이 필요 없으므로 주석 처리합니다.
  const handleTeamCreated = () => {
    // fetchTeams(); // 팀 생성 후 목록 새로고침
    alert('팀 생성 로직 (하드코딩): 실제 API 호출 필요');
    closeCreateModal();
  };

  const handleTeamUpdated = () => {
    // fetchTeams(); // 팀 업데이트 후 목록 새로고침
    alert('팀 업데이트 로직 (하드코딩): 실제 API 호출 필요');
  };

  const handleTeamDeleted = () => {
    // fetchTeams(); // 팀 삭제 후 목록 새로고침
    alert('팀 삭제 로직 (하드코딩): 실제 API 호출 필요');
    setSelectedTeam(null);
  };

  // 모든 팀에서 중복되지 않는 팀원 목록 추출
  const allTeammates = Array.from(new Set(teams.flatMap(team => team.members.map(member => JSON.stringify(member)))))
    .map(memberString => JSON.parse(memberString));

  return (
    <header className="top-menu">
      {/* 왼쪽: 로고 (사이드바와 너비 맞춤) */}
      <div className="top-menu-left">
        <h1 className="logo" onClick={() => navigate('/')}>Todo App</h1>
      </div>

      {/* 중앙: 스크럼 관련 버튼 */}
      <div className="top-menu-center">
        {isScrumPage && (
          <div className="scrum-menu">
            <div className="team-management-container">
              <button className="scrum-menu-button" onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setShowTeammateDropdown(false); // 팀 관리 드롭다운 열릴 때 팀원 드롭다운 닫기
              }}>
                팀 생성/관리
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={openCreateModal}>팀 생성</button>
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <button
                        key={team.id}
                        className="dropdown-item"
                        onClick={() => {
                          setSelectedTeam(team);
                          openManageModal();
                        }}
                      >
                        {team.name}
                      </button>
                    ))
                  ) : (
                    <p className="dropdown-message">소속된 팀이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
            <div className="team-management-container"> {/* 팀원 버튼도 드롭다운을 위해 컨테이너 추가 */}
              <button className="scrum-menu-button" onClick={() => {
                setShowTeammateDropdown(!showTeammateDropdown);
                setIsDropdownOpen(false); // 팀원 드롭다운 열릴 때 팀 관리 드롭다운 닫기
              }}>
                팀원
              </button>
              {showTeammateDropdown && (
                <div className="dropdown-menu">
                  {allTeammates.length > 0 ? (
                    allTeammates.map((member) => (
                      <button
                        key={member.id}
                        className="dropdown-item"
                        onClick={() => navigate('/scrum/teammate-todolist', { state: { userId: member.id, userName: member.name } })}
                      >
                        {member.name}
                      </button>
                    ))
                  ) : (
                    <p className="dropdown-message">팀원이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
            {isTeamViewPage && ( // '홈' 버튼은 팀원 페이지에서만 보이도록
              <button className="scrum-menu-button" onClick={() => navigate('/scrum')}>홈</button>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽: 아이콘 버튼들 */}
      <div className="top-menu-right">
        <div style={{ position: 'relative' }}>
          <button className="icon-button" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <span className="icon">👤</span>
          </button>
          {showProfileMenu && (
            <div className="dropdown">
              <button onClick={handleLogout}>로그아웃</button>
            </div>
          )}
        </div>
        <button className="icon-button" onClick={() => console.log('Settings clicked')}>
          <span className="icon">⚙️</span>
        </button>
      </div>

      <TeamCreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onTeamCreated={handleTeamCreated}
      />

      {selectedTeam && (
        <TeamManageModal
          isOpen={isManageModalOpen}
          onClose={() => {
            closeManageModal();
            setSelectedTeam(null);
          }}
          team={selectedTeam}
          onTeamUpdated={handleTeamUpdated}
          onTeamDeleted={handleTeamDeleted}
        />
      )}
    </header>
  );
}

export default TopMenu;
