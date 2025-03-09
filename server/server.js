import express from "express";
import cors from "cors";
import axios from "axios";
import { exec } from "child_process";
import open from "open"; // ✅ Now works with import
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function detectAction(message) {
  if (message.toLowerCase().includes("open youtube")) {
    open("https://www.youtube.com");
    return "Opening YouTube...";
  }

  if (message.toLowerCase().includes("search for")) {
    const query = message.replace("search for", "").trim();
    open(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    return `Searching for "${query}" on Google...`;
  }

  if (message.toLowerCase().includes("set a timer for")) {
    const match = message.match(
      /set a timer for (\d+) (seconds|minutes|hours)/
    );

    if (match) {
      const time = parseInt(match[1]);
      const unit = match[2];

      let milliseconds = time * 1000;
      if (unit === "minutes") milliseconds *= 60;
      if (unit === "minutes") milliseconds *= 3600;

      setTimeout(() => {
        console.log("Timer ended!");
      }, milliseconds);

      return `Timer set for ${time} ${unit}`;
    }
  }

  return null;
}

async function detectCommand(userInput) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
      You are a command classification AI. Categorize the following user input into one of these:
      - "app_control" (open/close applications)
      - "close_app" (close applications)
      - "web_search" (searching online)
      - "system_task" (shutdown, restart, volume control)
      - "reminder" (setting reminders)
      - "unknown" (if the command is unclear)

      User Input: "${userInput}"
      Reply with only the category name.
    `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const category = result.response.text().trim();
    console.log("Detected Category:", category);

    return category;
  } catch (error) {
    console.error("Error detecting command:", error);
    return "unknown";
  }
}

async function executeCommand(userInput) {
  const category = await detectCommand(userInput);

  switch (category) {
    case "app_control":
      if (userInput.toLowerCase().includes("open")) {
        exec(`start ${userInput.replace("open ", "").trim()}`); // Opens app
      }
      break;

    case "close_app":
      const appName = userInput.replace(/close\s+(?:the\s+)?/i, "").trim(); // Extract app name
      if (process.platform === "win32") {
        exec(`taskkill /IM ${appName}.exe /F`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error closing ${appName}: ${error}`);
          } else {
            console.log(`${appName} closed.`);
          }
        });
      } else if (
        process.platform === "darwin" ||
        process.platform === "linux"
      ) {
        exec(`pkill -f ${appName}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error closing ${appName}: ${error}`);
          } else {
            console.log(`${appName} closed.`);
          }
        });
      }
      break;

    case "web_search":
      const query = userInput.replace("search for ", "").trim();
      open(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      break;

    case "system_task":
      if (userInput.includes("shutdown")) exec("shutdown /s /t 0");
      if (userInput.includes("restart")) exec("shutdown /r /t 0");
      break;

    case "reminder":
      console.log("Reminder functionality not implemented yet!");
      break;

    default:
      return null;
  }

  return category;
}
// Function to chat with Gemini
async function chatWithGemini(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const actionResponse = detectAction(userMessage);
    if (actionResponse) {
      console.log("Default action response");
      return actionResponse; // If it's an action, return the response
    }
    const executionFlag = await executeCommand(userMessage);

    if (!executionFlag) {
      console.log("AI Chat message");
    } else {
      console.log("AI command Detection");
      return;
    }

    const chat = model.startChat();
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't process your request.";
  }
}

// API route for chatbot
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const response = await chatWithGemini(message);
  res.json({ response });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
