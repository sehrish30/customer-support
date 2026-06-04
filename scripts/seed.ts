import 'dotenv/config';
import { embed } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!googleApiKey) throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY');
if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');
if (!supabaseKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
const supabase = createClient(supabaseUrl, supabaseKey);

const EMBEDDING_MODEL = 'gemini-embedding-001' as const;

interface Document {
  content: string;
  metadata: Record<string, string>;
}

const documents: Document[] = [
  {
    content:
      'To reset your password on Acme Learning Hub, go to the login page and click "Forgot Password". Enter your registered email address and you will receive a reset link within 5 minutes. The link expires after 24 hours. If you do not receive the email, check your spam folder or contact support@acmelearning.com.',
    metadata: { category: 'account', topic: 'password-reset' },
  },
  {
    content:
      'Acme Learning Hub offers three subscription plans: Free (access to 50+ courses), Pro ($19/month, unlimited courses + certificates), and Team ($49/month per seat, includes admin dashboard and progress tracking). Annual billing gives you 2 months free on Pro and Team plans.',
    metadata: { category: 'billing', topic: 'pricing-plans' },
  },
  {
    content:
      'To cancel your subscription, go to Account Settings → Billing → Cancel Subscription. Your access continues until the end of the current billing period. We do not offer prorated refunds for mid-cycle cancellations. You can resubscribe at any time without losing your course progress.',
    metadata: { category: 'billing', topic: 'cancellation' },
  },
  {
    content:
      'Course completion certificates are available on Pro and Team plans. After finishing all lessons and passing the final quiz with a score of 70% or higher, a certificate is automatically generated under My Profile → Certificates. Certificates include a unique verification ID and can be shared directly to LinkedIn.',
    metadata: { category: 'courses', topic: 'certificates' },
  },
  {
    content:
      'Acme Learning Hub supports offline access through our mobile app (iOS and Android). On a Pro or Team plan, you can download up to 20 course videos for offline viewing. Downloads expire after 30 days and must be renewed while connected to the internet. Free plan users cannot download content.',
    metadata: { category: 'courses', topic: 'offline-access' },
  },
  {
    content:
      'To join a community discussion forum, navigate to any course page and click the "Community" tab. You can post questions, share notes, and reply to other learners. Community moderators are available Monday–Friday 9am–6pm UTC. Please follow the community guidelines: no spam, no self-promotion, and be respectful.',
    metadata: { category: 'community', topic: 'discussion-forums' },
  },
  {
    content:
      'Acme Learning Hub instructors are vetted professionals. To become an instructor, apply at acmelearning.com/teach. Requirements include a portfolio of prior teaching or industry experience, a sample lesson video, and passing a content review. Instructors earn 60% royalty on course sales and get access to analytics.',
    metadata: { category: 'instructors', topic: 'become-instructor' },
  },
  {
    content:
      'If a course video will not play, try the following steps: (1) Clear your browser cache and reload the page. (2) Disable browser extensions, especially ad blockers. (3) Switch to a supported browser: Chrome, Firefox, or Edge. (4) Check your internet speed — we recommend at least 5 Mbps for HD playback. If the issue persists, report it via Help → Report a Problem.',
    metadata: { category: 'technical', topic: 'video-playback' },
  },
  {
    content:
      'Acme Learning Hub provides a 7-day money-back guarantee on new Pro and Team subscriptions. To request a refund, contact support within 7 days of your first charge with your order ID. Refunds are processed within 5–10 business days back to your original payment method. This policy does not apply to renewals.',
    metadata: { category: 'billing', topic: 'refund-policy' },
  },
  {
    content:
      'The Team plan admin dashboard lets you manage seats, track learner progress, assign courses, and export completion reports as CSV. To add a new team member, go to Admin → Members → Invite. Invited users receive an email to join your workspace. Unused seats can be reassigned at any time without extra charge.',
    metadata: { category: 'teams', topic: 'admin-dashboard' },
  },
  {
    content:
      'Acme Learning Hub integrates with Slack, Notion, and GitHub. The Slack integration sends course reminders and completion notifications to your chosen channel. The Notion integration syncs your course notes automatically. The GitHub integration lets instructors embed live code exercises directly in lessons. All integrations are available on Pro and Team plans.',
    metadata: { category: 'integrations', topic: 'third-party-integrations' },
  },
  {
    content:
      'To change the language or subtitle settings on a course video, click the gear icon (⚙) on the video player and select Subtitles/CC. Over 200 courses offer auto-generated subtitles in English, Spanish, French, Portuguese, and German. You can also adjust playback speed between 0.5× and 2×. Subtitle preferences are saved per course.',
    metadata: { category: 'courses', topic: 'subtitles-language' },
  },
];

async function seed(): Promise<void> {
  console.log(`Embedding and inserting ${documents.length} documents...\n`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i] as Document;
    process.stdout.write(`[${i + 1}/${documents.length}] Embedding: "${doc.metadata['topic']}"... `);

    const { embedding } = await embed({
      model: google.embeddingModel(EMBEDDING_MODEL),
      value: doc.content,
    });

    const { error } = await supabase
      .from('documents')
      .insert({ content: doc.content, metadata: doc.metadata, embedding });

    if (error) {
      console.error(`FAILED\n  Error: ${error.message}`);
    } else {
      console.log('OK');
    }
  }

  console.log('\nSeeding complete.');
}

seed();
