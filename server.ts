import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Helper to extract and sanitize API keys from raw environment
  const getSanitizedKeys = (): string[] => {
    const rawKeys: string[] = [];
    if (process.env.PIKEY) rawKeys.push(process.env.PIKEY);
    if (process.env.GEMINI_API_KEY) rawKeys.push(process.env.GEMINI_API_KEY);
    
    // Scan all env vars for potential keys
    Object.keys(process.env).forEach(k => {
      const val = process.env[k];
      if (typeof val === 'string' && (val.startsWith("AIza") || val.includes("AIza"))) {
        rawKeys.push(val);
      }
    });

    const sanitized = rawKeys.map(key => {
      let cleaned = key.trim();
      // Remove surrounding double or single quotes
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
      }
      return cleaned;
    }).filter(key => key.length > 5);

    return Array.from(new Set(sanitized));
  };

  // API route for Gemini
  app.post("/api/gemini/generateContent", async (req, res) => {
    try {
      const potentialKeys = getSanitizedKeys();
      
      if (potentialKeys.length === 0) {
        return res.status(500).json({ error: "API_KEY_INVALID: API key not found on server. Please add GEMINI_API_KEY to Settings -> Secrets." });
      }
      
      let finalResponse = null;
      let lastError = null;

      for (const apiKey of potentialKeys) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          finalResponse = await ai.models.generateContent(req.body);
          break; // Functional success, exit key loop
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

      const potentialKeys = getSanitizedKeys();
      
      if (potentialKeys.length === 0) {
        return res.status(500).json({ error: "API_KEY_INVALID: API key not found on server. Please add GEMINI_API_KEY to Settings -> Secrets." });
      }

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
          if (finalImageUrl) break; // Success
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

  // API route to subscribe to calendar (returns ICS file)
  app.get("/api/calendar/subscribe", async (req, res) => {
    try {
      const { fundId, userId } = req.query;
      
      if (!fundId && !userId) {
        return res.status(400).send("Bad Request: Please provide fundId or userId query parameter.");
      }

      // Read firebase-applet-config.json dynamically to tolerate both relative paths and CWD-based runs
      let projectId = "gen-lang-client-0286609642";
      let databaseId = "ai-studio-4c1babd3-a9ea-45c1-bbfe-ffa32ef30023";

      try {
        const fs = await import("fs");
        const path = await import("path");
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
          if (config.projectId) projectId = config.projectId;
          if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
        }
      } catch (e) {
        console.error("Error reading firebase config in server", e);
      }

      let events: any[] = [];
      const fetchUrl = fundId 
        ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/couple_data/calendar_${fundId}`
        : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${userId}`;

      console.log(`Subscribing calendar - Fetching: ${fetchUrl}`);
      const response = await fetch(fetchUrl);
      
      if (response.ok) {
        const docJson: any = await response.json();
        
        // Helper function to unpack Firestore typed JSON REST format
        const unpackValue = (val: any): any => {
          if (!val) return null;
          if ('stringValue' in val) return val.stringValue;
          if ('booleanValue' in val) return val.booleanValue;
          if ('integerValue' in val) return parseInt(val.integerValue, 10);
          if ('doubleValue' in val) return val.doubleValue;
          if ('arrayValue' in val) {
            return (val.arrayValue.values || []).map((v: any) => unpackValue(v));
          }
          if ('mapValue' in val) {
            const fields = val.mapValue.fields || {};
            const resVal: Record<string, any> = {};
            for (const k of Object.keys(fields)) {
              resVal[k] = unpackValue(fields[k]);
            }
            return resVal;
          }
          return null;
        };

        const data: Record<string, any> = {};
        if (docJson && docJson.fields) {
          for (const k of Object.keys(docJson.fields)) {
            data[k] = unpackValue(docJson.fields[k]);
          }
        }

        events = fundId ? (data.events || []) : (data.calendarEvents || []);
      }

      // Generate ICS Content
      let icsContent = "BEGIN:VCALENDAR\n" +
                       "VERSION:2.0\n" +
                       "PRODID:-//Fintro Pro//Shared Calendar//EN\n" +
                       "CALSCALE:GREGORIAN\n" +
                       "METHOD:PUBLISH\n" +
                       "X-WR-CALNAME:Lich Gia Dinh - Fintro AI\n" +
                       "X-WR-TIMEZONE:Asia/Ho_Chi_Minh\n";

      events.forEach((e: any) => {
        const id = e.id || Math.random().toString(36).substring(2);
        const title = (e.title || "Su kien gia dinh").replace(/[\r\n]/g, " ");
        const type = e.type || "other";
        
        let dateStr = e.date; // e.g. "2026-05-20"
        if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) return;
        
        const timeStr = e.time || "08:00"; // e.g. "08:00"

        const dateParts = dateStr.split('-');
        if (dateParts.length !== 3) return;
        const [year, month, day] = dateParts;
        const [hours, mins] = timeStr.split(':');
        
        const paddedHours = (hours || "00").padStart(2, '0');
        const paddedMins = (mins || "00").padStart(2, '0');

        const startStr = `${year}${month}${day}T${paddedHours}${paddedMins}00`;
        
        let endHours = (parseInt(paddedHours, 10) + 1);
        if (endHours >= 24) {
          endHours = 23;
        }
        const paddedEndHours = endHours.toString().padStart(2, '0');
        const endStr = `${year}${month}${day}T${paddedEndHours}${paddedMins}00`;

        icsContent += `BEGIN:VEVENT\n` +
                      `UID:${id}@fintro.pro\n` +
                      `DTSTAMP:${year}${month}${day}T000000Z\n` +
                      `DTSTART:${startStr}\n` +
                      `DTEND:${endStr}\n` +
                      `SUMMARY:${title}\n` +
                      `DESCRIPTION:Loai su kien: ${type}\n` +
                      `END:VEVENT\n`;
      });

      icsContent += "END:VCALENDAR";

      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="lich-gia-dinh.ics"');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.send(icsContent);

    } catch (error: any) {
      console.error("Error generating ICS subscription:", error);
      res.status(500).send("Internal Server Error");
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
