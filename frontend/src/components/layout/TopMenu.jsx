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
  const [teams, setTeams] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState(null);

  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useTeamModal();
  const { isOpen: isManageModalOpen, openModal: openManageModal, closeModal: closeManageModal } = useTeamModal();

  const navigate = useNavigate();
  const location = useLocation();

  const isScrumPage = location.pathname.startsWith('/scrum');
  const isTodoPage = location.pathname === '/todo';
  const isTeamViewPage = location.pathname === '/scrum/teammate-todolist';

  // fetchTeams 함수와 useEffect 훅은 하드코딩을 위해 주석 처리합니다.
  const fetchTeams = async () => {
    try {
      const response = await getTeams();
      if (response.success) {
        setTeams(response.data.teams);
      } else {
        console.error('Failed to fetch teams:', response.message);
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      fetchTeams();
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const savedTeam = localStorage.getItem('selectedTeam');
    if (savedTeam) {
      const parsedTeam = JSON.parse(savedTeam);
      console.log("✅ 복원된 selectedTeam:", parsedTeam);
      setSelectedTeam(parsedTeam);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
  };

  // 하드코딩된 데이터에서는 팀 생성/업데이트/삭제 시 목록 새로고침이 필요 없으므로 주석 처리합니다.
  const handleTeamCreated = () => {
    // fetchTeams(); // 팀 생성 후 목록 새로고침
    
    closeCreateModal();
  };

  const handleTeamUpdated = () => {
    // fetchTeams(); // 팀 업데이트 후 목록 새로고침
    // alert('팀 업데이트 로직 (하드코딩): 실제 API 호출 필요');
  };

  const handleTeamDeleted = () => {
    // fetchTeams(); // 팀 삭제 후 목록 새로고침
    alert('팀 삭제 로직 (하드코딩): 실제 API 호출 필요');
    setSelectedTeam(null);
  };

  // // 모든 팀에서 중복되지 않는 팀원 목록 추출
  // const allTeammates = Array.from(new Set(teams.flatMap(team => team.members.map(member => JSON.stringify(member)))))
  //   .map(memberString => JSON.parse(memberString));
  const teammates = selectedTeam ? selectedTeam.members : [];


  return (
    <header className="top-menu">
      {/* 왼쪽: 로고 (사이드바와 너비 맞춤) */}
      <div className="top-menu-left">
        <h1 className="logo" onClick={() => navigate('/')}>Todo App</h1>
      </div>

      {/* 중앙: 스크럼 관련 버튼 */}
      <div className="top-menu-center">
        {(isScrumPage || isTodoPage) && (
          <div className="scrum-menu">
            <div className="team-management-container">
              <button className="scrum-menu-button" onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setShowTeammateDropdown(false); // 팀 관리 드롭다운 열릴 때 팀원 드롭다운 닫기
              }}>
                {isTodoPage ? '팀 선택' : '팀 생성/관리'}
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {!isTodoPage && (
                    <button className="dropdown-item" onClick={openCreateModal}>팀 생성</button>
                  )}
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <div key={team.id} className="dropdown-item-container">
                        <span 
                          className="dropdown-item-name"
                          onClick={() => {
                            localStorage.setItem('selectedTeam', JSON.stringify(team));
                            setSelectedTeam(team); 
                            console.log("✅ team 선택됨:", team);
                            console.log("✅ team.members:", team.members);

                            if (location.pathname === '/todo') {
                              window.dispatchEvent(new CustomEvent('teamChanged', {
                                detail: { teamId: team.id, teamName: team.name }
                              }));
                            } else if (location.pathname === '/scrum') {
                              window.dispatchEvent(new CustomEvent('teamChanged', {
                                detail: { teamId: team.id, teamName: team.name }
                              }));
                            } else {
                              navigate('/scrum', { state: { teamId: team.id, teamName: team.name } });
                            }
                            setIsDropdownOpen(false);
                          }}
                        >
                          {team.name}
                        </span>

                        {!isTodoPage && (
                          <button 
                            className="dropdown-item-setting-btn"
                            onClick={() => {
                              localStorage.setItem('selectedTeam', JSON.stringify(team));
                              setSelectedTeam(team); 
                              console.log("✅ 선택된 team:", team);
                              console.log("✅ team.members:", team.members);
                              openManageModal();
                            }}


                          >
                            설정
                          </button>
                        )}
                      </div>
                    ))
                  ) : null
                }
                </div>
              )}
            </div>
            {isScrumPage && (
              <div className="team-management-container"> {/* 팀원 버튼도 드롭다운을 위해 컨테이너 추가 */}
                <button className="scrum-menu-button" onClick={() => {
                  setShowTeammateDropdown(!showTeammateDropdown);
                  setIsDropdownOpen(false); // 팀원 드롭다운 열릴 때 팀 관리 드롭다운 닫기
                }}>
                  팀원
                </button>
                {showTeammateDropdown && (
                  <div className="dropdown-menu">
                    {teammates.length > 0 ? (
                      teammates.map((member) => (
                        <button
                          key={member.id}
                          className="dropdown-item"
                          onClick={() => navigate('/scrum/teammate-todolist', { 
                            state: { 
                              teamId: selectedTeam.id,
                              teamName: selectedTeam.name,
                              userId: member.id,
                              userName: member.name,
                            }
                          })}
                          
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
            )}
            {isTeamViewPage && ( // '홈' 버튼은 팀원 페이지에서만 보이도록
              <button className="scrum-menu-button" onClick={() => navigate('/scrum', {
              state: { 
                teamId: selectedTeam.id,
                teamName: selectedTeam.name,
                userId: member.id,
                userName: member.name
                }
              })}>홈</button>
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
          key={selectedTeam?.id || 'new-team'}
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
