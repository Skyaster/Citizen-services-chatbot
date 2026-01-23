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
        const data = context.collectedData;

        // Step 2: Collect Location (if not yet collected)
        if (!data.location) {
            const landmarkMsg = lang === 'hi'
                ? `जी। कृपया नजदीकी लैंडमार्क बताएं?`
                : lang === 'hinglish'
                    ? `Ok. Ab nearby Landmark batayein?`
                    : `Got it. Please share a **Nearby Landmark**?`;

            return {
                message: landmarkMsg,
                structuredData: {
                    type: 'grievance', // Keep in grievance flow
                    category: data.category as string,
                    location: userMessage // Identify this user message as the location
                }
            };
        }

        // Step 3: Collect Landmark (if location present but landmark missing)
        if (!data.landmark) {
            const descMsg = lang === 'hi'
                ? `धन्यवाद। कृपया समस्या का विवरण दें (फोटो अगला है)।`
                : lang === 'hinglish'
                    ? `Note kar liya. Please problem describe karein (photo next step mein).`
                    : `Noted. Please briefly **describe the problem** (You'll be asked for a photo next).`;

            return {
                message: descMsg, // Ask for NEXT step (Description)
                structuredData: {
                    type: 'grievance',
                    category: data.category as string,
                    location: data.location as string,
                    landmark: userMessage // Capture CURRENT step (Landmark)
                }
            };
        }

        // Step 4: Collect Description (if landmark present but description missing)
        // Step 4: Collect Description (if landmark present but description missing)
        if (!data.description) {
            const photoMsg = lang === 'hi'
                ? `🛑 **फोटो अनिवार्य है**\n\nकृपया समस्या की फोटो भेजें।`
                : lang === 'hinglish'
                    ? `🛑 **Photo Mandatory hai**\n\nPlease issue ka photo bhejein.`
                    : `🛑 **Photo Required**\n\nPlease attach a **photo** of the issue.`;

            return {
                message: photoMsg, // Ask for NEXT step (Photo)
                structuredData: {
                    type: 'grievance',
                    category: data.category as string,
                    location: data.location as string,
                    landmark: data.landmark as string,
                    description: userMessage // Capture CURRENT step (Description)
                }
            };
        }

        // Step 5: Mandatory Photo (if description is present but no attachment)
        const hasAttachment = userMessage.startsWith('[ATTACHMENT:') || (data.attachments && (data.attachments as any[]).length > 0);

        if (!hasAttachment) {
            const photoMsg = lang === 'hi'
                ? `🛑 **फोटो अनिवार्य है**\n\nकृपया समस्या की फोटो भेजें। इसके बिना हम शिकायत दर्ज नहीं कर सकते।`
                : lang === 'hinglish'
                    ? `🛑 **Photo Mandatory hai**\n\nPlease issue ka photo bhejein. Uske bina complaint register nahi hogi.`
                    : `🛑 **Photo Required**\n\nPlease attach a **photo** of the issue.\nWe cannot register the complaint without it.`;

            return {
                message: photoMsg,
                // We return the same data so we stay in this state
                structuredData: {
                    type: 'grievance',
                    category: data.category as string,
                    location: data.location as string,
                    landmark: data.landmark as string,
                    description: data.description as string
                }
            };
        }



        // All steps complete
        const finalMsg = lang === 'hi'
            ? `धन्यवाद। मैंने फोटो प्राप्त कर लिया है। आपकी शिकायत दर्ज की जा रही है...`
            : lang === 'hinglish'
                ? `Thank you. Photo mil gaya. Complaint register ho rahi hai...`
                : `Thank you. I've received the photo. Registering your complaint now...`;

        return {
            message: finalMsg,
            structuredData: {
                type: 'grievance',
                category: data.category as string,
                location: data.location as string,
                landmark: data.landmark as string,
                description: data.description as string,
                // The attachment is handled by chatService, but we confirm flow is done
            }
        };
    }

    // 2. Keyword Matching (New Flows)

    // --- Bill Payment ---
    if (msg.includes('bill') || msg.includes('pay') || msg.includes('tax') || msg.includes('bijli') || msg.includes('paani') || msg.includes('vera')) {
        if (msg.includes('electricity') || msg.includes('bijli')) {
            return {
                message: `⚡ *Electricity Bill Payment*
                
Please share your *Consumer Number* (found on your bill, usually 10-12 digits).`,
                structuredData: { type: 'bill', category: 'electricity' }
            };
        }
        if (msg.includes('water') || msg.includes('paani')) {
            return {
                message: `💧 *Water Bill Payment*

Please share your *Consumer Number* or *Property ID*.`,
                structuredData: { type: 'bill', category: 'water' }
            };
        }
        if (msg.includes('property') || msg.includes('house') || msg.includes('vera') || msg.includes('tax')) {
            return {
                message: `🏠 *Property Tax Payment*

Please share your *Census Number* or *Property ID* to check pending dues.`,
                structuredData: { type: 'bill', category: 'property_tax' }
            };
        }
        return {
            message: `💳 *Bill Payment Services*

Select a bill to pay:
• ⚡ Electricity Bill
• 💧 Water Bill  
• 🏠 Property Tax

Using official VMC & Provider Gateways.`
        };
    }

    // --- Grievance Flow ---
    if (msg.includes('complaint') || msg.includes('problem') || msg.includes('issue') ||
        msg.includes('grievance') || msg.includes('pothole') || msg.includes('road') ||
        msg.includes('garbage') || msg.includes('light') || msg.includes('drain') ||
        msg.includes('kharab') || msg.includes('nahi aa raha')) {

        const baseGrievancePrompt = (cat: string) => `Please share:
1. *Area/Ward Name*
2. *Nearby Landmark*
3. *Brief Description*

(You will be asked for a photo next)`;

        if (msg.includes('road') || msg.includes('pothole') || msg.includes('sadak')) {
            return {
                message: `🛣️ *Road Complaint*\n\n` + baseGrievancePrompt('roads'),
                structuredData: { type: 'grievance', category: 'roads' }
            };
        }
        if (msg.includes('water') || msg.includes('paani') || msg.includes('supply')) {
            return {
                message: `💧 *Water Supply Complaint*\n\n` + baseGrievancePrompt('water_supply'),
                structuredData: { type: 'grievance', category: 'water_supply' }
            };
        }
        if (msg.includes('garbage') || msg.includes('waste') || msg.includes('kachra')) {
            return {
                message: `🗑️ *Garbage Complaint*\n\n` + baseGrievancePrompt('garbage'),
                structuredData: { type: 'grievance', category: 'garbage' }
            };
        }
        if (msg.includes('light') || msg.includes('street')) {
            return {
                message: `💡 *Street Light Complaint*\n\nPlease mention the *Pole Number* if visible.\n\n` + baseGrievancePrompt('street_lights'),
                structuredData: { type: 'grievance', category: 'street_lights' }
            };
        }
        if (msg.includes('drain') || msg.includes('gutar') || msg.includes('sewer') || msg.includes('overflow')) {
            return {
                message: `🌊 *Drainage/Sewerage Complaint*\n\n` + baseGrievancePrompt('drainage'),
                structuredData: { type: 'grievance', category: 'drainage' }
            };
        }

        return {
            message: `📝 *File a Complaint*

I can help with:
• 💧 Water Supply
• 🛣️ Roads / Potholes
• 🗑️ Garbage
• 💡 Street Lights
• 🌊 Drainage
• 📌 Other Issues

Please describe your problem.`
        };
    }

    // --- Certificates ---
    if (msg.includes('certificate') || msg.includes('birth') || msg.includes('death') || msg.includes('income') ||
        msg.includes('caste') || msg.includes('domicile') || msg.includes('praman')) {

        if (msg.includes('birth') || msg.includes('janam')) {
            return {
                message: `👶 *Birth Certificate*
                
**Process:**
1. Apply online (VMC Portal) or at Seva Sadan.
2. Documents: Discharge summary, Parents' Aadhaar & Marriage Cert.
3. Fee: ₹20 approx.
4. Time: 7-15 days.

🔗 [Apply Here](https://vmc.gov.in)` + getFollowUpMenu(lang)
            };
        }
        if (msg.includes('death') || msg.includes('mrutyu')) {
            return {
                message: `⚰️ *Death Certificate*
                
**Process:**
1. Register death within 21 days (Free). 
2. Apply at Ward Office / Seva Sadan.
3. Documents: Hospital cause of death, Cremation receipt, ID proof of applicant.

🔗 [VMC Health Dept](https://vmc.gov.in)` + getFollowUpMenu(lang)
            };
        }
        if (msg.includes('income') || msg.includes('aay')) {
            return {
                message: `💰 *Income Certificate* (Revenue Dept)
                
Apply via **Digital Gujarat Portal**.
• Doc: Salary slip / IT Return, Ration Card, Aadhaar.
• Issued by Mamlatdar (not VMC).

🔗 [Digital Gujarat](https://digitalgujarat.gov.in)` + getFollowUpMenu(lang)
            };
        }
        if (msg.includes('domicile') || msg.includes(' रहिवासी')) {
            return {
                message: `🏡 *Domicile Certificate*
                
Proof of residence in Gujarat for 10+ years.
• Apply: Digital Gujarat Portal / Police Bhavan.
• Doc: School LC, Ration Card, Electricity Bill (10 yrs), Voter ID.

🔗 [Digital Gujarat](https://digitalgujarat.gov.in)` + getFollowUpMenu(lang)
            };
        }

        return {
            message: `📋 *Certificate Services*

• 👶 Birth Certificate
• ⚰️ Death Certificate
• 💰 Income Certificate
• 🏡 Domicile Certificate
• 📜 Caste Certificate

Type the name for details.`
        };
    }

    // --- Licenses & Permissions ---
    if (msg.includes('license') || msg.includes('permit') || msg.includes('shop') || msg.includes('trade') || msg.includes('building') || msg.includes('event')) {

        if (msg.includes('shop') || msg.includes('gumasta')) {
            return {
                message: `🏪 *Shop Act / Gumasta License*
                
**New Registration:**
1. Visit VMC Portal > Shop Establishment.
2. Upload: Rent Agreement/Ownership, PAN, Aadhaar.
3. Pay Fee based on employee count.

🔗 [VMC Shop Dept](https://vmc.gov.in)` + getFollowUpMenu(lang)
            };
        }
        if (msg.includes('event') || msg.includes('party') || msg.includes('plot')) {
            return {
                message: `🎉 *Event / Plot Booking*
                
For Community Halls or Party Plots:
1. Check availability on VMC Portal.
2. Select date & venue.
3. Pay deposit & rent online.
4. Get confirmation receipt.

🔗 [Book Venue](https://vmc.gov.in)` + getFollowUpMenu(lang)
            };
        }

        return {
            message: `🏪 *Licenses & Permissions*

• Shop Act (Gumasta)
• Trade License
• Building Permission
• Event/Plot Booking
• Food License (FSSAI)

What do you need?`
        };
    }

    // --- Status Tracking ---
    if (msg.includes('status') || msg.includes('track') || msg.includes('application') || msg.match(/gr\d{5}/i) || msg.match(/app\d{5}/i)) {
        const grMatch = msg.match(/gr(\d{5})/i);
        const appMatch = msg.match(/app(\d{5})/i);

        if (grMatch) {
            const id = `GR${grMatch[1]}`;
            return {
                message: `🔍 Checking status for Grievance **${id}**...`,
                structuredData: { type: 'status_query', grievance_id: id }
            };
        }
        if (appMatch) {
            const id = `APP${appMatch[1]}`;
            return {
                message: `🔍 Checking status for Application **${id}**...`,
                structuredData: { type: 'status_query', application_id: id }
            };
        }

        return {
            message: `🔍 *Track Request*

Please enter your **Grievance ID** (GRxxxxx) or **Application ID** (APPxxxxx) to check status.`
        };
    }

    // --- General / Office ---
    if (msg.includes('office') || msg.includes('contact') || msg.includes('time') || msg.includes('help')) {
        return {
            message: `🏛️ *VMC Contact Info*

☎️ *Helpline:* 1800-233-0265 (Toll Free)
📞 *Control Room:* 0265-2423101
📧 *Email:* info@vmc.gov.in

🕒 *Timings:* 10:30 AM - 6:10 PM (Mon-Sat, excluding holidays)
📍 *Head Office:* Khanderao Market, Vadodara.

How can I assist you today?` + getFollowUpMenu(lang)
        };
    }

    // --- Default Fallback ---
    return {
        message: `👋 *Welcome to VMC Citizen Services*

I can help you with:
1. 💳 *Pay Bills* (Water, Housing, Tax)
2. 📝 *Register Complaint* (Road, Garbage, Drain)
3. 📋 *Certificates* (Birth, Death, Income)
4. 🏪 *Licenses* (Shop, Trade)
5. 🔍 *Check Status*

Please type your request (e.g., "Report a pothole" or "Pay water bill").`
    };
}
