import { apiGet, apiPost, apiDelete } from './apiService';

// 🔥 개인 메모 전체 조회
export const getMemos = () => {
  return apiGet('/memo');
};

// 🔥 팀별 메모 조회 (팀에 속한 모든 멤버의 메모)
export const getTeamMemos = (teamId) => {
  return apiGet(`/memo/team/${teamId}`);
};

// 🔥 개인 메모 생성
export const createMemo = (content) => {
  return apiPost('/memo', { content });
};

// 🔥 개인 메모 삭제
export const deleteMemo = (memoId) => {
  return apiDelete(`/memo/${memoId}`);
};
