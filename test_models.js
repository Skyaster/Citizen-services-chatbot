
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBipTtlcucBSrbKef_aFIowfp0SkGc0Djg';
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    console.log('Testing gemini-3-pro-preview...');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
        const result = await model.generateContent('Hi');
        await result.response;
        console.log(`✅ SUCCESS: gemini-3-pro-preview`);
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

test();
