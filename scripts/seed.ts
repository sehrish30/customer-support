import 'dotenv/config';
import { embed } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';
import { documents } from './documents.js';

const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!googleApiKey) throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY');
if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');
if (!supabaseKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
const supabase = createClient(supabaseUrl, supabaseKey);

const EMBEDDING_MODEL = 'gemini-embedding-001' as const;
const EMBEDDING_DIMENSIONS = 1536 as const;

async function seed(): Promise<void> {
  console.log('Clearing existing documents...');
  const { error: deleteError } = await supabase.from('documents').delete().gt('id', 0);
  if (deleteError) throw new Error(`Failed to clear documents: ${deleteError.message}`);
  console.log('Cleared.\n');

  console.log(`Embedding and inserting ${documents.length} documents...\n`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]!;
    process.stdout.write(`[${i + 1}/${documents.length}] Embedding: "${doc.metadata['topic']}"... `);

    const { embedding } = await embed({
      model: google.embeddingModel(EMBEDDING_MODEL),
      providerOptions: { google: { outputDimensionality: EMBEDDING_DIMENSIONS } },
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
