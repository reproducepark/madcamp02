import express from 'express'
import { PrismaClient } from '@prisma/client'
import authenticateToken from '../middleware/auth.js'

const prisma = new PrismaClient()
const router = express.Router()

// ✅ 팀 목표 생성
router.post('/:teamId/goal', authenticateToken, async (req, res) => {
  const { teamId } = req.params
  const { content, startDate, plannedEndDate } = req.body

  console.log('🔵 POST /api/team/:teamId/goal called with:', { teamId, content, startDate, plannedEndDate })

  if (!content || !startDate) {
    return res.status(400).json({ error: '내용과 시작 날짜는 필수입니다.' })
  }

  try {
    const newGoal = await prisma.teamGoal.create({
      data: {
        team_id: parseInt(teamId),
        content,
        start_date: new Date(startDate),
        planned_end_date: plannedEndDate ? new Date(plannedEndDate) : null,
        real_end_date: null
      }
    })
    console.log('🟢 Created new teamGoal:', newGoal)
    res.status(201).json(newGoal)
  } catch (err) {
    console.error('Error creating team goal:', err)
    res.status(500).json({ error: '팀 목표 생성 실패' })
  }
})


// ✅ 팀 목표 목록 조회
router.get('/:teamId/goals', authenticateToken, async (req, res) => {
  const { teamId } = req.params
  try {
    const goals = await prisma.teamGoal.findMany({
      where: { team_id: parseInt(teamId) },
      orderBy: { created_at: 'desc' }
    })
    console.log(`📦 GET /api/team/${teamId}/goals returned`, goals)
    res.json({ goals })
  } catch (err) {
    console.error('Error fetching team goals:', err)
    res.status(500).json({ error: '팀 목표 조회 실패' })
  }
})

// 팀 목표 삭제
router.delete('/goal/:goalId', authenticateToken, async (req, res) => {
  const { goalId } = req.params;

  try {
    await prisma.teamGoal.delete({
      where: { id: parseInt(goalId) }
    });
    console.log(`🗑 Deleted team goal ${goalId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting team goal:', err);
    res.status(500).json({ error: '팀 목표 삭제 실패' });
  }
});

// ✅ 완료로 설정
router.patch('/goal/:goalId/complete', authenticateToken, async (req, res) => {
  const { goalId } = req.params;
  try {
    const updatedGoal = await prisma.teamGoal.update({
      where: { id: parseInt(goalId) },
      data: { real_end_date: new Date() }
    });
    console.log(`✔️ Marked goal ${goalId} as complete`);
    res.json(updatedGoal);
  } catch (err) {
    console.error('Error completing goal:', err);
    res.status(500).json({ error: '완료 설정 실패' });
  }
});

// ✅ 완료 해제
router.patch('/goal/:goalId/uncomplete', authenticateToken, async (req, res) => {
  const { goalId } = req.params;
  try {
    const updatedGoal = await prisma.teamGoal.update({
      where: { id: parseInt(goalId) },
      data: { real_end_date: null }
    });
    console.log(`🚫 Unmarked goal ${goalId}`);
    res.json(updatedGoal);
  } catch (err) {
    console.error('Error uncompleting goal:', err);
    res.status(500).json({ error: '완료 해제 실패' });
  }
});

export default router
