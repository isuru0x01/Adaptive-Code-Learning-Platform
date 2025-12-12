import openrouter from './client';
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
    const prompt = buildQuestionPrompt(params);

    try {
        const response = await openrouter.chat.completions.create({
            model: 'openai/gpt-oss-120b:free', // or 'openai/gpt-4-turbo'
            messages: [
                {
                    role: 'system',
                    content: 'You are a programming education expert. Always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            // Note: Free models don't support response_format
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('Empty response from LLM');

        // Extract JSON from response (free models may wrap it in markdown)
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
            jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } else if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/```\n?/g, '').trim();
        }

        const parsed = JSON.parse(jsonContent);
        const validated = QuestionSchema.parse(parsed);

        return validated;
    } catch (error) {
        console.error('LLM generation error:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        throw new Error('Failed to generate question. Please try again.');
    }
}

export async function checkAnswer(
    question: string,
    correctAnswer: string,
    userAnswer: string
): Promise<AnswerCheck> {
    const prompt = buildAnswerCheckPrompt(question, correctAnswer, userAnswer);

    try {
        const response = await openrouter.chat.completions.create({
            model: 'openai/gpt-oss-120b:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are a fair and encouraging programming teacher. Always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3, // Lower for consistency
            max_tokens: 500,
            // Note: Free models don't support response_format
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('Empty response from LLM');

        // Extract JSON from response (free models may wrap it in markdown)
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
            jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } else if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/```\n?/g, '').trim();
        }

        const parsed = JSON.parse(jsonContent);
        const validated = AnswerCheckSchema.parse(parsed);

        return validated;
    } catch (error) {
        console.error('Answer check error:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        throw new Error('Failed to check answer. Please try again.');
    }
}
