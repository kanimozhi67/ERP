import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(dbURI, { dbName })
  .then(() => console.log(`✅ Connected to MongoDB database: ${dbName}`))
  .catch(err => console.error('❌ MongoDB connection error:', err));
    const conn = await mongoose.connect(dbURI, { dbName });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;