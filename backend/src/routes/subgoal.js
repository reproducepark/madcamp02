import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ teamGoal의 subgoals 조회
router.get('/:goalId/subgoals', authenticateToken, async (req, res) => {
  const { goalId } = req.params;
  const userId = parseInt(req.query.userId) || req.user.id;  // 🌱 fallback

  try {
    const subgoals = await prisma.subGoal.findMany({
      where: {
        team_goal_id: parseInt(goalId),
        user_id: userId
      },
      orderBy: { created_at: 'asc' },
      include: { user: true },
    });

    res.json({ success: true, subgoals });
  } catch (err) {
    console.error('Failed to fetch subgoals:', err);
    res.status(500).json({ success: false, message: '서브목표를 불러오지 못했습니다.' });
  }
});


// ✅ teamGoal에 subgoal 생성
router.post('/:goalId/subgoal', authenticateToken, async (req, res) => {
  const { goalId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    const newSubGoal = await prisma.subGoal.create({
      data: {
        team_goal_id: parseInt(goalId),
        user_id: userId,
        content,
        is_completed: false
      }
    });
    res.json({ success: true, subgoal: newSubGoal });
  } catch (err) {
    console.error('Failed to create subgoal:', err);
    res.status(500).json({ success: false, message: '서브목표 생성 실패' });
  }
});

// ✅ SubGoal 완료
router.patch('/subgoal/:subgoalId/complete', authenticateToken, async (req, res) => {
  const subgoalId = parseInt(req.params.subgoalId, 10);
  try {
    const updatedSubGoal = await prisma.subGoal.update({
      where: { id: subgoalId },
      data: {
        is_completed: true,
        completed_at: new Date()
      }
    });

    // 모든 subgoal이 완료됐는지 확인
    const allCompleted = await prisma.subGoal.findMany({
      where: {
        team_goal_id: updatedSubGoal.team_goal_id
      }
    });

    if (allCompleted.length > 0 && allCompleted.every(sg => sg.is_completed)) {
      await prisma.teamGoal.update({
        where: { id: updatedSubGoal.team_goal_id },
        data: { real_end_date: new Date() }
      });
      console.log(`✅ All SubGoals completed → TeamGoal ${updatedSubGoal.team_goal_id} 완료 처리`);
    }

    res.json(updatedSubGoal);
  } catch (err) {
    console.error('Error completing subgoal:', err);
    res.status(500).json({ error: 'SubGoal 완료 실패' });
  }
});


// ✅ SubGoal 해제
router.patch('/subgoal/:subgoalId/uncomplete', authenticateToken, async (req, res) => {
  const subgoalId = parseInt(req.params.subgoalId, 10);
  try {
    const updatedSubGoal = await prisma.subGoal.update({
      where: { id: subgoalId },
      data: {
        is_completed: false,
        completed_at: null
      }
    });

    // subgoal 해제 → teamGoal 무조건 완료 해제
    await prisma.teamGoal.update({
      where: { id: updatedSubGoal.team_goal_id },
      data: { real_end_date: null }
    });

    console.log(`⚠️ SubGoal ${subgoalId} 해제 → TeamGoal ${updatedSubGoal.team_goal_id} 자동 해제`);
    res.json(updatedSubGoal);
  } catch (err) {
    console.error('Error uncompleting subgoal:', err);
    res.status(500).json({ error: 'SubGoal 해제 실패' });
  }
});


// 삭제
router.delete('/subgoal/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id)
  await prisma.subGoal.delete({ where: { id } })
  res.json({ success: true })
})

export default router;
