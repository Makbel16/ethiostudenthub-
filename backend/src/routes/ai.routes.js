import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../config/prisma.js";

const router = Router();

let cachedWorkingModel = null;

async function listSupportedModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
      headers: { "x-goog-api-key": apiKey },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.models || [])
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""));
    }
  } catch (err) {
    console.error("Failed to query ModelService.ListModels:", err.message);
  }
  return [];
}

async function requestGenerateContent(model, apiKey, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`Gemini API error with model '${model}':`, response.status, errorData);
    const err = new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    err.status = response.status;
    err.errorData = errorData;
    throw err;
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

// POST /api/ai/chat - Send message to AI (Gemini via REST API)
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "AI service not configured",
        response: "I'm sorry, but the AI service is not configured. Please add a GEMINI_API_KEY to your environment variables."
      });
    }

    const trimmedMessage = message.trim();
    const promptText = context && typeof context === "string" && context.trim()
      ? `[Context: ${context.trim()}]\n\nQuestion: ${trimmedMessage}`
      : trimmedMessage;

    // Build multi-turn contents for Gemini
    let contents = [];
    let conversation;

    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: req.user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20,
          },
        },
      });

      if (conversation && conversation.messages?.length > 0) {
        for (const msg of conversation.messages) {
          const role = msg.role === "assistant" ? "model" : "user";
          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += `\n${msg.content}`;
          } else {
            contents.push({
              role,
              parts: [{ text: msg.content }],
            });
          }
        }
        // Ensure conversation starts with user turn
        while (contents.length > 0 && contents[0].role !== "user") {
          contents.shift();
        }
      }
    }

    // Add current user prompt ensuring strictly alternating turns
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents[contents.length - 1].parts[0].text += `\n\n${promptText}`;
    } else {
      contents.push({
        role: "user",
        parts: [{ text: promptText }],
      });
    }

    // Candidates prioritize modern models: gemini-3.6-flash, gemini-2.5-flash, gemini-2.5-pro
    const primaryModel = process.env.GEMINI_MODEL;
    let modelsToTry = [
      primaryModel,
      cachedWorkingModel,
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let aiResponse = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const text = await requestGenerateContent(model, apiKey, contents);
        if (text) {
          aiResponse = text;
          cachedWorkingModel = model;
          break;
        }
      } catch (err) {
        lastError = err;
        if (err.status !== 404) {
          // If error is not 404 (e.g. 429 quota or auth issue), don't try other models
          throw err;
        }
      }
    }

    // Fallback: If static candidates returned 404, query ModelService.ListModels dynamically
    if (!aiResponse) {
      console.log("Candidate models returned 404, querying available models from Google API...");
      const availableModels = await listSupportedModels(apiKey);
      console.log("Available generateContent models:", availableModels);
      for (const model of availableModels) {
        if (modelsToTry.includes(model)) continue;
        try {
          const text = await requestGenerateContent(model, apiKey, contents);
          if (text) {
            aiResponse = text;
            cachedWorkingModel = model;
            break;
          }
        } catch (err) {
          lastError = err;
          if (err.status !== 404) break;
        }
      }
    }

    if (!aiResponse) {
      if (lastError) throw lastError;
      aiResponse = "I apologize, but I couldn't generate a response.";
    }

    // Save conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: req.user.id,
          title: trimmedMessage.substring(0, 50) + (trimmedMessage.length > 50 ? "..." : ""),
        },
      });
    }

    // Save messages
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: "user",
          content: trimmedMessage,
        },
        {
          conversationId: conversation.id,
          role: "assistant",
          content: aiResponse,
        },
      ],
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.json({
      response: aiResponse,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    const detailMsg = error.errorData?.error?.message || error.message || "Failed to get AI response";
    res.status(500).json({ 
      error: detailMsg,
      response: `AI service error: ${detailMsg}`
    });
  }
});

// GET /api/ai/models - Diagnostic endpoint to check available models for current API key
router.get("/models", requireAuth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "No GEMINI_API_KEY set" });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
      headers: { "x-goog-api-key": apiKey },
    });
    const data = await response.json();
    res.json({
      status: response.status,
      activeModel: cachedWorkingModel,
      models: data.models?.map((m) => ({ name: m.name, methods: m.supportedGenerationMethods })) || data,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ai/conversations - Get user's conversations
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json(conversations);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET /api/ai/conversations/:id - Get conversation with messages
router.get("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// DELETE /api/ai/conversations/:id - Delete conversation
router.delete("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Delete messages first (cascade should handle this, but being explicit)
    await prisma.message.deleteMany({
      where: { conversationId: req.params.id },
    });

    // Delete conversation
    await prisma.conversation.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;
