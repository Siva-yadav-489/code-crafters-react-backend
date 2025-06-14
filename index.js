require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const proposalPrompts = require("./main-prompt");

const PDFDocument = require("pdfkit");

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "/public")));

// Initialize Gemini AI
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Initialize email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development'
  });
});

//function making req to Gemini
async function callGemini(question) {
  const prompt = proposalPrompts.context + question + proposalPrompts.additions;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are a Software Proposal Generator. Your name is Proposal AI by CodeCrafters.",
      },
    });
    const result = response.text;
    return result;
  } catch (error) {
    console.error("An error occurred:", error);
    throw new Error("Error generating proposal");
  }
}

//function for pdf generation
function generatePDF(data) {
  try {
    const doc = new PDFDocument();
    const filepath = path.join(__dirname, "proposal.pdf");
    doc.pipe(fs.createWriteStream(filepath));
    doc.font("Times-Roman").fontSize(12).text(data);
    doc.end();
    return true;
  } catch (error) {
    console.log("Error generating PDF: " + error);
    return false;
  }
}

//function for chatting with gemini
const chatHistory = [
  {
    role: "user",
    parts: [{ text: "Hello" }],
  },
  {
    role: "model",
    parts: [{ text: "Great to meet you. What would you like to know?" }],
  },
];
async function chatWithGemini(question) {
  try {
    chat = ai.chats.create({
      model: "gemini-2.0-flash",
      history: chatHistory,
      config: {
        maxOutputTokens: 350,
      },
    });

    const response = await chat.sendMessage({
      message: question,
    });

    return response.text;
  } catch (error) {
    console.error("An error occurred:", error);
    throw new Error("Error in chatbot");
  }
}

//post proposal
app.post("/api/proposal", async (req, res) => {
  try {
    const request = req.body.requirements;
    if (
      typeof request !== "string" ||
      request.trim() === "" ||
      !isNaN(Number(request)) ||
      !/[a-zA-Z0-9]/.test(request)
    ) {
      return res
        .status(400)
        .json({ error: "Requirements must be a non-empty string." });
    }

    const response = await callGemini(request);
    if (response) {
      const pdfGenerated = await generatePDF(response);
      if (!pdfGenerated) {
        return res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
    res.json({ proposal: response });
  } catch (error) {
    console.error("Error generating proposal:", error);
    res.status(500).json({ error: "Error generating proposal" });
  }
});

//download pdf
app.get("/api/download", (req, res) => {
  const file = path.join(__dirname, "proposal.pdf");
  res.download(file, "proposal.pdf", (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).json({ error: "Error downloading file" });
    }
  });
});

//post chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (
      typeof question !== "string" ||
      question.trim() === "" ||
      !isNaN(Number(question)) ||
      !/[a-zA-Z0-9]/.test(question)
    ) {
      return res
        .status(400)
        .json({ error: "Question must be a non-empty string." });
    }
    const response = await chatWithGemini(question);
    res.json({ response });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ error: "Error processing chat request" });
  }
});

//send mail
app.post("/api/mail", async (req, res) => {
  try {
    const receiver = req.body.mailid;
    if (!receiver || !receiver.includes('@')) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: receiver,
      subject: "Your Project Proposal",
      text: "Please find attached the project proposal generated by Code Crafters.",
      attachments: [
        {
          filename: "proposal.pdf",
          path: path.join(__dirname, "proposal.pdf"),
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Error sending email" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});
