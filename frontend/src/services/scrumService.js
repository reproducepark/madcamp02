import { getTeamMembers, getTeamGoals } from './teamService';
import { getSubGoals } from './subgoalService';
import { getTeamMemos } from './memoService';

/**
 * LLM에 제공할 스크럼 생성용 데이터를 수집하고 JSON 형식으로 반환합니다.
 * 지난 24시간 동안의 팀 목표, 개인별 하위 목표, 팀 메모를 포함합니다.
 * @param {string} teamId - 데이터를 수집할 팀의 ID
 * @returns {Promise<Object>} LLM에 공급할 데이터 JSON
 */
export const gatherDataForLLM = async (teamId) => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // 1. 팀의 모든 정보를 병렬로 가져옵니다.
    const [membersResponse, goalsResponse, memosResponse] = await Promise.all([
      getTeamMembers(teamId),
      getTeamGoals(teamId),
      getTeamMemos(teamId)
    ]);

    console.log('API 응답 수신:', { membersResponse, goalsResponse, memosResponse });

    if (!membersResponse.success || !goalsResponse.success || !memosResponse.success) {
      if (!membersResponse.success) {
        console.error('❌ 팀 멤버 정보 가져오기 실패:', membersResponse);
      }
      if (!goalsResponse.success) {
        console.error('❌ 팀 목표 정보 가져오기 실패:', goalsResponse);
      }
      if (!memosResponse.success) {
        console.error('❌ 팀 메모 정보 가져오기 실패:', memosResponse);
      }
      throw new Error('팀의 기본 정보를 가져오는 데 실패했습니다.');
    }

    const members = membersResponse.data.members;
    const allTeamGoals = goalsResponse.data.goals;
    const allMemos = memosResponse.data.memos;

    // 2. 지난 24시간과 관련된 팀 목표를 필터링합니다.
    console.log(allTeamGoals);  
    const recentTeamGoals = allTeamGoals.filter(goal => {
      const now = new Date();
      const startDate = new Date(goal.start_date);
      const plannedEndDate = new Date(goal.planned_end_date);
      let realEndDate = null;
      if (goal.real_end_date != null){
        realEndDate = new Date(goal.real_end_date);
      }
      else{
        realEndDate = null;
      }
      if (startDate <= twentyFourHoursAgo && twentyFourHoursAgo <= plannedEndDate) {
        // if (realEndDate != null){
        //   return twentyFourHoursAgo <= realEndDate;
        // }
        return true;
      }
      if (startDate <= now && now <= plannedEndDate) {
        // if (realEndDate != null){
        //   return twentyFourHoursAgo <= realEndDate;
        // }
        return true;
      }
      return false;
    });

    // 3. 필터링된 각 팀 목표에 대해 모든 멤버의 하위 목표를 가져옵니다.
    const goalsWithSubgoals = await Promise.all(
      recentTeamGoals.map(async (goal) => {
        const subGoalsByMember = await Promise.all(
          members.map(async (member) => {
            const subgoalsResponse = await getSubGoals(goal.id, member.id);
            if (subgoalsResponse.success && subgoalsResponse.data?.subgoals?.length > 0) {
              return {
                member: member.username,
                subgoals: subgoalsResponse.data.subgoals.map(sg => ({
                  content: sg.content,
                  is_completed: sg.is_completed,
                  completed_at: sg.completed_at
                }))
              };
            }
            return null;
          })
        );

        return {
          ...goal,
          subgoals: subGoalsByMember.filter(Boolean) // null이 아닌 항목만 필터링
        };
      })
    );
    
    // 4. 지난 24시간 내의 메모를 필터링합니다.
    const recentMemos = allMemos.filter(memo => {
        const createdAt = new Date(memo.created_at);
        return createdAt >= twentyFourHoursAgo;
    });

    // 5. 최종 JSON 객체를 구성하고 정제합니다.
    const cleanedGoals = goalsWithSubgoals.map(goal => ({
      content: goal.content,
      start_date: goal.start_date,
      planned_end_date: goal.planned_end_date,
      real_end_date: goal.real_end_date,
      created_at: goal.created_at,
      subgoals: goal.subgoals.flatMap(memberSubgoals => 
        memberSubgoals.subgoals.map(subgoal => ({
          content: subgoal.content,
          is_completed: subgoal.is_completed
        }))
      )
    }));

    const cleanedMemos = recentMemos.map(memo => ({
      content: memo.content,
      created_at: memo.created_at
    }));

    const llmData = {
      team_goals: cleanedGoals,
      team_memos: cleanedMemos,
    };

    return { success: true, data: llmData };

  } catch (error) {
    console.error('LLM용 데이터 수집 실패:', error);
    return { success: false, error: '스크럼 데이터 생성 중 오류가 발생했습니다.' };
  }
}; 