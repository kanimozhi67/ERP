import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import dotenv from 'dotenv';

// Route imports
import userRoutes from './routes/userRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import fleetVehicleRoutes from './routes/fleetVehicleRoutes.js';
import fleetTaskRoutes from './routes/fleetTaskRoutes.js';
import fleetTaskPassengerRoutes from './routes/fleetTaskPassengerRoutes.js';
import fleetAlertRoutes from './routes/fleetAlertRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import materialsRoutes from './routes/materialsRoutes.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/fleet-vehicles', fleetVehicleRoutes);
app.use('/api/fleet-tasks', fleetTaskRoutes);
app.use('/api/fleet-task-passengers', fleetTaskPassengerRoutes);
app.use('/api/fleet-alerts', fleetAlertRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/materials',materialsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ERP API is running!',
    endpoints: {
      users: '/api/users',
      companies: '/api/companies',
      employees: '/api/employees',
      fleetVehicles: '/api/fleet-vehicles',
      fleetTasks: '/api/fleet-tasks',
      fleetTaskPassengers: '/api/fleet-task-passengers',
      fleetAlerts: '/api/fleet-alerts',
      drivers: '/api/drivers',
      projects: '/api/projects',
       tasks: '/api/tasks' ,
       materials: '/api/materials'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at: http://localhost:${PORT}`);
  console.log(`🏗️ Projects API available at: http://localhost:${PORT}/api/projects`);
});

export default app;