import { apiGet, apiPost, apiDelete, apiPatch } from './apiService';

export const getSubGoals = (goalId, userId) => {
  if (!userId) {
    console.error('getSubGoals: userId가 undefined입니다.');
    return Promise.resolve({ success: false, data: { subgoals: [] } });
  }
  return apiGet(`/api/teamGoal/${goalId}/subgoals?userId=${userId}`);
}

// export const getSubGoals = (goalId) => {
//   return apiGet(`/api/teamGoal/${goalId}/subgoals`);
// };
// export const getSubGoals = (goalId, userId) => {
//   return apiGet(`/teamGoal/${goalId}/subgoals?userId=${userId}`);
// }

export const createSubGoal = (goalId, data) => {
  return apiPost(`/api/teamGoal/${goalId}/subgoal`, data);
};

export const deleteSubGoal = (subGoalId) => {
  return apiDelete(`/api/teamGoal/subgoal/${subGoalId}`);
};

export const completeSubGoal = (subGoalId) => {
  return apiPatch(`/api/teamGoal/subgoal/${subGoalId}/complete`);
};

export const uncompleteSubGoal = (subGoalId) => {
  return apiPatch(`/api/teamGoal/subgoal/${subGoalId}/uncomplete`);
};

