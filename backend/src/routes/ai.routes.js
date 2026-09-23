import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../config/prisma.js";

const router = Router();

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

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: promptText }],
    });

    // Supported modern Gemini models with automatic fallback
    const primaryModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const modelsToTry = [primaryModel, "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
      .filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let aiResponse = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
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
          lastError = new Error(`Gemini API error: ${response.status} ${response.statusText}`);
          if (response.status === 404) {
            // Model not found for this endpoint/key, try next fallback
            continue;
          }
          throw lastError;
        }

        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiResponse) {
          break; // successfully received content
        }
      } catch (err) {
        lastError = err;
        if (!err.message?.includes("404")) {
          throw err;
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
    res.status(500).json({ 
      error: "Failed to get AI response",
      response: "I'm sorry, but I'm having trouble connecting to the AI service. Please try again later."
    });
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
