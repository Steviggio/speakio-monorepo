import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/speakio';

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  bio: String,
  nativeLanguage: String,
  learningLanguages: [String],
  favoriteResources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
}, { timestamps: true });

const ResourceSchema = new mongoose.Schema({
  title: String,
  description: String,
  url: String,
  type: { type: String, enum: ['BOOK', 'AUDIO', 'VIDEO', 'APP', 'CHAT', 'ARTICLE', 'WEBSITE'] },
  language: String,
  tags: [String],
  pricing: { type: String, enum: ['FREE', 'FREEMIUM', 'PREMIUM'], default: 'FREE' },
  imageUrl: String,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  positiveVotes: { type: Number, default: 0 },
  negativeVotes: { type: Number, default: 0 },
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  language: String,
  tags: [String],
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
  const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

  let seedUser = await User.findOne({ username: 'seedbot' });
  if (!seedUser) {
    seedUser = await User.create({
      username: 'seedbot',
      email: 'seedbot@speakio.app',
      password: '$2b$10$dummyhashnotusedforlogin',
      bio: 'I am the seed bot for Speakio demo data.',
      nativeLanguage: 'en',
      learningLanguages: ['fr', 'es', 'de'],
    });
    console.log('Created seed user: seedbot');
  }

  const existingResources = await Resource.countDocuments();
  if (existingResources === 0) {
    const resources = [
      { title: 'Duolingo', description: 'Gamified language learning app with bite-sized lessons and streaks.', url: 'https://duolingo.com', type: 'APP', language: 'multi', tags: ['gamification', 'beginner'], pricing: 'FREEMIUM' },
      { title: 'Anki', description: 'Powerful spaced repetition flashcard system for vocabulary retention.', url: 'https://apps.ankiweb.net', type: 'APP', language: 'multi', tags: ['flashcards', 'srs', 'vocabulary'], pricing: 'FREE' },
      { title: 'Pimsleur', description: 'Audio-based language learning method focusing on conversation skills.', url: 'https://pimsleur.com', type: 'AUDIO', language: 'multi', tags: ['audio', 'conversation', 'premium'], pricing: 'PREMIUM' },
      { title: 'Assimil', description: 'Classic French method for intuitive language learning through parallel texts.', url: 'https://assimil.com', type: 'BOOK', language: 'fr', tags: ['book', 'immersion', 'method'], pricing: 'PREMIUM' },
      { title: 'Easy French (YouTube)', description: 'Street interviews in French with subtitles for authentic listening practice.', url: 'https://youtube.com/c/EasyFrench', type: 'VIDEO', language: 'fr', tags: ['youtube', 'listening', 'authentic'], pricing: 'FREE' },
      { title: 'SpanishPod101', description: 'Comprehensive Spanish podcast lessons from beginner to advanced.', url: 'https://spanishpod101.com', type: 'AUDIO', language: 'es', tags: ['podcast', 'lessons'], pricing: 'FREEMIUM' },
      { title: 'Lingoda', description: 'Online language school with live classes and certified teachers.', url: 'https://lingoda.com', type: 'WEBSITE', language: 'multi', tags: ['live-classes', 'certified'], pricing: 'PREMIUM' },
      { title: 'Tandem', description: 'Language exchange app to practice speaking with native speakers worldwide.', url: 'https://tandem.net', type: 'CHAT', language: 'multi', tags: ['exchange', 'speaking', 'community'], pricing: 'FREE' },
      { title: 'Fluent Forever', description: 'Method and app based on pronunciation-first learning and memory science.', url: 'https://fluent-forever.com', type: 'APP', language: 'multi', tags: ['pronunciation', 'method', 'memory'], pricing: 'PREMIUM' },
      { title: 'News in Slow Spanish', description: 'Weekly news in slow, clear Spanish for intermediate learners.', url: 'https://newsinslowspanish.com', type: 'AUDIO', language: 'es', tags: ['news', 'intermediate', 'listening'], pricing: 'FREEMIUM' },
      { title: 'Deutsche Welle Learn German', description: 'Free comprehensive German courses from A1 to C level by Deutsche Welle.', url: 'https://dw.com/en/learn-german', type: 'WEBSITE', language: 'de', tags: ['course', 'free', 'german'], pricing: 'FREE' },
      { title: 'Italki', description: 'Platform connecting students with professional language tutors for 1-on-1 lessons.', url: 'https://italki.com', type: 'WEBSITE', language: 'multi', tags: ['tutor', 'one-on-one', 'professional'], pricing: 'FREEMIUM' },
    ];

    await Resource.insertMany(
      resources.map((r) => ({ ...r, submittedBy: seedUser._id, positiveVotes: Math.floor(Math.random() * 50) + 5, negativeVotes: Math.floor(Math.random() * 5) }))
    );
    console.log(`Seeded ${resources.length} resources`);
  } else {
    console.log(`Resources already exist (${existingResources}), skipping`);
  }

  const existingPosts = await Post.countDocuments();
  if (existingPosts === 0) {
    const posts = [
      {
        title: '5 Tips for Learning French as a Beginner',
        slug: '5-tips-learning-french-beginner',
        content: `## Starting Your French Journey\n\nLearning French can feel overwhelming at first, but with the right approach, you'll be having basic conversations in no time.\n\n### 1. Start with Pronunciation\n\nFrench pronunciation is the foundation. Spend your first week just listening and repeating sounds. The nasal vowels and silent letters will become natural.\n\n### 2. Learn the 100 Most Common Words\n\nThese words cover about **50% of everyday French**. Focus on words like *je, tu, il, être, avoir, faire, dire* before moving to complex vocabulary.\n\n### 3. Watch French Content with Subtitles\n\nStart with French subtitles on French content, then gradually remove them. YouTube channels like *Easy French* are perfect for this.\n\n### 4. Find a Language Partner\n\nApps like Tandem let you practice with native speakers. Even 15 minutes a day makes a huge difference.\n\n### 5. Be Consistent, Not Perfect\n\nIt's better to study 15 minutes every day than 2 hours once a week. Build a habit first, then increase intensity.`,
        language: 'en',
        tags: ['french', 'beginner', 'tips'],
        status: 'published',
      },
      {
        title: 'The Spaced Repetition Revolution',
        slug: 'spaced-repetition-revolution',
        content: `## Why Spaced Repetition Changes Everything\n\nIf you're not using spaced repetition (SRS), you're leaving **80% of your learning potential** on the table.\n\n### How It Works\n\nSRS algorithms show you flashcards just before you're about to forget them. This optimizes the timing of your reviews so you:\n\n- **Remember more** with less study time\n- **Build long-term memory** instead of cramming\n- **Track your progress** automatically\n\n### The Best SRS Tools\n\n**Anki** remains the gold standard. It's free, highly customizable, and has a massive community sharing pre-made decks.\n\nFor a more polished experience, **Memrise** offers curated courses with video clips of native speakers.\n\n### My Personal System\n\nI review **50 cards per day** — takes about 20 minutes. After 6 months, I had a working vocabulary of over 3,000 words in Spanish.\n\nThe key is to make your own cards. Writing them forces you to engage with the material more deeply than pre-made decks.`,
        language: 'en',
        tags: ['srs', 'anki', 'vocabulary', 'method'],
        status: 'published',
      },
      {
        title: 'Comment j\'ai appris l\'espagnol en 6 mois',
        slug: 'comment-jai-appris-espagnol-6-mois',
        content: `## Mon parcours d'apprentissage\n\nQuand j'ai décidé d'apprendre l'espagnol, je me suis fixé un objectif ambitieux : **tenir une conversation de 30 minutes** en 6 mois.\n\n### Le premier mois : Les bases\n\nJ'ai utilisé Duolingo pendant 30 minutes par jour pour les bases grammaticales. En parallèle, j'écoutais des podcasts en espagnol simplifié.\n\n### Mois 2-3 : L'immersion\n\nJ'ai changé la langue de mon téléphone en espagnol, commencé à regarder des séries sur Netflix avec sous-titres espagnols, et trouvé un partenaire de langue sur Tandem.\n\n### Mois 4-6 : La pratique active\n\nJ'ai pris des cours sur Italki (2x par semaine) et commencé à écrire un journal en espagnol. Les erreurs sont devenues mes meilleurs professeurs.\n\n### Le résultat\n\nAu bout de 6 mois, j'ai pu tenir ma conversation de 30 minutes. Pas parfaitement, mais **de manière fluide et naturelle**.`,
        language: 'fr',
        tags: ['espagnol', 'témoignage', 'immersion'],
        status: 'published',
      },
    ];

    await Post.insertMany(
      posts.map((p) => ({ ...p, author: seedUser._id }))
    );
    console.log(`Seeded ${posts.length} posts`);
  } else {
    console.log(`Posts already exist (${existingPosts}), skipping`);
  }

  console.log('Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
