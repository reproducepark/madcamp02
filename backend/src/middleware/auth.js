import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401); // No token provided

  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401); // Invalid token format

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { num: payload.userNum }
    });

    if (!user) return res.sendStatus(403); // User not found

    req.user = user; // Attach user object to the request
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.sendStatus(403); // Invalid or expired token
  }
};

export default authenticateToken;
