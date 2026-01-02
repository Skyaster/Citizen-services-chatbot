# 🏙️ Citizen Services Chatbot

A modern, AI-powered chatbot designed to streamline municipal services for citizens. Built with **React**, **Supabase**, and **Google Gemini AI**, this application provides a conversational interface for bill payments, grievance redressal, and service information in multiple languages (English, Hindi, and Hinglish).

## ✨ Features

- **🤖 AI-Powered Conversations**: Uses **Google Gemini 2.5 Flash** to understand natural language and context.
- **🌍 Multi-Language Support**:
  - English
  - Hindi (हिंदी)
  - Hinglish (Conversational Hindi-English)
- **🏢 Core Services**:
  - **Bill Payments**: Electricity, Water, and Property Tax (Integrated demo data).
  - **Grievance Redressal**: Report issues like potholes, water supply, and garbage collection.
  - **Status Tracking**: Check the status of complaints and applications.
  - **Information Portal**: Guides for Birth, Income, and Caste certificates, and Trade/Shop licenses.
- **💬 WhatsApp-Style UI**: Familiar, dark-themed chat interface for intuitive usage.
- **🔐 Secure Backend**: Powered by **Supabase** with Row Level Security (RLS).

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: Custom CSS (WhatsApp Dark Theme)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A [Supabase](https://supabase.com/) account
- A [Google AI Studio](https://aistudio.google.com/) API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Skyaster/Citizen-services-chatbot.git
   cd Citizen-services-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and copy the contents from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

### 🗄️ Database Setup

1. Go to your Supabase Project Dashboard -> **SQL Editor**.
2. Open the file `supabase/schema.sql` from this repository.
3. Copy the entire content and run it in the Supabase SQL Editor.
   - This will create the necessary tables (`citizens`, `grievances`, `applications`, `bills`, `conversations`).
   - It also sets up sample data for bills and configures Security Policies (RLS).

### 🏃‍♂️ Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start chatting!

## 💡 Usage Guide

Here are some things you can ask the chatbot:

- **Pay Bills**: "I want to pay my electricity bill" or "Pay water tax".
- **Report Issues**: "There is a pothole on MG Road" or "Garbage not collected in Ward 4".
- **Certificates**: "How to apply for a birth certificate?" or "Income certificate documents".
- **Track Status**: "Check status of GR12345".
- **Change Language**: "Hindi mein baat karo" or "Switch to English".

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed for Hackathon 3.0*
