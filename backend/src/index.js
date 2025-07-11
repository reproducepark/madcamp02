import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001; // Use 3001 as default for backend API

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); // Use auth routes

app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));