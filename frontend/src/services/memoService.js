import { apiGet, apiPost, apiDelete } from './apiService';

// 🔥 개인 메모 조회 (특정 팀의 개인 메모)
export async function getPersonalMemos(teamId, userId) {
  return await apiGet(`/api/memo/${teamId}/personalMemos?userId=${userId}`);
}

// 🔥 팀별 메모 조회 (팀에 속한 모든 멤버의 메모)
export const getTeamMemos = (teamId) => {
  return apiGet(`/api/memo/team/${teamId}`);
};

// 🔥 개인 메모 생성 (특정 팀의 개인 메모)
export const createPersonalMemo = (content, teamId) => {
  return apiPost(`/api/memo/${teamId}/personal`, { content });
};

// 🔥 팀 메모 생성
export const createMemo = (content, teamId) => {
  return apiPost('/api/memo', { content, teamId });
};

// 🔥 개인 메모 삭제
export const deleteMemo = (memoId) => {
  return apiDelete(`/api/memo/${memoId}`);
};
