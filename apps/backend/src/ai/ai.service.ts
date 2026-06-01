import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private readonly logger = new Logger(AiService.name);

    constructor(private readonly configService: ConfigService) {
        // If the API key is missing, don't crash the server, just log a warning
        const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';

        // Debug logging for API key
        if (apiKey) {
            const masked = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : '****';
            this.logger.log(`GEMINI_API_KEY loaded: ${masked} (Length: ${apiKey.length})`);
        } else {
            this.logger.warn('GEMINI_API_KEY is not defined. AI features will fail gracefully.');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Generates a 3-sentence summary of an inspection report
     */
    async generateInspectionSummary(checklistResponses: any[], observations: any[]): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            return 'AI Summary unavailable due to missing API key.';
        }

        try {
            const prompt = `
        You are an expert industrial inspector. Summarize the following inspection data into a concise, professional 3-sentence summary indicating the overall compliance status and key risk areas.
        
        Checklist Data: ${JSON.stringify(checklistResponses)}
        Observations: ${JSON.stringify(observations)}
      `;

            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            this.logger.error('Failed to generate inspection summary', error);
            return 'An error occurred while generating the AI summary.';
        }
    }

    /**
     * Helper to convert local file or buffer to GenerativePart
     */
    private bufferToGenerativePart(buffer: Buffer, mimeType: string) {
        return {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType,
            },
        };
    }

    /**
     * Analyzes an uploaded image to verify if it contains evidence for a specific checklist requirement.
     */
    async verifyEvidenceImage(
        imageBuffer: Buffer,
        mimeType: string,
        checklistQuestion: string,
    ): Promise<{ isValid: boolean; reason: string }> {
        if (!process.env.GEMINI_API_KEY) {
            return { isValid: true, reason: 'AI Validation skipped. Missing API key.' };
        }

        try {
            const prompt = `
        You are an AI compliance validator. The user uploaded this image as evidence for the checklist requirement: "${checklistQuestion}".
        Does this image show valid evidence for this requirement? 
        Respond in strict JSON format exactly like this, no markdown formatting around it:
        { "isValid": true/false, "reason": "short explanation" }
      `;

            const imagePart = this.bufferToGenerativePart(imageBuffer, mimeType);
            const result = await this.model.generateContent([prompt, imagePart]);

            const responseText = result.response.text();
            // Parse the JSON output from Gemini
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                return { isValid: false, reason: 'Could not parse AI response: ' + responseText };
            }
        } catch (error) {
            this.logger.error('Failed to verify evidence image', error);
            return { isValid: true, reason: 'AI Verification encountered an error. Proceeding manually.' }; // Graceful fallback
        }
    }

    /**
     * Generates observation drafts from non-compliant checklist responses.
     * Returns an array of { observationText, severity, relatedChecklistItem }.
     */
    async generateObservations(
        nonCompliantItems: Array<{
            checklistItemId: number;
            question: string;
            response: string;
            remarks?: string;
        }>
    ): Promise<Array<{ observationText: string; severity: string; relatedChecklistItem: number }>> {
        if (!process.env.GEMINI_API_KEY) {
            return nonCompliantItems.map(item => ({
                observationText: `Non-compliance observed: ${item.question}`,
                severity: 'MAJOR',
                relatedChecklistItem: item.checklistItemId,
            }));
        }

        try {
            const prompt = `
You are an expert industrial compliance inspector drafting formal observations for a government inspection report.

Based on the following non-compliant checklist findings, generate a professional observation for EACH item.
For each observation, provide:
- "observationText": A clear, formal, 1-2 sentence observation describing the non-compliance finding. Be specific and actionable.
- "severity": One of "CRITICAL", "MAJOR", or "MINOR" based on the nature of the non-compliance.
- "relatedChecklistItem": The checklistItemId number from the input.

Non-Compliant Findings:
${JSON.stringify(nonCompliantItems, null, 2)}

Respond ONLY with a valid JSON array, no markdown formatting:
[{ "observationText": "...", "severity": "...", "relatedChecklistItem": ... }]
            `;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.map((item: any) => ({
                    observationText: item.observationText || `Non-compliance observed for item ${item.relatedChecklistItem}`,
                    severity: ['CRITICAL', 'MAJOR', 'MINOR'].includes(item.severity) ? item.severity : 'MAJOR',
                    relatedChecklistItem: item.relatedChecklistItem,
                }));
            }

            this.logger.warn('Could not parse AI observation response: ' + responseText);
            return nonCompliantItems.map(item => ({
                observationText: `Non-compliance observed: ${item.question}`,
                severity: 'MAJOR',
                relatedChecklistItem: item.checklistItemId,
            }));
        } catch (error) {
            this.logger.error('Failed to generate AI observations', error);
            return nonCompliantItems.map(item => ({
                observationText: `Non-compliance observed: ${item.question}`,
                severity: 'MAJOR',
                relatedChecklistItem: item.checklistItemId,
            }));
        }
    }

    /**
     * Generates a recommendation / final remarks text from checklist responses.
     * Provides a professional inspection summary with findings and actionable recommendations.
     */
    async generateRecommendation(
        checklistItems: Array<{
            question: string;
            response: string;
            remarks?: string;
        }>,
        unitName?: string
    ): Promise<string> {
        const nonCompliant = checklistItems.filter(i => i.response === 'NON_COMPLIANT' || i.response === 'PARTIALLY_COMPLIANT');
        const compliant = checklistItems.filter(i => i.response === 'COMPLIANT');
        const totalItems = checklistItems.length;

        const defaultDetailedFallback = `Inspection of ${unitName || 'the unit'} completed. Out of ${totalItems} items checked, ${compliant.length} were compliant and ${nonCompliant.length} non-compliant findings were identified. Key issues include: ${nonCompliant.map(i => i.question + (i.remarks ? ` (${i.remarks})` : '')).join('; ')}. Immediate corrective action is recommended for all non-compliant findings to ensure full regulatory compliance.`;

        if (!process.env.GEMINI_API_KEY) {
            return defaultDetailedFallback;
        }

        try {
            const prompt = `
You are a senior government inspector writing the "Recommendation / Final Remarks" section of an official inspection report${unitName ? ` for unit: ${unitName}` : ''}.

Based on the following checklist responses, write a highly professional, detailed, and actionable recommendation report (2-3 paragraphs).

Context:
- Total Items Checked: ${totalItems}
- Compliant Items: ${compliant.length}
- Non-Compliant Items: ${nonCompliant.length}

Detailed Findings:
${JSON.stringify(checklistItems, null, 2)}

Instructions:
1. Start with a clear summary of the inspection scope and overall compliance standing.
2. For ANY non-compliant items, provide a technical summary of the violation and its potential impact.
3. Conclude with specific, actionable steps the establishment must take (e.g., "Corrective actions must be completed within 15 days," or "The unit is recommended for approval subject to fixing minor issues").
4. Use a formal, authoritative, yet supportive tone.
5. Write ONLY the body text. Do not include "Subject:", "Report:", or any headers. Wrap it into professional prose.

The user currently finds the output "too generic", so please be as specific and descriptive as possible based on the checklist remarks and questions provided.
            `;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text().trim();
            // Remove any markdown formatting if AI added it
            return responseText.replace(/[*#]/g, '').trim();
        } catch (error) {
            this.logger.error('Failed to generate AI recommendation', error);
            return defaultDetailedFallback;
        }
    }

    /**
     * Handles a chat conversation with the AI for the Investor portal.
     * Keeps track of history and injects background context.
     */
    async chat(message: string, history: Array<{ role: string; text: string }> = [], context: string = ''): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            return 'AI Chat is currently unavailable due to missing API key.';
        }

        try {
            const systemInstruction = `You are the Uttarakhand State Compliance Assistant for investors. Answer questions related to Labour laws, Factory setups, Pollution Control (PCB), and Fire Safety. Be concise, professional, and helpful. If asked about unrelated topics, politely decline.
${context ? `\nUser Context: ${context}` : ''}`;

            const chatModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction });

            // Gemini SDK requires the first history item to be 'user'.
            // If the history starts with a 'model' greeting, we strip it out.
            let validHistory = history;
            if (validHistory.length > 0 && validHistory[0].role !== 'user') {
                validHistory = validHistory.slice(1);
            }

            const geminiHistory = validHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }));

            const chatData = chatModel.startChat({
                history: geminiHistory,
            });

            const result = await chatData.sendMessage(message);
            return result.response.text();
        } catch (error) {
            this.logger.error('Failed to process AI chat message', error);
            return 'I am currently unable to process your request. Please try again later.';
        }
    }

    /**
     * Enterprise-Grade Checklist Generator using Native Gemini Multimodal PDF Processing
     */
    async generateEnterpriseChecklist(pdfBuffer: Buffer, mimeType: string, steeringInstructions?: string): Promise<any[]> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('AI Checklist Generation requires a valid GEMINI_API_KEY');
        }

        try {
            const prompt = `
            You are an Elite Regulatory Compliance Auditor for industrial safety. 
            Analyze the attached policy document and extract actionable inspection checklist items.
            
            ${steeringInstructions ? `CRITICAL FOCUS INSTRUCTIONS FROM ADMIN: "${steeringInstructions}" \nOnly extract items relevant to this focus.` : ''}

            Output strictly as a JSON array of objects with exactly these keys:
            - "title": (string) The actionable requirement to check. Keep it concise.
            - "type": (string) Must be exactly one of: "BOOLEAN", "DOCUMENT", or "PHOTO". Choose based on what evidence best proves compliance.
            - "isMandatory": (boolean) true if the text says 'shall' or 'must', false if it says 'should' or 'may'.
            - "description": (string) MUST START WITH exact citation like "[Source: Page X, Clause Y]". Then provide a brief context.
            - "riskIndicator": (string) Must be exactly one of: "HIGH", "MEDIUM", or "LOW" based on severity of non-compliance.

            Do not wrap the JSON in markdown code blocks. Just return the raw JSON array.
            `;

            const pdfPart = this.bufferToGenerativePart(pdfBuffer, mimeType);
            
            // For complex PDFs, we use the standard generateContent which can handle inline documents
            const result = await this.model.generateContent([prompt, pdfPart]);
            
            const responseText = result.response.text();
            
            // Extract JSON array from response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                this.logger.error('Failed to parse JSON from Gemini response', responseText);
                throw new Error('AI returned invalid format');
            }
        } catch (error) {
            this.logger.error('Error generating enterprise checklist from PDF', error);
            throw error;
        }
    }
}
