import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 팀 생성 API
router.post('/createTeam', authenticateToken, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  try {
    const existingTeam = await prisma.team.findUnique({
      where: { name },
    });

    if (existingTeam) {
      return res.status(400).json({ message: "이미 존재하는 팀 이름입니다." });
    }

    const newTeam = await prisma.team.create({
      data: { name },
    });

    await prisma.teamMember.create({
      data: {
        team_id: newTeam.id,
        user_id: userId,
      },
    });

    res.status(201).json({ message: "팀이 성공적으로 생성되었습니다.", team: newTeam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 사용자가 속한 팀 목록 조회
router.get('/myTeams', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { user_id: userId },
      include: {
        team: {
          include: {
            TeamMembers: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: {
        team_id: 'asc',
      },
    });

    const teams = memberships.map(membership => ({
      id: membership.team.id,
      name: membership.team.name,
      created_at: membership.team.created_at,
      members: membership.team.TeamMembers
        .filter(member => member.user.id !== userId) // 자기 제외
        .map(member => ({
          id: member.user.id,
          username: member.user.username,
          name: member.user.name,
        })),
    }));

    res.status(200).json({ teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 팀 이름 변경
router.put('/:teamId', authenticateToken, async (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "팀 이름을 입력해주세요." });
  }

  try {
    const current = await prisma.team.findUnique({ where: { id: teamId } });
    if (!current) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }

    if (current.name === name) {
      return res.status(400).json({ message: "같은 이름으로는 변경할 수 없습니다." });
    }

    const duplicate = await prisma.team.findUnique({ where: { name } });
    if (duplicate) {
      return res.status(400).json({ message: "같은 이름의 팀이 이미 존재합니다." });
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { name },
    });

    res.status(200).json({ success: true, team: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 팀 멤버 추가 (username 기준)
router.post('/:teamId/members', authenticateToken, async (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { username } = req.body;

  console.log("teamId:", teamId);
  console.log("username:", username);
  console.log("req.body:", req.body);

  try {
    const userToAdd = await prisma.user.findUnique({
      where: { username },
    });

    if (!userToAdd) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const teamExists = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!teamExists) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }

    const alreadyMember = await prisma.teamMember.findFirst({
      where: {
        team_id: teamId,
        user_id: userToAdd.id,
      },
    });

    if (alreadyMember) {
      return res.status(400).json({ message: "이미 팀에 속한 사용자입니다." });
    }

    await prisma.teamMember.create({
      data: {
        team_id: teamId,
        user_id: userToAdd.id,
      },
    });

    res.status(201).json({ message: "멤버가 성공적으로 추가되었습니다!", member: { id: userToAdd.id, username: userToAdd.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 팀 멤버 삭제 (id 기준)
router.delete('/:teamId/members/:userId', authenticateToken, async (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  const userId = parseInt(req.params.userId, 10);

  try {
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToRemove) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        team_id: teamId,
        user_id: userToRemove.id,
      },
    });

    if (!membership) {
      return res.status(404).json({ message: "팀에 속하지 않은 사용자입니다." });
    }

    await prisma.teamMember.delete({
      where: { id: membership.id },
    });

    res.status(200).json({ message: "멤버가 성공적으로 삭제되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});


// 팀 삭제
router.delete('/:teamId', authenticateToken, async (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);

  try {
    const team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }

    await prisma.team.delete({ where: { id: teamId } });

    res.status(200).json({ message: "팀이 성공적으로 삭제되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

export default router;
