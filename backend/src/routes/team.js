import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 팀 생성 API
router.post('/createTeam', async (req, res) => {
  const { name } = req.body;

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
    res.status(201).json({ message: "Team created successfully", team: newTeam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
