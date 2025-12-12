export interface GenerateQuestionParams {
    language: string;
    difficulty: number; // 1-100
    previousConcepts?: string[];
    wasLastCorrect?: boolean;
}

export function buildQuestionPrompt(params: GenerateQuestionParams): string {
    const { language, difficulty, previousConcepts, wasLastCorrect } = params;

    // Map 1-100 score to difficulty description
    const difficultyLevel =
        difficulty <= 20 ? 'beginner (basic syntax, simple variables)' :
            difficulty <= 40 ? 'easy (simple functions, basic control flow)' :
                difficulty <= 60 ? 'medium (intermediate concepts, basic algorithms)' :
                    difficulty <= 80 ? 'hard (advanced concepts, complex logic)' :
                        'expert (edge cases, performance optimization, advanced patterns)';

    const adjustmentGuidance = wasLastCorrect === true
        ? 'Make this slightly harder than the previous question.'
        : wasLastCorrect === false
            ? 'Make this slightly easier to rebuild confidence.'
            : 'Start at an appropriate difficulty level.';

    const conceptGuidance = previousConcepts?.length
        ? `Avoid repeating these concepts too directly: ${previousConcepts.join(', ')}. Introduce new related concepts.`
        : 'Choose fundamental concepts appropriate for the difficulty level.';

    return `You are an expert ${language} programming instructor. Generate a code comprehension question.

Difficulty: ${difficultyLevel} (Score: ${difficulty}/100)
${adjustmentGuidance}
${conceptGuidance}

Return a JSON object with this exact structure:
{
  "code_snippet": "// Well-commented, properly formatted ${language} code (5-20 lines)",
  "question": "What will this code output? Or: What does line X do? Or: What is the value of variable Y?",
  "correct_answer": "The exact correct answer (concise, specific)",
  "explanation": "Why this is the answer (educational, 2-3 sentences)",
  "concepts": ["concept1", "concept2"], // Array of programming concepts covered
  "difficulty_score": ${difficulty} // The actual difficulty (confirm or adjust by ±2)
}

CRITICAL RULES:
1. Code must be syntactically correct and runnable
2. Question must have ONE unambiguous correct answer
3. Avoid trick questions or overly obscure language features
4. Use realistic code examples, not contrived scenarios
5. Include helpful comments in code for beginner/easy levels
6. For medium/hard/expert: include edge cases, async patterns, or optimization challenges
7. Answer should be testable (exact output, exact value, or clear explanation)
8. Concepts array should have 1-3 items (e.g., ["loops", "array methods", "closures"])

Example for JavaScript beginner (score 15):
{
  "code_snippet": "let x = 5;\\nlet y = 10;\\nlet sum = x + y;\\nconsole.log(sum);",
  "question": "What will be logged to the console?",
  "correct_answer": "15",
  "explanation": "The code adds x (5) and y (10) together, storing the result (15) in sum, then logs it.",
  "concepts": ["variables", "arithmetic", "console.log"],
  "difficulty_score": 15
}

Now generate a question for ${language} at difficulty ${difficulty}.`;
}

export function buildAnswerCheckPrompt(
    question: string,
    correctAnswer: string,
    userAnswer: string
): string {
    return `You are evaluating a student's answer to a programming question.

Question: ${question}
Expected Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Determine if the student's answer is correct. Be lenient with formatting/capitalization, but strict on technical accuracy.

Return JSON:
{
  "is_correct": true or false,
  "feedback": "Encouraging feedback explaining why the answer is right/wrong",
  "hint": "If wrong, provide a helpful hint without giving away the answer"
}

Examples:
- "15" vs "15.0" → correct (equivalent)
- "fifteen" vs "15" → incorrect (must match format unless question allows text)
- "Hello World" vs "hello world" → correct (case-insensitive for strings unless specified)
- Missing semicolon in expected output → incorrect (syntax matters)`;
}
