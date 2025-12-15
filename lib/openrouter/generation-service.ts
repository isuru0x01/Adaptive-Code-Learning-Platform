import openrouter from './client';
import groq from '../groq/client';
import { buildQuestionPrompt, buildAnswerCheckPrompt } from './prompts';
import { z } from 'zod';

// Zod schemas for validation
const QuestionSchema = z.object({
    code_snippet: z.string().min(10),
    question: z.string().min(10),
    correct_answer: z.string().min(1),
    explanation: z.string().min(20),
    concepts: z.array(z.string()).min(1).max(5),
    difficulty_score: z.number().int().min(1).max(100),
});

const AnswerCheckSchema = z.object({
    is_correct: z.boolean(),
    feedback: z.string().min(10),
    hint: z.string().optional(),
});

export type GeneratedQuestion = z.infer<typeof QuestionSchema>;
export type AnswerCheck = z.infer<typeof AnswerCheckSchema>;

export async function generateQuestion(params: {
    language: string;
    difficulty: number;
    previousConcepts?: string[];
    wasLastCorrect?: boolean;
}): Promise<GeneratedQuestion> {
    console.log('🤖 [LLM] Generating question with params:', params);

    const prompt = buildQuestionPrompt(params);
    console.log('📝 [LLM] Prompt built, length:', prompt.length);

    const messages = [
        {
            role: 'system' as const,
            content: 'You are a programming education expert. Always respond with valid JSON.',
        },
        {
            role: 'user' as const,
            content: prompt,
        },
    ];

    // Try OpenRouter first
    try {
        console.log('🌐 [LLM] Attempting OpenRouter API...');
        const response = await openrouter.chat.completions.create({
            model: 'mistralai/devstral-2512:free',
            messages,
            temperature: 0.7,
            max_tokens: 1000,
        });

        console.log('✅ [LLM] OpenRouter API response received');
        return await parseAndValidateResponse(response.choices[0].message.content);

    } catch (openrouterError) {
        console.error('⚠️ [LLM] OpenRouter failed:', openrouterError);
        console.error('⚠️ [LLM] Error type:', openrouterError?.constructor?.name);

        // Check if it's a rate limit error
        const isRateLimit = openrouterError?.constructor?.name === 'RateLimitError' ||
            (openrouterError instanceof Error && openrouterError.message.includes('429'));

        if (isRateLimit) {
            console.log('🔄 [LLM] Rate limit detected, falling back to Groq...');
        } else {
            console.log('🔄 [LLM] OpenRouter error, trying Groq as fallback...');
        }

        // Fallback to Groq
        try {
            console.log('🌐 [LLM] Attempting Groq API...');
            const groqResponse = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile', // Fast and reliable Groq model
                messages,
                temperature: 0.7,
                max_tokens: 1000,
            });

            console.log('✅ [LLM] Groq API response received (fallback successful)');
            return await parseAndValidateResponse(groqResponse.choices[0].message.content);

        } catch (groqError) {
            console.error('❌ [LLM] Groq fallback also failed:', groqError);
            console.error('❌ [LLM] Both providers failed. Original OpenRouter error:', openrouterError);
            throw new Error('Failed to generate question. Both LLM providers are unavailable.');
        }
    }
}

// Helper function to parse and validate LLM response
async function parseAndValidateResponse(content: string | null): Promise<GeneratedQuestion> {
    if (!content) {
        console.error('❌ [LLM] Empty response from LLM');
        throw new Error('Empty response from LLM');
    }

    console.log('📄 [LLM] Response content length:', content.length);
    console.log('📄 [LLM] Response preview:', content.substring(0, 200) + '...');

    // Extract JSON from response (models may wrap it in markdown)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
        console.log('🔧 [LLM] Removing JSON markdown wrapper');
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonContent.startsWith('```')) {
        console.log('🔧 [LLM] Removing generic markdown wrapper');
        jsonContent = jsonContent.replace(/```\n?/g, '').trim();
    }

    console.log('🔍 [LLM] Parsing JSON...');
    const parsed = JSON.parse(jsonContent);
    console.log('✅ [LLM] JSON parsed successfully');

    console.log('🔍 [LLM] Validating with schema...');
    const validated = QuestionSchema.parse(parsed);
    console.log('✅ [LLM] Question validated successfully');

    return validated;
}

export async function checkAnswer(
    question: string,
    correctAnswer: string,
    userAnswer: string
): Promise<AnswerCheck> {
    const prompt = buildAnswerCheckPrompt(question, correctAnswer, userAnswer);

    const messages = [
        {
            role: 'system' as const,
            content: 'You are a fair and encouraging programming teacher. Always respond with valid JSON.',
        },
        {
            role: 'user' as const,
            content: prompt,
        },
    ];

    // Try OpenRouter first
    try {
        console.log('🌐 [LLM] Checking answer via OpenRouter...');
        const response = await openrouter.chat.completions.create({
            model: 'mistralai/devstral-2512:free',
            messages,
            temperature: 0.3, // Lower for consistency
            max_tokens: 500,
        });

        console.log('✅ [LLM] OpenRouter answer check response received');
        return await parseAndValidateAnswerCheck(response.choices[0].message.content);

    } catch (openrouterError) {
        console.error('⚠️ [LLM] OpenRouter answer check failed:', openrouterError);

        // Fallback to Groq
        try {
            console.log('🔄 [LLM] Falling back to Groq for answer check...');
            const groqResponse = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.3,
                max_tokens: 500,
            });

            console.log('✅ [LLM] Groq answer check response received (fallback successful)');
            return await parseAndValidateAnswerCheck(groqResponse.choices[0].message.content);

        } catch (groqError) {
            console.error('❌ [LLM] Both providers failed for answer check');
            throw new Error('Failed to check answer. Both LLM providers are unavailable.');
        }
    }
}

// Helper function to parse and validate answer check response
async function parseAndValidateAnswerCheck(content: string | null): Promise<AnswerCheck> {
    if (!content) {
        throw new Error('Empty response from LLM');
    }

    // Extract JSON from response
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonContent);
    const validated = AnswerCheckSchema.parse(parsed);

    return validated;
}
