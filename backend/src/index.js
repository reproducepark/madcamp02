import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import teamRouter from './routes/team.js';
import teamGoalRouter from './routes/goal.js'
import memoRouter from './routes/memo.js'
import subgoalRouter from './routes/subgoal.js'


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/team', teamRouter);
app.use('/api/team', teamGoalRouter)
app.use('/api/memo', memoRouter)
app.use('/api/teamGoal', subgoalRouter);

app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
