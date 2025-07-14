import { apiGet, apiPost, apiDelete, apiPatch } from './apiService';


export const getSubGoals = (goalId) => {
  return apiGet(`/api/teamGoal/${goalId}/subgoals`);
};

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

