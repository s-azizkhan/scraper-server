/**
 * AI Client for interacting with various AI providers
 * @module ai-client
 */

/**
 * Message structure for AI requests
 * @typedef {Object} Message
 * @property {string} role - Role of the message (system, user, or assistant)
 * @property {string} content - Content of the message
 * @property {Array} [toolCalls] - Optional tool calls
 */
interface Message {
    role: string;
    content: string;
    toolCalls?: Array<any>;
}

/**
 * Request structure for AI providers
 * @typedef {Object} Request
 * @property {string} provider - AI provider (ollama, openai, gemini, grok)
 * @property {string} apiKey - API key for authentication
 * @property {string} modelId - Model identifier
 * @property {Message[]} messages - Array of messages
 * @property {string} [responseType] - Response type (text or json)
 * @property {Object} [responseSchema] - Schema for JSON responses
 * @property {string} [customUrl] - Custom API URL
 * @property {Array} [tools] - Optional tools
 * @property {boolean} [stream] - Enable streaming
 */
interface AIRequest {
    provider: string;
    apiKey: string;
    modelId: string;
    messages: Message[];
    responseType?: string;
    responseSchema?: Object;
    customUrl?: string;
    tools?: Array<any>;
    stream?: boolean;
}

/**
 * Validates a message object
 * @param {Message} message - Message to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateMessage(message: Message): string | null {
    if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
        return 'Invalid message role';
    }
    if (!message.content) {
        return 'Message content is required';
    }
    return null;
}

/**
 * Converts Gemini response to standardized format
 * @param {Object} geminiResponse - Gemini API response
 * @returns {Object} Standardized AI response
 */
function parseGeminiResponse(geminiResponse: any): any {
    if (!geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid Gemini response structure');
    }

    const candidate = geminiResponse.candidates[0];
    return {
        created_at: new Date().toISOString(),
        done: true,
        done_reason: candidate.finishReason,
        eval_count: geminiResponse.usageMetadata?.candidatesTokenCount || 0,
        prompt_eval_count: geminiResponse.usageMetadata?.promptTokenCount || 0,
        eval_duration: 0,
        load_duration: 0,
        prompt_eval_duration: 0,
        total_duration: 0,
        message: {
            content: candidate.content.parts[0].text,
            role: 'assistant'
        },
        model: geminiResponse.modelVersion || ''
    };
}

/**
 * Makes an HTTP request to the AI provider
 * @param {string} url - API endpoint URL
 * @param {string} apiKey - API key
 * @param {Object} body - Request body
 * @param {string} provider - AI provider
 * @returns {Promise<Object>} API response
 */
async function makeRequest(url: string, apiKey: string, body: Object, provider: string): Promise<any> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (provider !== 'gemini') {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Provider error: ${response.status} - ${errorText}`);
    }

    return response.json();
}

/**
 * Builds Gemini contents array
 * @param {Message[]} messages - Input messages
 * @returns {Object[]} Gemini contents
 */
function buildGeminiContents(messages: Message[]): any[] {
    return messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }]
        }));
}

/**
 * Extracts Gemini system instruction
 * @param {Message[]} messages - Input messages
 * @returns {Object[]|null} System instruction parts
 */
function extractGeminiSystemInstruction(messages: Message[]): any[] | null {
    const systemMsg = messages.find(msg => msg.role === 'system');
    return systemMsg ? [{ text: systemMsg.content }] : null;
}

/**
 * Main AI client class
 */
class AIClient {
    /**
     * Calls Ollama provider
     * @param {AIRequest} request - Request configuration
     * @returns {Promise<Object>} Provider response
     */
    private async callOllama(request: AIRequest): Promise<any> {
        const url = request.customUrl || 'http://127.0.0.1:11434/api/chat';
        const body: any = {
            model: request.modelId,
            messages: request.messages,
            stream: request.stream || false
        };

        if (request.responseType === 'json' && request.responseSchema) {
            body.format = request.responseSchema;
            body.stream = false;
        }
        if (request.tools?.length) {
            body.tools = request.tools;
        }

        return makeRequest(url, request.apiKey, body, request.provider);
    }

    /**
     * Calls OpenAI provider
     * @param {AIRequest} request - Request configuration
     * @returns {Promise<Object>} Provider response
     */
    private async callOpenAI(request: AIRequest): Promise<any> {
        const url = request.customUrl || 'https://api.openai.com/v1/chat/completions';
        const body: any = {
            model: request.modelId,
            messages: request.messages,
            stream: request.stream || false
        };

        if (request.responseType === 'json' && request.responseSchema) {
            body.response_format = { type: 'json_object' };
        }
        if (request.tools?.length) {
            body.tools = request.tools;
        }

        return makeRequest(url, request.apiKey, body, request.provider);
    }

    /**
     * Calls Gemini provider
     * @param {AIRequest} request - Request configuration
     * @returns {Promise<Object>} Standardized response
     */
    private async callGemini(request: AIRequest): Promise<any> {
        const url = request.customUrl ||
            `https://generativelanguage.googleapis.com/v1beta/models/${request.modelId}:generateContent?key=${request.apiKey}`;

        const body: any = {
            contents: buildGeminiContents(request.messages)
        };

        const systemParts = extractGeminiSystemInstruction(request.messages);
        if (systemParts) {
            body.systemInstruction = { parts: systemParts };
        }

        if (request.tools?.length) {
            body.tools = request.tools;
        }

        if (request.responseType) {
            const config: any = { responseMimeType: 'text/plain' };
            if (request.responseType === 'json') {
                config.responseMimeType = 'application/json';
                config.responseSchema = request.responseSchema;
            }
            body.generationConfig = config;
        }

        const response = await makeRequest(url, request.apiKey, body, request.provider);
        return parseGeminiResponse(response);
    }

    /**
     * Calls Grok provider
     * @param {AIRequest} request - Request configuration
     * @returns {Promise<Object>} Provider response
     */
    private async callGrok(request: AIRequest): Promise<any> {
        const url = request.customUrl || 'https://api.x.ai/v1/grok';
        const body: any = {
            model: request.modelId,
            messages: request.messages,
            stream: request.stream || false
        };

        if (request.tools?.length) {
            body.tools = request.tools;
        }

        return makeRequest(url, request.apiKey, body, request.provider);
    }

    /**
     * Main method to handle AI provider calls
     * @param {AIRequest} request - Request configuration
     * @returns {Promise<Object>} Provider response
     */
    async chat(request: AIRequest): Promise<any> {
        if (!request.provider || !['ollama', 'openai', 'gemini', 'grok'].includes(request.provider.toLowerCase())) {
            throw new Error('Invalid or unsupported provider');
        }
        if (!request.apiKey) {
            throw new Error('API key is required');
        }
        if (!request.modelId) {
            throw new Error('Model ID is required');
        }
        if (!request.messages?.length) {
            throw new Error('At least one message is required');
        }

        for (const msg of request.messages) {
            const error = validateMessage(msg);
            if (error) {
                throw new Error(error);
            }
        }

        if (request.responseType === 'json' && !request.responseSchema) {
            throw new Error('Response schema required for JSON response type');
        }

        if (request.customUrl) {
            try {
                new URL(request.customUrl);
            } catch {
                throw new Error('Invalid custom URL');
            }
        }

        switch (request.provider.toLowerCase()) {
            case 'ollama':
                return this.callOllama(request);
            case 'openai':
                return this.callOpenAI(request);
            case 'gemini':
                return this.callGemini(request);
            case 'grok':
                return this.callGrok(request);
            default:
                throw new Error('Unsupported provider');
        }
    }
}

export { AIClient };
