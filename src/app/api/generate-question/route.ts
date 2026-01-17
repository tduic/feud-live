import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface QuestionData {
  question: string;
  answers: Array<{ text: string; points: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a creative Family Feud question generator. Generate fun, funny, and occasionally raunchy Family Feud style questions with survey-style answers.

Each question should be entertaining and engaging, with a good mix of:
- Funny and clever questions
- Slightly inappropriate/raunchy questions (PG-13 level)
- Unexpected twists on everyday topics
- Pop culture references
- Relatable scenarios

CRITICAL REQUIREMENTS - FOLLOW THESE EXACTLY:

1. ANSWERS MUST MAKE SENSE: Every answer must be a logical, reasonable response that a real person would actually give in a survey. Avoid absurd, nonsensical, or impossible answers.

2. POINTS MUST ADD UP TO EXACTLY 100: The points values for all answers combined MUST equal 100. No exceptions. Double-check your math before responding.

3. ANSWERS MUST BE REALISTIC: Base all answers on what real people would actually say in a survey. Think about actual human behavior, common experiences, and realistic responses. While funny and creative, answers should still be grounded in reality and believable as survey responses.

4. ANSWER ORDER: List answers from most popular (highest points) to least popular (lowest points). The most obvious/common answer should have the most points.

Return your response as valid JSON in this exact format:
{
  "question": "The survey question here",
  "answers": [
    {"text": "Answer 1", "points": 45},
    {"text": "Answer 2", "points": 30},
    {"text": "Answer 3", "points": 15},
    {"text": "Answer 4", "points": 7},
    {"text": "Answer 5", "points": 3}
  ]
}

Include 4-6 answers per question. Verify that points add up to exactly 100 before returning your response.`
        },
        {
          role: "user",
          content: "Generate a new Family Feud question that's fun, funny, and maybe a little bit raunchy!"
        }
      ],
      temperature: 1.2,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      return NextResponse.json(
        { error: "No response from OpenAI" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const parsedQuestion = JSON.parse(responseText) as QuestionData;

    // Validate the structure
    if (!parsedQuestion.question || !Array.isArray(parsedQuestion.answers)) {
      return NextResponse.json(
        { error: "Invalid question format from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedQuestion);
  } catch (error) {
    console.error("Error generating AI question:", error);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
