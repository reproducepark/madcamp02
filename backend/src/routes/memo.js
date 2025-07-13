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

// ✅ 개인 메모 생성
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.num;
  const { content } = req.body;
  try {
    const newMemo = await prisma.memo.create({
      data: {
        user_id: userId,
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
  try {
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
