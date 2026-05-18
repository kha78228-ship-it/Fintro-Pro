import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API route for Gemini
  app.post("/api/gemini/generateContent", async (req, res) => {
    try {
      const allKeys = Object.keys(process.env)
        .map(k => process.env[k])
        .filter(v => typeof v === 'string' && v.startsWith("AIza"));
      
      if (allKeys.length === 0) {
        return res.status(500).json({ error: "API_KEY_INVALID: API key not found on server." });
      }

      const priorityKeys = [];
      if (process.env.PIKEY?.startsWith("AIza")) priorityKeys.push(process.env.PIKEY);
      if (process.env.GEMINI_API_KEY?.startsWith("AIza")) priorityKeys.push(process.env.GEMINI_API_KEY);
      
      const potentialKeys = Array.from(new Set([...priorityKeys, ...allKeys])) as string[];
      
      let finalResponse = null;
      let lastError = null;

      for (const apiKey of potentialKeys) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          finalResponse = await ai.models.generateContent(req.body);
          break; // Thành công, thoát vòng lặp
        } catch (error: any) {
          lastError = error;
          const msg = error.message || "";
          if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID") || msg.includes("API key")) {
            console.log("Skipping invalid key...");
            continue; 
          }
          // Lỗi khác (ví dụ: bad request do model, v.v...) thì báo lỗi này ra luôn (có thể thử key khác nếu là limit, nhưng tạm thời skip key sai)
          if (msg.includes("quota") || msg.includes("exhausted") || msg.includes("429")) {
             console.log("Quota exceeded, trying next key...");
             continue;
          }
          throw error;
        }
      }

      if (finalResponse) {
        return res.json({ text: finalResponse.text });
      } else {
        throw lastError || new Error("All available API keys failed or are invalid.");
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  app.post("/api/gemini/generateImage", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "No prompt provided" });

      const allKeys = Object.keys(process.env)
        .map(k => process.env[k])
        .filter(v => typeof v === 'string' && v.startsWith("AIza"));
      
      if (allKeys.length === 0) {
        return res.status(500).json({ error: "API_KEY_INVALID: API key not found on server." });
      }

      const priorityKeys = [];
      if (process.env.PIKEY?.startsWith("AIza")) priorityKeys.push(process.env.PIKEY);
      if (process.env.GEMINI_API_KEY?.startsWith("AIza")) priorityKeys.push(process.env.GEMINI_API_KEY);
      
      const potentialKeys = Array.from(new Set([...priorityKeys, ...allKeys])) as string[];
      
      let finalImageUrl = null;
      let lastError = null;

      for (const apiKey of potentialKeys) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: prompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64EncodeString = part.inlineData.data;
              finalImageUrl = `data:image/png;base64,${base64EncodeString}`;
              break;
            }
          }
          if (finalImageUrl) break; // Thành công
        } catch (error: any) {
          lastError = error;
          const msg = error.message || "";
          if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID") || msg.includes("API key")) {
            console.log("Skipping invalid key...");
            continue; 
          }
          if (msg.includes("quota") || msg.includes("exhausted") || msg.includes("429")) {
             console.log("Quota exceeded, trying next key...");
             continue;
          }
          throw error;
        }
      }

      if (finalImageUrl) {
        return res.json({ imageUrl: finalImageUrl });
      } else {
        throw lastError || new Error("All available API keys failed or did not return an image.");
      }
    } catch (error: any) {
      console.error("Gemini API Generate Image Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support React Router fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
