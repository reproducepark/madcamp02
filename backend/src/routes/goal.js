import express from 'express'
import { PrismaClient } from '@prisma/client'
import authenticateToken from '../middleware/auth.js'

const prisma = new PrismaClient()
const router = express.Router()

// ✅ 팀 목표 생성
router.post('/:teamId/goal', authenticateToken, async (req, res) => {
  const { teamId } = req.params
  const { content, startDate, plannedEndDate } = req.body

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
    res.status(201).json(newGoal)
  } catch (err) {
    console.error('Error creating team goal:', err)
    res.status(500).json({ error: '팀 목표 생성 실패' })
  }
})

export default router
