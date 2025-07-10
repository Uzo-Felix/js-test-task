class OpenAIService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  async generateSummary(messages) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!messages || messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    // Validate API key format
    if (!this.apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. OpenAI API keys should start with "sk-"');
    }

    const messagesText = messages.map(msg => `${msg.author}: ${msg.text}`).join('\n');
    
    console.log('Making OpenAI API request with:', {
      messageCount: messages.length,
      textLength: messagesText.length,
      hasApiKey: !!this.apiKey,
      apiKeyStart: this.apiKey.substring(0, 7) + '...'
    });
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates brief summaries of chat conversations. Summarize the key points and main topics discussed. Keep the summary concise and informative. Respond in the same language as the chat messages.'
            },
            {
              role: 'user',
              content: `Please summarize this chat conversation:\n\n${messagesText}`
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      console.log('OpenAI API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
          console.error('OpenAI API Error Details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(`OpenAI API Error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('OpenAI API Success:', {
        choices: data.choices?.length,
        usage: data.usage
      });
      
      return data.choices[0]?.message?.content || 'No summary generated';
    } catch (error) {
      console.error('OpenAI API Request Failed:', error);
      
      // Network or fetch errors
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach OpenAI API. Check your internet connection.');
      }
      
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
