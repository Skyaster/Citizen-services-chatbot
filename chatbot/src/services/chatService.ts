// Chat Service - Main chat processing logic

import type { Message, ConversationContext, StructuredData } from '../types';
import { sendToGemini, hasValidApiKey } from './geminiService';
import { createGrievance, getGrievance } from './grievanceService';
import { getApplication } from './applicationService';
import { getBill, formatBillDetails, generatePaymentLink } from './billService';
import { generateMessageId, parseStructuredData } from '../utils/helpers';
import { WELCOME_MESSAGE } from '../utils/prompts';

export interface ChatState {
    messages: Message[];
    context: ConversationContext;
    isTyping: boolean;
}

// Helper types
interface ActionResult {
    type: 'grievance_created' | 'application_created' | 'bill_found' | 'status_fetched';
    success: boolean;
    data?: Record<string, unknown>;
    message?: string;
}

/**
 * Get status emoji based on status string
 */
function getStatusEmoji(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('new') || statusLower.includes('pending')) return '🔵';
    if (statusLower.includes('progress') || statusLower.includes('review')) return '🟡';
    if (statusLower.includes('resolved') || statusLower.includes('approved') || statusLower.includes('closed')) return '🟢';
    if (statusLower.includes('rejected')) return '🔴';
    return '⚪';
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

function shouldExecuteAction(data: Record<string, string>, context?: ConversationContext): boolean {
    if (data.type === 'grievance' && data.category && data.description && (data.area || data.location)) {
        // Validation: Must have at least one attachment for grievances
        const attachments = context?.collectedData?.attachments || [];
        return attachments.length > 0;
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
                        landmark: data.landmark,
                        attachments: (data as any).attachments
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
 * Process user message and generate bot response
 */
export async function processMessage(
    userMessage: string,
    currentMessages: Message[],
    context: ConversationContext
): Promise<{ botMessage: Message; newContext: ConversationContext; action?: ActionResult }> {

    // Check for attachment in user message
    let attachmentData = null;
    let cleanUserMessage = userMessage;

    if (userMessage.startsWith('[ATTACHMENT:')) {
        // Parse format: [ATTACHMENT: type] base64 | filename | size
        const matches = userMessage.match(/\[ATTACHMENT: (\w+)\] (.*?) \| (.*?)($| \| (.*))/);
        if (matches) {
            const [_, type, url, name, __, sizeStr] = matches;
            attachmentData = {
                id: generateMessageId(),
                type,
                url,
                name,
                size: sizeStr ? parseFloat(sizeStr) : 0
            };

            // Reformat message for display
            cleanUserMessage = `${type === 'document' ? '📄' : (type === 'video' ? '🎥' : '📷')} Sent ${type}: ${name}`;
        }
    }

    // Get response from Gemini or demo mode
    // We pass the clean message to Gemini so it understands the user sent a file
    const response = await sendToGemini(cleanUserMessage, currentMessages, context);

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

    // If we have an attachment, add it to collectedData
    if (attachmentData) {
        const existingAttachments = newContext.collectedData?.attachments || [];
        newContext.collectedData = {
            ...newContext.collectedData,
            attachments: [...existingAttachments, attachmentData]
        };
    }

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
    if (mergedData && shouldExecuteAction(mergedData, newContext)) {
        console.log('Executing action for:', mergedData.type);

        // Pass attachments if creating a grievance
        const actionData = {
            ...mergedData,
            attachments: newContext.collectedData?.attachments
        };

        action = await executeAction(actionData as any);
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
                // Format grievance status
                if (action.data.grievance) {
                    const g = action.data.grievance as Record<string, unknown>;
                    const statusEmoji = getStatusEmoji(g.status as string);
                    const createdDate = g.created_at ? new Date(g.created_at as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

                    botMessage.content = `🔍 *Grievance Status: ${g.grievance_id}*

📋 *Category:* ${g.category || 'General'}${g.subcategory ? ' / ' + g.subcategory : ''}
📍 *Location:* ${g.location || 'Not specified'}
📅 *Filed on:* ${createdDate}

*Current Status:* ${statusEmoji} ${g.status}
${g.assigned_department ? `*Assigned to:* ${g.assigned_department}` : ''}
${g.notes ? `\n*Notes:* ${g.notes}` : ''}

_Data from VMC database_`;
                }
                // Format application status
                if (action.data.application) {
                    const a = action.data.application as Record<string, unknown>;
                    const statusEmoji = getStatusEmoji(a.status as string);
                    const createdDate = a.created_at ? new Date(a.created_at as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
                    const details = (a.details as Record<string, unknown>) || {};

                    botMessage.content = `🔍 *Application Status: ${a.application_id}*

📋 *Type:* ${(a.subtype as string)?.replace(/_/g, ' ') || a.type}
👤 *Applicant:* ${details.applicant_name || 'Not specified'}
📅 *Applied on:* ${createdDate}

*Current Status:* ${statusEmoji} ${a.status}

_Data from VMC database_`;
                }
            }
        } else if (action && !action.success) {
            if (mergedData?.type === 'status_query') {
                // Handle not found case for status
                const id = mergedData.grievance_id || mergedData.application_id;
                botMessage.content = `❌ *Request Not Found*

We couldn't find any record with ID: **${id}**

Please check:
• The ID is correct (e.g., GR12345 or APP12345)
• You received this ID when filing your request

If you recently filed a complaint, it may take a few minutes to appear in the system.`;
            } else if (mergedData?.type === 'bill') {
                // Handle bill not found
                const consumerNumber = mergedData.consumer_number;
                botMessage.content = `❌ *Bill Not Found*

We couldn't find any bill details for Consumer Number: **${consumerNumber}**

Please check:
• The Consumer Number is correct
• You have selected the correct service (Property Tax / Water Tax)

Try entering the number again or contact VMC support.`;
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

/**
 * Check if API is configured
 */
export function isApiConfigured(): boolean {
    return hasValidApiKey;
}
