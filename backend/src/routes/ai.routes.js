import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../config/prisma.js";

const router = Router();

// POST /api/ai/chat - Send message to AI (Gemini via REST API)
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "AI service not configured",
        response: "I'm sorry, but the AI service is not configured. Please add a GEMINI_API_KEY to your environment variables."
      });
    }

    // Call Gemini API via REST (supports new AQ key format)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't generate a response.";

    // Save conversation if it doesn't exist
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: req.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
      });
    }

    // Save messages
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'user',
          content: message,
        },
        {
          conversationId: conversation.id,
          role: 'assistant',
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
