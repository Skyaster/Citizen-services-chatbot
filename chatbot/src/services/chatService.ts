// Chat Service - Main chat processing logic

import type { Message, ConversationContext, StructuredData } from '../types';
import { sendToGemini, hasValidApiKey } from './geminiService';
import { createGrievance, getGrievance } from './grievanceService';
import { createApplication, getApplication } from './applicationService';
import { getBill, formatBillDetails, generatePaymentLink } from './billService';
import { generateMessageId, parseStructuredData } from '../utils/helpers';
import { WELCOME_MESSAGE } from '../utils/prompts';

export interface ChatState {
    messages: Message[];
    context: ConversationContext;
    isTyping: boolean;
}

/**
 * Process user message and generate bot response
 */
export async function processMessage(
    userMessage: string,
    currentMessages: Message[],
    context: ConversationContext
): Promise<{ botMessage: Message; newContext: ConversationContext; action?: ActionResult }> {

    // Get response from Gemini or demo mode
    const response = await sendToGemini(userMessage, currentMessages, context);

    // Parse any structured data
    const { message: cleanMessage, structuredData } = parseStructuredData(response.message);
    const finalMessage = cleanMessage || response.message;

    // Merge structured data
    const mergedData = {
        ...response.structuredData,
        ...structuredData
    };

    // Create bot message
    const botMessage: Message = {
        id: generateMessageId(),
        content: finalMessage,
        sender: 'bot',
        timestamp: new Date(),
        status: 'delivered',
        structuredData: mergedData as StructuredData | undefined
    };

    // Update context based on collected data
    const newContext: ConversationContext = {
        ...context,
        collectedData: {
            ...context.collectedData,
            ...mergedData
        }
    };

    // Detect flow from response
    if (mergedData?.type) {
        newContext.currentFlow = getFlowFromType(mergedData.type);
    }

    // Detect and persist language preference
    if (mergedData?.language) {
        newContext.language = mergedData.language as 'en' | 'hi' | 'hinglish';
    }

    // Execute any required actions based on structured data
    let action: ActionResult | undefined;
    console.log('Merged Data:', mergedData);
    if (mergedData && shouldExecuteAction(mergedData)) {
        console.log('Executing action for:', mergedData.type);
        action = await executeAction(mergedData);
        console.log('Action Result:', action);

        if (action && action.success && action.data) {
            // Append action result to bot message
            if (action.type === 'bill_found') {
                botMessage.content += `\n\n${action.data.details}`;
                if (action.data.paymentLink) {
                    botMessage.content += `\n\n[Pay Now](${action.data.paymentLink})`;
                }
            } else if (action.type === 'grievance_created') {
                botMessage.content += `\n\n✅ Complaint Registered!\nYour Grievance ID is: **${action.data.grievance_id}**\n\nWe will update you soon.`;
            } else if (action.type === 'status_fetched') {
                // Status is typically handled by the LLM, but if we fetched raw data, we could append it.
                // For now, let's leave status as is or append if needed.
                if (action.data.grievance || action.data.application) {
                    botMessage.content += `\n\n(Status details fetched)`;
                }
            }
        }
    }

    return { botMessage, newContext, action };
}

/**
 * Get welcome message
 */
export function getWelcomeMessage(): Message {
    return {
        id: generateMessageId(),
        content: WELCOME_MESSAGE,
        sender: 'bot',
        timestamp: new Date(),
        status: 'delivered'
    };
}

/**
 * Create user message object
 */
export function createUserMessage(content: string): Message {
    return {
        id: generateMessageId(),
        content,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent'
    };
}

// Helper types and functions
interface ActionResult {
    type: 'grievance_created' | 'application_created' | 'bill_found' | 'status_fetched';
    success: boolean;
    data?: Record<string, unknown>;
    message?: string;
}

function getFlowFromType(type: string): ConversationContext['currentFlow'] {
    switch (type) {
        case 'grievance': return 'grievance';
        case 'application': return 'certificate';
        case 'bill': return 'bill_payment';
        case 'status_query': return 'status_tracking';
        default: return 'idle';
    }
}

function shouldExecuteAction(data: Record<string, string>): boolean {
    // Check if we have enough data to execute an action
    if (data.type === 'grievance' && data.category && data.description && (data.area || data.location)) {
        return true;
    }
    if (data.type === 'status_query' && (data.grievance_id || data.application_id)) {
        return true;
    }
    if (data.type === 'bill' && data.consumer_number) {
        return true;
    }
    return false;
}

async function executeAction(data: Record<string, string>): Promise<ActionResult> {
    try {
        switch (data.type) {
            case 'grievance':
                const location = data.area || data.location;
                if (data.category && data.description && location) {
                    const result = await createGrievance({
                        category: data.category,
                        description: data.description,
                        location: location,
                        landmark: data.landmark
                    });
                    return {
                        type: 'grievance_created',
                        success: result.success,
                        data: { grievance_id: result.grievance_id }
                    };
                }
                break;

            case 'status_query':
                if (data.grievance_id) {
                    const grievance = await getGrievance(data.grievance_id);
                    return {
                        type: 'status_fetched',
                        success: !!grievance,
                        data: grievance ? { grievance } : undefined
                    };
                }
                if (data.application_id) {
                    const application = await getApplication(data.application_id);
                    return {
                        type: 'status_fetched',
                        success: !!application,
                        data: application ? { application } : undefined
                    };
                }
                break;

            case 'bill':
                if (data.consumer_number) {
                    const bill = await getBill(data.consumer_number);
                    if (bill) {
                        return {
                            type: 'bill_found',
                            success: true,
                            data: {
                                bill,
                                details: formatBillDetails(bill),
                                paymentLink: generatePaymentLink(bill)
                            }
                        };
                    }
                }
                break;
        }
    } catch (error) {
        console.error('Action execution error:', error);
    }

    return {
        type: 'status_fetched',
        success: false,
        message: 'Unable to complete action'
    };
}

/**
 * Check if API is configured
 */
export function isApiConfigured(): boolean {
    return hasValidApiKey;
}
