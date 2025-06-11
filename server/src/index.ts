import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as authRouter } from './routes/auth';
import { router as accountsRouter } from './routes/accounts';
import { router as packagesRouter } from './routes/packages';
import { router as customersRouter } from './routes/customers';
import { router as activityRouter } from './routes/activity';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/accounts', authenticateToken, accountsRouter);
app.use('/api/packages', authenticateToken, packagesRouter);
app.use('/api/customers', authenticateToken, customersRouter);
app.use('/api/activity', authenticateToken, activityRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});