import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logoutUser, getTeams } from '../../services';
import { useTeamModal } from '../../hooks/useTeamModal';
import TeamCreateModal from '../Modal/TeamCreateModal';
import TeamManageModal from '../Modal/TeamManageModal';
import './TopMenu.css';
import logoImage from '../../assets/icon_1024_tp.png';

function TopMenu({ onLogout }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTeammateDropdown, setShowTeammateDropdown] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useTeamModal();
  const { isOpen: isManageModalOpen, openModal: openManageModal, closeModal: closeManageModal } = useTeamModal();

  const navigate = useNavigate();
  const location = useLocation();

  const isScrumOrTodoPage = location.pathname.startsWith('/scrum') || location.pathname === '/todo';

  const fetchTeams = async () => {
    try {
      const response = await getTeams();
      if (response.success) {
        setTeams(response.data.teams);

        const savedTeam = localStorage.getItem('selectedTeam');
        if (savedTeam) {
          const parsedTeam = JSON.parse(savedTeam);
          const updatedTeam = response.data.teams.find(t => t.id === parsedTeam.id);
          if (updatedTeam) {
            setSelectedTeam(updatedTeam);
            console.log("✅ fetchTeams 최신 selectedTeam 갱신:", updatedTeam);
          } else {
            setSelectedTeam(null);
            localStorage.removeItem('selectedTeam');
            console.log("⚠️ 해당 ID의 팀을 찾지 못함");
          }
        }
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
      setSelectedTeam(parsedTeam);
      console.log("✅ 로드된 selectedTeam:", parsedTeam);
    }
  }, []);

  useEffect(() => {
    if (teams.length > 0 && selectedTeam) {
      const updatedTeam = teams.find(t => t.id === selectedTeam.id);
      if (updatedTeam) {
        setSelectedTeam(updatedTeam);
        console.log("🔄 teams 변경 -> selectedTeam 갱신:", updatedTeam);
      }
    }
  }, [teams]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logoutUser();
    }
  };

  const handleTeamCreated = () => {
    fetchTeams();
    closeCreateModal();
  };

  const handleTeamUpdated = () => {
    fetchTeams();
  };

  const handleTeamDeleted = () => {
    setSelectedTeam(null);
    localStorage.removeItem('selectedTeam');
    fetchTeams();
  };

  const teammates = selectedTeam ? selectedTeam.members : [];

  return (
    <header className="top-menu">
      <div className="top-menu-left">
        <img 
          src={logoImage} 
          alt="Logo" 
          className="logo" 
          onClick={() => navigate('/')}
          style={{ 
            height: '50px', 
            width: 'auto', 
            cursor: 'pointer',
            objectFit: 'contain',
          }}
        />
      </div>

      <div className="top-menu-center">
        {isScrumOrTodoPage && (
          <div className="scrum-menu">
            <div className="team-management-container">
              <button className="scrum-menu-button" onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setShowTeammateDropdown(false);
              }}>
                팀 생성/관리
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={openCreateModal}>팀 생성</button>
                  {teams.length > 0 && teams.map(team => (
                    <div key={team.id} className="dropdown-item-container">
                      <span
                        className="dropdown-item-name"
                        onClick={() => {
                          localStorage.setItem('selectedTeam', JSON.stringify(team));
                          setSelectedTeam(team);
                          console.log("✅ 선택된 team:", team);

                          if (location.pathname === '/todo' || location.pathname === '/scrum') {
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

                      <button
                        className="dropdown-item-setting-btn"
                        onClick={() => {
                          localStorage.setItem('selectedTeam', JSON.stringify(team));
                          setSelectedTeam(team);
                          console.log("⚙️ 팀 설정 진입:", team);
                          openManageModal();
                        }}
                      >
                        설정
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="team-management-container">
              <button className="scrum-menu-button" onClick={() => {
                setShowTeammateDropdown(!showTeammateDropdown);
                setIsDropdownOpen(false);
              }}>
                팀원
              </button>
              {showTeammateDropdown && (
                <div className="dropdown-menu">
                  {teammates.length > 0 ? (
                    teammates.map(member => (
                      <button
                        key={member.id}
                        className="dropdown-item"
                        onClick={() => navigate('/todo', {
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

            {/* {
              <button className="scrum-menu-button" onClick={() => navigate('/scrum')}>홈</button>
            } */}
          </div>
        )}
      </div>

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
        {/* <button className="icon-button" onClick={() => console.log('Settings clicked')}>
          <span className="icon">⚙️</span>
        </button> */}
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
          onClose={closeManageModal}
          team={selectedTeam}
          onTeamUpdated={handleTeamUpdated}
          onTeamDeleted={handleTeamDeleted}
        />
      )}
    </header>
  );
}

export default TopMenu;
