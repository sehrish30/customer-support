import 'dotenv/config';
import { embed } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EMBEDDING_MODEL = 'text-embedding-004';
const BATCH_SIZE = 10;

async function reembed() {
  console.log('Fetching all documents from Supabase...');
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, content');

  if (error) {
    console.error('Failed to fetch documents:', error);
    process.exit(1);
  }

  console.log(`Found ${documents.length} documents. Re-embedding with ${EMBEDDING_MODEL}...`);

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (doc) => {
        const { embedding } = await embed({
          model: google.textEmbeddingModel(EMBEDDING_MODEL),
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
    console.log(`Processed ${Math.min(i + BATCH_SIZE, documents.length)} / ${documents.length}`);
  }

  console.log('Re-embedding complete.');
}

reembed();
