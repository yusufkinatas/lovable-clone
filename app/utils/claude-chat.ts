import { ChatAnthropic } from '@langchain/anthropic'

const apiKey = process.env.ANTHROPIC_API_KEY

export const claudeChat = new ChatAnthropic({
  anthropicApiKey: apiKey,
  model: 'claude-3-7-sonnet-latest',
  temperature: 0.1,
})
