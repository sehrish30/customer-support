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

const EMBEDDING_MODEL = 'text-embedding-004' as const;
const BATCH_SIZE = 10;

interface DocumentRow {
  id: string;
  content: string;
}

async function reembed(): Promise<void> {
  console.log('Fetching all documents from Supabase...');
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, content');

  if (error) {
    console.error('Failed to fetch documents:', error);
    process.exit(1);
  }

  const rows = (documents ?? []) as DocumentRow[];
  console.log(`Found ${rows.length} documents. Re-embedding with ${EMBEDDING_MODEL}...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (doc) => {
        const { embedding } = await embed({
          model: google.embeddingModel(EMBEDDING_MODEL),
          value: doc.content,
        });
        const { error: updateError } = await supabase
          .from('documents')
          .update({ embedding })
          .eq('id', doc.id);
        if (updateError) {
          console.error(`Failed to update doc ${doc.id}:`, updateError);
        }
      }),
    );
    console.log(`Processed ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`);
  }

  console.log('Re-embedding complete.');
}

reembed();
