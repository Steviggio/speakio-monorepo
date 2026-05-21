import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/speakio';

async function createAdmin() {
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const username = process.env.ADMIN_USERNAME;

    if (!email || !password || !username) {
      console.error('Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME');
      process.exit(1);
    }

    const usersCollection = mongoose.connection.collection('users');

    const existingAdmin = await usersCollection.findOne({ email });
    if (existingAdmin) {
      console.log(
        'Admin user already exists. Updating role to ADMIN just in case...',
      );
      await usersCollection.updateOne({ email }, { $set: { role: 'ADMIN' } });
      console.log('Done.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await usersCollection.insertOne({
      email,
      username,
      passwordHash,
      role: 'ADMIN',
      locale: 'fr',
      learningLanguages: [],
      favoriteResources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });

    console.log('Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
