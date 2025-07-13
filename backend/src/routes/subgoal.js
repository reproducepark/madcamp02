import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ teamGoal의 subgoals 조회
router.get('/:goalId/subgoals', authenticateToken, async (req, res) => {
  const { goalId } = req.params;

  try {
    const subgoals = await prisma.subGoal.findMany({
      where: { team_goal_id: parseInt(goalId) },
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
  const userId = req.user.num;

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

// 완료 처리
router.patch('/subgoal/:id/complete', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id)
  const updated = await prisma.subGoal.update({
    where: { id },
    data: {
      is_completed: true,
      completed_at: new Date()
    }
  })
  res.json(updated)
})

// 완료 취소
router.patch('/subgoal/:id/uncomplete', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id)
  const updated = await prisma.subGoal.update({
    where: { id },
    data: {
      is_completed: false,
      completed_at: null
    }
  })
  res.json(updated)
})

// 삭제
router.delete('/subgoal/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id)
  await prisma.subGoal.delete({ where: { id } })
  res.json({ success: true })
})

export default router;
