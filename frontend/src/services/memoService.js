import { apiGet, apiPost, apiDelete } from './apiService';

// 🔥 개인 메모 전체 조회
export const getMemos = () => {
  return apiGet('/memo');
};

// 🔥 개인 메모 생성
export const createMemo = (content) => {
  return apiPost('/memo', { content });
};

// 🔥 개인 메모 삭제
export const deleteMemo = (memoId) => {
  return apiDelete(`/memo/${memoId}`);
};
