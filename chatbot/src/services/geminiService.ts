// Gemini API Service for Natural Language Understanding

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from '../utils/prompts';
import type { Message, ConversationContext } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Check if we have a valid API key
export const hasValidApiKey = API_KEY && API_KEY !== 'your_gemini_api_key_here';

let genAI: GoogleGenerativeAI | null = null;
let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

genAI = new GoogleGenerativeAI(API_KEY);
// Gemini 2.5 Flash (User requested)
model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface ChatResponse {
    message: string;
    structuredData?: Record<string, string>;
}

/**
 * Send a message to Gemini and get a response
 */
export async function sendToGemini(
    userMessage: string,
    conversationHistory: Message[],
    context: ConversationContext
): Promise<ChatResponse> {
    if (!model) {
        // Return demo response if no API key
        return getDemoResponse(userMessage, context);
    }

    try {
        // Build conversation history for context
        const historyText = conversationHistory
            .slice(-10) // Last 10 messages for context
            .map(m => `${m.sender === 'user' ? 'Citizen' : 'Bot'}: ${m.content}`)
            .join('\n');

        const contextText = context.currentFlow
            ? `Current flow: ${context.currentFlow}\nCollected data: ${JSON.stringify(context.collectedData || {})}`
            : '';

        const prompt = `${SYSTEM_PROMPT}

Previous conversation:
${historyText}

${contextText}

Citizen: ${userMessage}

Respond as the helpful government chatbot. Remember to include [STRUCTURED_DATA] block if you've collected enough information for a service request.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse structured data from response
        const { message, structuredData } = parseResponse(response);

        return { message, structuredData };
    } catch (error: any) {
        console.error('Gemini API error, falling back to demo:', error);

        // Fallback to demo response if API fails (404, 429, etc.)
        const demoResponse = getDemoResponse(userMessage, context);

        // Add a small indicator that we are in fallback mode
        // TODO: Re-enable warning message when user requests
        return {
            message: demoResponse.message,
            structuredData: demoResponse.structuredData
        };
    }
}

/**
 * Parse the response to extract structured data
 */
function parseResponse(response: string): ChatResponse {
    const structuredMatch = response.match(/\[STRUCTURED_DATA\]([\s\S]*?)\[\/STRUCTURED_DATA\]/);

    if (structuredMatch) {
        const cleanMessage = response.replace(/\[STRUCTURED_DATA\][\s\S]*?\[\/STRUCTURED_DATA\]/, '').trim();
        const dataLines = structuredMatch[1].trim().split('\n');
        const structuredData: Record<string, string> = {};

        dataLines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim();
                const value = line.slice(colonIndex + 1).trim();
                if (key && value) {
                    structuredData[key] = value;
                }
            }
        });

        return { message: cleanMessage, structuredData };
    }

    return { message: response };
}

/**
 * Get follow-up menu based on language
 */
function getFollowUpMenu(lang: string): string {
    if (lang === 'hi') {
        return `

---
🔄 *कुछ और मदद चाहिए?*

📄 बिल भुगतान | 📝 शिकायत | 📋 प्रमाण पत्र | 🏪 लाइसेंस | ℹ️ VMC जानकारी

जो चाहिए वो टाइप करें!`;
    }
    if (lang === 'hinglish') {
        return `

---
🔄 *Kuch aur help chahiye?*

📄 Bill Payment | 📝 Complaint | 📋 Certificate | 🏪 License | ℹ️ VMC Info

Jo chahiye woh type karein!`;
    }
    return `

---
🔄 *Need anything else?*

📄 Pay Bills | 📝 File Complaint | 📋 Certificates | 🏪 Licenses | ℹ️ VMC Info

Type what you need!`;
}

/**
 * Demo responses when no API key is configured
 */
function getDemoResponse(userMessage: string, context: ConversationContext): ChatResponse {
    const msg = userMessage.toLowerCase().trim();
    const lang = context.language || 'en';

    // 0. Language Selection (First-time users)
    if (!context.language && (msg === '1' || msg === '2' || msg === '3' || msg.includes('english') || msg.includes('hindi') || msg.includes('hinglish'))) {
        let selectedLang: 'en' | 'hi' | 'hinglish' = 'en';
        let confirmMsg = '';

        if (msg === '1' || msg.includes('english')) {
            selectedLang = 'en';
            confirmMsg = `✅ *Language set to English!*

How can I help you today?

📄 *Pay Bills* - Property Tax, Water Tax
📝 *File Complaint* - Roads, Water, Garbage
📋 *Certificates* - Birth, Income, Caste (Info & Links)
🏪 *Licenses* - Shop, Trade, Building (Info & Links)
🔍 *Track Status* - Check your request status
ℹ️ *VMC Info* - Office timings, contacts

Type what you need or choose from above!`;
        } else if (msg === '2' || msg.includes('hindi')) {
            selectedLang = 'hi';
            confirmMsg = `✅ *भाषा हिंदी में सेट हो गई!*

मैं आपकी क्या मदद कर सकता/सकती हूं?

📄 *बिल भुगतान* - प्रॉपर्टी टैक्स, पानी टैक्स
📝 *शिकायत दर्ज करें* - सड़क, पानी, कचरा
📋 *प्रमाण पत्र* - जन्म, आय, जाति (जानकारी और लिंक)
🏪 *लाइसेंस* - दुकान, व्यापार, भवन (जानकारी और लिंक)
🔍 *स्थिति जांचें* - अपनी अर्जी की स्थिति देखें
ℹ️ *VMC जानकारी* - ऑफिस समय, संपर्क

जो चाहिए वो टाइप करें!`;
        } else {
            selectedLang = 'hinglish';
            confirmMsg = `✅ *Language Hinglish mein set ho gayi!*

Main aapki kaise help kar sakta/sakti hoon?

📄 *Bill Payment* - Property Tax, Water Tax
📝 *Complaint Daalein* - Roads, Pani, Kachra
📋 *Certificates* - Birth, Income, Caste (Info aur Links)
🏪 *Licenses* - Dukaan, Trade, Building (Info aur Links)
🔍 *Status Check* - Apni application ka status dekhein
ℹ️ *VMC Info* - Office timing, contacts

Jo chahiye woh type karein!`;
        }

        return {
            message: confirmMsg,
            structuredData: { type: 'info', language: selectedLang }
        };
    }

    // 1. Handle Context-Aware Responses (User is already in a flow)
    if (context.currentFlow === 'bill_payment') {
        const numberMatch = userMessage.match(/\d{5,}/);
        if (numberMatch) {
            const billMsg = lang === 'hi'
                ? `उपभोक्ता नंबर ${numberMatch[0]} के लिए बिल विवरण जांच रहे हैं...`
                : lang === 'hinglish'
                    ? `Consumer Number ${numberMatch[0]} ka bill check kar rahe hain...`
                    : `Checking bill details for Consumer Number: ${numberMatch[0]}...`;
            return {
                message: billMsg,
                structuredData: { type: 'bill', consumer_number: numberMatch[0] }
            };
        }
    }

    if (context.currentFlow === 'grievance' && context.collectedData?.category) {
        // Step 2: Collect Location (if not yet collected)
        if (!context.collectedData.location) {
            const locationMsg = lang === 'hi'
                ? `ठीक है। कृपया समस्या का संक्षिप्त विवरण दें।`
                : lang === 'hinglish'
                    ? `Theek hai. Please issue ka brief description dein.`
                    : `Got it. Please briefly describe the problem.`;

            return {
                message: locationMsg,
                structuredData: {
                    type: 'grievance', // Keep in grievance flow
                    category: context.collectedData.category,
                    location: userMessage // Identify this user message as the location
                }
            };
        }

        // Step 3: Collect Description (if location is present)
        // At this point we have category and location (from context), so this message is the description
        const grievanceMsg = lang === 'hi'
            ? `धन्यवाद। मैंने नोट कर लिया है। आपकी शिकायत प्रोसेस हो रही है...`
            : lang === 'hinglish'
                ? `Thank you. Maine note kar liya hai. Aapki complaint process ho rahi hai...`
                : `Thank you. I've noted that. Processing your complaint...`;

        return {
            message: grievanceMsg,
            structuredData: {
                type: 'grievance',
                category: context.collectedData.category,
                location: context.collectedData.location,
                description: userMessage
            }
        };
    }

    // 2. Keyword Matching (New Flows)
    if (msg.includes('bill') || msg.includes('pay') || msg.includes('bijli') || msg.includes('paani')) {
        if (msg.includes('electricity') || msg.includes('bijli')) {
            return {
                message: `⚡ *Electricity Bill Payment*

I can help you pay your electricity bill.

Please share your *Consumer Number* (found on your bill, usually 10-12 digits).

Example: 1234567890`,
                structuredData: { type: 'bill', category: 'electricity' }
            };
        }
        if (msg.includes('water') || msg.includes('paani')) {
            return {
                message: `💧 *Water Bill Payment*

I can help you pay your water bill.

Please share your *Consumer Number* or *Property ID*.`,
                structuredData: { type: 'bill', category: 'water' }
            };
        }
        return {
            message: `💳 *Bill Payment*

Which bill would you like to pay?

• ⚡ Electricity Bill
• 💧 Water Bill  
• 🏠 Property Tax

Please select or type your choice.`
        };
    }

    // Grievance flow
    if (msg.includes('complaint') || msg.includes('problem') || msg.includes('issue') ||
        msg.includes('grievance') || msg.includes('pothole') || msg.includes('road') ||
        msg.includes('garbage') || msg.includes('kharab') || msg.includes('nahi aa raha')) {

        if (msg.includes('road') || msg.includes('pothole') || msg.includes('sadak')) {
            return {
                message: `🛣️ *Road/Pothole Complaint*

I'm sorry to hear about this issue. I'll help you register a complaint.

Please share:
1. Your *area/ward name*
2. *Nearby landmark* (school, temple, etc.)
3. Brief description of the problem

You can also send a photo of the issue (optional).`,
                structuredData: { type: 'grievance', category: 'roads' }
            };
        }

        if (msg.includes('water') || msg.includes('paani') || msg.includes('supply')) {
            return {
                message: `💧 *Water Supply Complaint*

I understand this is inconvenient. Let me help you register a complaint.

Please share:
1. Your *area/ward name*
2. *Nearby landmark*
3. How long has this been happening?`,
                structuredData: { type: 'grievance', category: 'water_supply' }
            };
        }

        if (msg.includes('garbage') || msg.includes('kachra') || msg.includes('waste')) {
            return {
                message: `🗑️ *Garbage Collection Complaint*

I'll help you report this issue.

Please share:
1. Your *area/ward name*
2. *Street/colony name*
3. How many days since last collection?`,
                structuredData: { type: 'grievance', category: 'garbage' }
            };
        }

        return {
            message: `📝 *File a Complaint*

I'm here to help! What is your complaint about?

• 💧 Water Supply Issues
• 🛣️ Roads / Potholes
• 🗑️ Garbage Collection
• 💡 Street Lights
• 🌊 Drainage / Flooding
• 📌 Other Issue

Please select or describe your problem.`
        };
    }

    // Certificate flow - INFORMATIONAL ONLY
    if (msg.includes('certificate') || msg.includes('birth') || msg.includes('income') ||
        msg.includes('caste') || msg.includes('domicile') || msg.includes('praman patra')) {

        if (msg.includes('birth') || msg.includes('janam')) {
            return {
                message: `👶 *Birth Certificate - VMC Guide*

**How to Apply:**
1. Visit VMC Online Portal or Seva Sadan Office
2. Fill application form (Form No. 1)
3. Submit required documents
4. Pay fee (₹10-50 depending on timing)
5. Collect certificate in 7-15 working days

**Required Documents:**
• Hospital discharge summary / Birth report
• Parents' Aadhaar cards (both)
• Parents' marriage certificate
• Address proof (Ration card / Electricity bill)
• Affidavit (if registration delayed beyond 1 year)

🔗 **Apply Online:** https://vmc.gov.in/citizen-services

📍 **Offline:** Visit your nearest Seva Sadan or Ward Office` + getFollowUpMenu(lang)
            };
        }

        if (msg.includes('income') || msg.includes('aay')) {
            return {
                message: `💰 *Income Certificate - VMC Guide*

**How to Apply:**
1. Visit Digital Gujarat Portal or Mamlatdar Office
2. Fill online application with income details
3. Submit supporting documents
4. Verification by Talati/Circle Officer
5. Certificate issued within 7-15 days

**Required Documents:**
• Aadhaar Card
• Salary slips OR Self-declaration (for self-employed)
• Bank statements (last 6 months)
• Ration Card
• Residence proof

🔗 **Apply Online:** https://digitalgujarat.gov.in

📍 **Note:** Income certificates are issued by Revenue Department (Mamlatdar Office), not VMC directly.` + getFollowUpMenu(lang)
            };
        }

        if (msg.includes('caste') || msg.includes('jati')) {
            return {
                message: `📜 *Caste Certificate - VMC Guide*

**How to Apply:**
1. Visit Digital Gujarat Portal
2. Fill Form with caste/community details
3. Submit required documents
4. Verification by local authorities
5. Certificate issued in 15-30 days

**Required Documents:**
• Aadhaar Card
• Father's/Grandfather's Caste Certificate
• School Leaving Certificate
• Ration Card
• Residence proof
• Affidavit (if no prior proof)

🔗 **Apply Online:** https://digitalgujarat.gov.in

📍 **Note:** Caste certificates are issued by Revenue Department, not VMC.` + getFollowUpMenu(lang)
            };
        }

        return {
            message: `📋 *Certificate Services*

Which certificate information do you need?

• 👶 Birth Certificate
• 💰 Income Certificate
• 📜 Caste Certificate
• 🏡 Domicile Certificate

Type the certificate name for detailed steps and documents required.

🔗 **VMC Portal:** https://vmc.gov.in`
        };
    }

    // Status tracking - fetch real data
    if (msg.includes('status') || msg.includes('track') || msg.match(/gr\d{5}/i) || msg.match(/app\d{5}/i)) {
        const grMatch = msg.match(/gr(\d{5})/i);
        const appMatch = msg.match(/app(\d{5})/i);

        if (grMatch) {
            const id = `GR${grMatch[1]}`;
            // Return structured data to trigger real lookup in chatService
            return {
                message: `🔍 Looking up grievance **${id}**...`,
                structuredData: { type: 'status_query', grievance_id: id }
            };
        }

        if (appMatch) {
            const id = `APP${appMatch[1]}`;
            // Return structured data to trigger real lookup in chatService
            return {
                message: `🔍 Looking up application **${id}**...`,
                structuredData: { type: 'status_query', application_id: id }
            };
        }

        return {
            message: `🔍 *Track Your Request*

Please share your:
• *Grievance ID* (e.g., GR00123) or
• *Application ID* (e.g., APP00456)

You received this ID when you filed your request.`
        };
    }

    // Office info - VMC SPECIFIC
    if (msg.includes('office') || msg.includes('timing') || msg.includes('contact') || msg.includes('phone') || msg.includes('address') || msg.includes('vmc')) {
        return {
            message: `🏛️ *VMC Office Information*

🕐 *Timings:*
Monday to Saturday: 10:30 AM - 6:10 PM
Sunday: Closed

📞 *Contact:*
Helpline: 155303 / 0265-2438888
Control Room: 0265-2428888
Email: commissioner@vmc.gov.in

📍 *Head Office:*
Vadodara Municipal Corporation
Khanderao Market, Raopura, Vadodara - 390001

🔗 **Website:** https://vmc.gov.in

Is there anything specific you'd like to know?` + getFollowUpMenu(lang)
        };
    }

    // License applications - INFORMATIONAL ONLY
    if (msg.includes('license') || msg.includes('permit') || msg.includes('shop') || msg.includes('trade') || msg.includes('building')) {

        if (msg.includes('shop') || msg.includes('business') || msg.includes('dukan')) {
            return {
                message: `🏪 *Shop/Business License - VMC Guide*

**How to Apply:**
1. Visit VMC Online Portal or Zone Office
2. Submit application with required documents
3. Pay applicable fees
4. Inspection by VMC officials
5. License issued within 15-30 days

**Required Documents:**
• Aadhaar Card & PAN Card
• Shop/Business address proof
• Property ownership/Rent agreement
• Passport-size photos (2)
• NOC from Fire Department (if applicable)
• GST registration (if applicable)

**Fees:** Varies by shop size and location

🔗 **Apply Online:** https://vmc.gov.in/citizen-services

📍 **Offline:** Visit your Zone Office with documents` + getFollowUpMenu(lang)
            };
        }

        if (msg.includes('trade')) {
            return {
                message: `📜 *Trade License - VMC Guide*

**How to Apply:**
1. Visit VMC Online Portal
2. Fill trade license application
3. Submit required documents
4. Pay trade license fee
5. License issued after verification

**Required Documents:**
• Aadhaar Card & PAN Card
• Business address proof
• Partnership deed / Company registration (if applicable)
• GST registration
• Previous year's license (for renewal)

**Renewal:** Must renew annually before March 31

🔗 **Apply Online:** https://vmc.gov.in/citizen-services

📍 **Offline:** Visit Revenue Department, VMC Head Office` + getFollowUpMenu(lang)
            };
        }

        if (msg.includes('building') || msg.includes('construction')) {
            return {
                message: `🏗️ *Building Permission - VMC Guide*

**How to Apply:**
1. Submit application on VMC Portal
2. Upload building plans (prepared by licensed architect)
3. Pay scrutiny fees
4. Site inspection by VMC
5. Permission granted after compliance check

**Required Documents:**
• Property ownership documents (7/12, Sale deed)
• Building plan by licensed architect
• Structural engineer certificate
• NOCs (Fire, Environment, if applicable)
• Fees challan

**Timeline:** 30-60 days (depends on project size)

🔗 **Apply Online:** https://vmc.gov.in/building-permission

📍 **Important:** All building work requires VMC permission!` + getFollowUpMenu(lang)
            };
        }

        return {
            message: `📋 *License & Permit Services - VMC*

Which license/permit information do you need?

• 🏪 Shop / Business License
• 📜 Trade License
• �️ Building Permission
• 🎉 Event Permission

Type the license name for detailed steps and documents.

🔗 **VMC Portal:** https://vmc.gov.in`
        };
    }

    // Default / greeting
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste') || msg.includes('help') || msg.length < 10) {
        return {
            message: `🙏 * Namaste! Welcome to Citizen Services! *

        I'm your virtual assistant. How can I help you today?

📄 * Pay Bills * - Electricity, Water, Property Tax
📝 * File Complaints * - Roads, Water, Garbage, Lights
📋 * Apply for Certificates * - Birth, Income, Caste
🏪 * Get Licenses * - Shop, Trade, Permits
🔍 * Track Status * - Check your request status
    ℹ️ * Office Info * - Timings, Contacts

Just type what you need or select from above!

_आप हिंदी में भी बात कर सकते हैं।_ 🇮🇳`
        };
    }

    // Fallback
    return {
        message: `I understand you need help with: "${userMessage}"

Could you please specify what service you need ?

• 💳 Bill Payment
• 📝 File a Complaint
• 📋 Certificate Application
• 🏪 License / Permit
• 🔍 Track Status
• ℹ️ General Information

Or describe your issue in more detail, and I'll guide you through the process.`
    };
}
