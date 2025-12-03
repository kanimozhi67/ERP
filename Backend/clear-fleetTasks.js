import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?retryWrites=true&w=majority&appName=erp';

const clearFleetTasks = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear only fleetTasks collection
    const result = await mongoose.connection.collection('fleetTaskPassengers').deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} documents from fleetTasks collection`);
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
};

clearFleetTasks();