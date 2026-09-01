import mongoose from 'mongoose';

async function main() {
  const uri = "mongodb://127.0.0.1:27017/speakio";
  
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully to server via Mongoose");
    
    const collection = mongoose.connection.collection('resources');
    
    const languages = await collection.distinct('language');
    console.log('Distinct languages in DB:', languages);
    
    const count = await collection.countDocuments();
    console.log('Total resources in DB:', count);
    
    const frenchCount = await collection.countDocuments({ language: { $in: ['fr', 'French', 'french', 'fr-FR', 'Français'] } });
    console.log('French resources:', frenchCount);

  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
