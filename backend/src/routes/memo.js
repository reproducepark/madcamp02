import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ 개인 메모 조회
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.num;
  try {
    const memos = await prisma.memo.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    res.json({ memos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '메모 불러오기 실패' });
  }
});

// ✅ 팀별 메모 조회 (팀에 속한 모든 멤버의 메모)
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.num;
  
  console.log('🔍 팀 메모 조회 요청 - 팀 ID:', teamId, '사용자 ID:', userId);
  
  try {
    // 사용자가 해당 팀의 멤버인지 확인
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        team_id: parseInt(teamId),
        user_id: userId,
      },
    });

    if (!teamMembership) {
      console.log('❌ 팀 멤버가 아님 - 팀 ID:', teamId, '사용자 ID:', userId);
      return res.status(403).json({ error: '해당 팀의 멤버가 아닙니다.' });
    }

    // 해당 팀의 메모만 조회
    const teamMemos = await prisma.memo.findMany({
      where: {
        team_id: parseInt(teamId),
      },
      include: {
        user: {
          select: {
            num: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    console.log('📋 조회된 메모 개수:', teamMemos.length);
    console.log('📝 메모 목록:', teamMemos.map(memo => ({ id: memo.id, content: memo.content, user_id: memo.user_id, team_id: memo.team_id })));

    res.json({ memos: teamMemos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '팀 메모 불러오기 실패' });
  }
});

// ✅ 개인 메모 생성
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.num;
  const { content, teamId } = req.body;
  
  if (!teamId) {
    return res.status(400).json({ error: '팀 ID가 필요합니다.' });
  }
  
  try {
    // 사용자가 해당 팀의 멤버인지 확인
    const teamMembership = await prisma.teamMember.findFirst({
      where: {
        team_id: parseInt(teamId),
        user_id: userId,
      },
    });

    if (!teamMembership) {
      return res.status(403).json({ error: '해당 팀의 멤버가 아닙니다.' });
    }

    const newMemo = await prisma.memo.create({
      data: {
        user_id: userId,
        team_id: parseInt(teamId),
        content,
      }
    });
    res.status(201).json(newMemo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '메모 생성 실패' });
  }
});

// ✅ 개인 메모 삭제
router.delete('/:memoId', authenticateToken, async (req, res) => {
  const { memoId } = req.params;
  const userId = req.user.num;
  
  try {
    // 본인이 작성한 메모만 삭제 가능하도록 확인
    const memo = await prisma.memo.findFirst({
      where: { 
        id: parseInt(memoId),
        user_id: userId,
      },
    });

    if (!memo) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    await prisma.memo.delete({
      where: { id: parseInt(memoId) },
    });
    res.status(200).json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '메모 삭제 실패' });
  }
});

export default router;
