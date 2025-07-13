import { apiRequest, apiPost, apiGet, apiPut, apiDelete } from './apiService';

/**
 * 팀 생성
 * @param {string} teamName - 생성할 팀 이름
 * @returns {Promise<Object>} API 응답
 */
export const createTeam = (teamName) => {
  return apiPost('/team/createTeam', { name: teamName });
};

/**
 * 사용자가 속한 팀 목록 조회
 * @returns {Promise<Object>} API 응답
 */
export const getTeams = () => {
  return apiGet('/team/myTeams');
};

/**
 * 팀 이름 변경
 * @param {string} teamId - 팀 ID
 * @param {string} newName - 새로운 팀 이름
 * @returns {Promise<Object>} API 응답
 */
export const updateTeam = (teamId, newName) => {
  return apiPut(`/team/${teamId}`, { name: newName });
};

/**
 * 팀 삭제
 * @param {string} teamId - 팀 ID
 * @returns {Promise<Object>} API 응답
 */
export const deleteTeam = (teamId) => {
  return apiDelete(`/team/${teamId}`);
};

/**
 * 팀 멤버 추가
 * @param {string} teamId - 팀 ID
 * @param {string} userId - 추가할 사용자 ID
 * @returns {Promise<Object>} API 응답
 */
export const addTeamMember = (teamId, userId) => {
  return apiPost(`/team/${teamId}/members`, { userId });
};

/**
 * 팀 멤버 삭제
 * @param {string} teamId - 팀 ID
 * @param {string} userId - 삭제할 사용자 ID
 * @returns {Promise<Object>} API 응답
 */
export const removeTeamMember = (teamId, userId) => {
  return apiDelete(`/team/${teamId}/members/${userId}`);
};
