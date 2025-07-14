import { apiGet, apiPost, apiDelete, apiPatch } from './apiService';


export const getSubGoals = (goalId, userId) => {
  return apiGet(`/teamGoal/${goalId}/subgoals?userId=${userId}`);
}

export const createSubGoal = (goalId, data) => {
  return apiPost(`/teamGoal/${goalId}/subgoal`, data);
};

export const deleteSubGoal = (subGoalId) => {
  return apiDelete(`/teamGoal/subgoal/${subGoalId}`);
};

export const completeSubGoal = (subGoalId) => {
  return apiPatch(`/teamGoal/subgoal/${subGoalId}/complete`);
};

export const uncompleteSubGoal = (subGoalId) => {
  return apiPatch(`/teamGoal/subgoal/${subGoalId}/uncomplete`);
};

