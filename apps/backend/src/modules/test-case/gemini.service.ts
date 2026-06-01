import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generate(body: { srsText: string; jsonText: string; testCases: any[]; model?: string }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured on the server.');
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    const { srsText, jsonText, testCases, model } = body;
    if (!srsText || !jsonText || !testCases || !Array.isArray(testCases)) {
      throw new InternalServerErrorException('Invalid request body. srsText, jsonText, and testCases are required.');
    }

    const prompt = `
You are a professional QA Engineer.

Validate the following ${testCases.length} test cases using BOTH:
1. SRS (business requirements / expected behavior)
2. JSON data (actual structure / values / configuration)

SRS Content:
${srsText}

JSON Data:
${jsonText}

Test Cases to Validate:
${JSON.stringify(testCases, null, 2)}

Validation rules:
- First check whether the test case is supported by the SRS requirements.
- Then check whether the JSON supports or contradicts that requirement.
- Mark as Pass only when the test case is reasonably aligned with the SRS and the JSON does not contradict it.
- If the SRS requires something but the JSON is missing the needed field, value, structure, mapping, flag, or condition, mark as Fail.
- If the JSON contains something but the SRS does not support that requirement, mention that clearly.
- Do not assume anything not present in the SRS or JSON.
- Base your decision only on the uploaded SRS and JSON.

Return an array of results in strictly valid JSON format, where each object corresponds to the test case at the same index in the input list.

Each object must have:
- actualResult: A detailed explanation based on both SRS and JSON.
- status: Exactly "Pass" or "Fail".
- testingTime: Estimated time to execute manually in days (e.g., "0.1", "0.5").
- defectId: A unique ID if failed (e.g., "DEF-001"), otherwise empty string.
- severity: "Critical", "High", "Medium", "Low", or "N/A".
- defectType: "Functional", "UI", "Performance", "Security", "Data", or "N/A".
- remarks: Any additional notes or reasons for the status.
`;

    try {
      const SUPPORTED_MODELS = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
      ];
      const DEFAULT_MODEL = 'gemini-2.5-flash';
      const requestedModel = model || DEFAULT_MODEL;
      const modelName = SUPPORTED_MODELS.includes(requestedModel)
        ? requestedModel
        : DEFAULT_MODEL;
      if (modelName !== requestedModel) {
        console.warn(
          `[GeminiService] Requested model "${requestedModel}" is not in the supported list. Falling back to "${DEFAULT_MODEL}".`,
        );
      }
      const modelInstance = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.ARRAY,
            description: 'List of test case validation results',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                actualResult: { type: SchemaType.STRING },
                status: { type: SchemaType.STRING, enum: ['Pass', 'Fail'], format: 'enum' },
                testingTime: { type: SchemaType.STRING },
                defectId: { type: SchemaType.STRING },
                severity: { type: SchemaType.STRING },
                defectType: { type: SchemaType.STRING },
                remarks: { type: SchemaType.STRING },
              },
              required: [
                'actualResult',
                'status',
                'testingTime',
                'defectId',
                'severity',
                'defectType',
                'remarks',
              ],
            },
          },
        },
      });

      const result = await modelInstance.generateContent(prompt);
      const resultText = result.response.text();
      const batchResults = JSON.parse(resultText);
      return { results: batchResults };
    } catch (error: any) {
      console.error('Error generating content from Gemini:', error);
      throw new InternalServerErrorException(error.message || 'Error communicating with Gemini');
    }
  }
}
