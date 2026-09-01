import mongoose from 'mongoose';

async function main() {
  const uri = "mongodb://127.0.0.1:27017/speakio";
  
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully to server via Mongoose");
    
    const collection = mongoose.connection.collection('resources');
    
    const indexes = await collection.indexes();
    console.log("Current indexes:", JSON.stringify(indexes, null, 2));

    const textIndex = indexes.find(i => i.textIndexVersion !== undefined);
    if (textIndex && textIndex.name) {
      console.log("Found text index, dropping it...", textIndex.name);
      await collection.dropIndex(textIndex.name);
      console.log("Dropped text index.");
    } else {
      console.log("No text index found.");
    }

  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
