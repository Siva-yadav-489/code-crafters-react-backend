# Proposal Generator & ChatBot Backend Service

### _By Code Crafters_

This is the backend service for the Proposal Generator & ChatBot application. It provides APIs for generating proposals, managing PDF exports, email functionality, and chatbot interactions using Google's Gemini AI.

## Features

- RESTful API endpoints for proposal generation using Gemini AI
- PDF generation and management
- Email service integration for sending proposals
- Chatbot API integration using Gemini AI
- Environment-based configuration

## Tech Stack

- Node.js
- Express.js
- Google Gemini AI
- PDFKit for PDF generation
- Nodemailer for email service
- CORS enabled for frontend integration

## API Documentation

### Health Check
- `GET /api/health` - Check server health status

### Proposal Generation
- `POST /api/proposal` - Generate a new proposal
  - Request body: `{ "requirements": "string" }`
  - Response: `{ "proposal": "string" }`

### PDF Management
- `GET /api/download` - Download the generated proposal PDF

### Email Service
- `POST /api/mail` - Send proposal via email
  - Request body: `{ "mailid": "email@example.com" }`
  - Response: `{ "success": true, "message": "Email sent successfully" }`

### Chatbot
- `POST /api/chat` - Interact with the chatbot
  - Request body: `{ "question": "string" }`
  - Response: `{ "response": "string" }`

## Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/Siva-yadav-489/Code-Crafters.git
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Environment Configuration
Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
API_KEY=your_gemini_api_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

4. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:3000 (or the port specified in your .env file)

