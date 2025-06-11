import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Subscription Management API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({ message: 'API endpoints available' });
});

// Activity logs endpoint (placeholder for now)
app.post('/api/activity', (req, res) => {
  console.log('Activity log received:', req.body);
  res.json({ success: true, message: 'Activity logged' });
});

app.get('/api/activity', (req, res) => {
  res.json([]);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api',
      'POST /api/activity',
      'GET /api/activity'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api`);
});