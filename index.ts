import { webSearchRetrievalAgent } from './webSearchRetrievalAgent.js';

const webSearchQuery = 'What is the latest OpenAI flagship model?';

async function main(query: string): Promise<void> {
  const response = await webSearchRetrievalAgent(query);
  console.log(
    `\n\nGenerated answer: ${response.answer}\n\nRetrieval docs: ${
      response.sources ? JSON.stringify(response.sources, null, 2) : null
    }`,
  );
}

main(webSearchQuery);
