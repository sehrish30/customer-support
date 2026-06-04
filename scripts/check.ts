import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error, count } = await supabase
  .from('documents')
  .select('id, metadata, content', { count: 'exact' });

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log(`Total documents: ${count}\n`);
(data ?? []).forEach((d, i) => {
  console.log(`[${i + 1}] ${d.metadata.topic} — ${String(d.content).slice(0, 70)}...`);
});
