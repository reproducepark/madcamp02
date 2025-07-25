import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client'

const router = express.Router();
const prisma = new PrismaClient();

// 회원가입 API
router.post('/signup', async (req, res) => {
  const { username, password, name, class_section } = req.body;

  try {
    // 이미 같은 username 있는지 확인
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists." });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB에 저장
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        class_section
      }
    });

    res.status(201).json({ 
      message: "Signup success", 
      user: { id: newUser.id, username: newUser.username, name: newUser.name, class_section: newUser.class_section } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// 로그인 API
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    if (!user) return res.status(401).json({ message: "Invalid username or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid username or password." });

    // JWT 발급
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ 
      message: "Login success", 
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        class_section: user.class_section 
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// 토큰 확인 및 인증
router.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // DB에서 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    if (!user) return res.sendStatus(404);
    res.json({ id: user.id, username: user.username, createdAt: user.createdAt });
  } catch (err) {
    res.sendStatus(403);
  }
});

export default router;
