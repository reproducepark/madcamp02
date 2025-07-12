import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 팀 생성 API
router.post('/createTeam', authenticateToken, async (req, res) => {
  const { name } = req.body;
  const userNum = req.user.num; // authenticateToken 미들웨어에서 추가된 사용자 정보

  try {
    const existingTeam = await prisma.team.findUnique({
      where: { name },
    });

    if (existingTeam) {
      return res.status(400).json({ message: "Team name already exists." });
    }

    const newTeam = await prisma.team.create({
      data: {
        name,
      },
    });

    // 팀 생성자를 TeamMember로 추가
    await prisma.teamMember.create({
      data: {
        team_id: newTeam.id,
        user_id: userNum,
      },
    });

    res.status(201).json({ message: "Team created successfully", team: newTeam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
