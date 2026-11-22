import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runKisanAdvisor, synthesizeAdvisorySpeech } from "./server/gemini.ts";
import {
  CROP_KNOWLEDGE_BASE,
  FALLBACK_MANDI_PRICES,
  getMandiPrices,
  getSoilProfile,
  getWeatherForecast,
} from "./server/tools.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/field-snapshot", async (req, res) => {
    try {
      const location = String(req.query.location || "Nashik, Maharashtra");
      const commodity = String(req.query.commodity || "");
      const [weather, soil, mandi] = await Promise.all([
        getWeatherForecast(location),
        getSoilProfile(location),
        getMandiPrices(commodity),
      ]);
      res.json({ weather, soil, mandi });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : "Failed to load field snapshot.",
      });
    }
  });

  app.get("/api/mandi", async (req, res) => {
    try {
      const commodity = String(req.query.commodity || "");
      const state = String(req.query.state || "");
      if (!commodity && !state) {
        res.json({
          status: "success",
          source: "Reference Mandi Dataset",
          unit: "INR per Quintal (100 kg)",
          prices: FALLBACK_MANDI_PRICES,
        });
        return;
      }
      const result = await getMandiPrices(commodity, state);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error ? err.message : "Failed to load mandi rates.",
      });
    }
  });

  app.get("/api/crops", (_req, res) => {
    const crops = Object.entries(CROP_KNOWLEDGE_BASE).map(([key, val]) => ({
      crop: key.charAt(0).toUpperCase() + key.slice(1),
      ...val,
    }));
    res.json({ crops });
  });

  app.post("/api/advise", async (req, res) => {
    try {
      const {
        location = "Nashik, Maharashtra",
        languageLabel = "Hindi (हिन्दी)",
        textQuery = "",
        audioBase64,
        audioMimeType,
        imageBase64,
        imageMimeType,
      } = req.body ?? {};

      if (!textQuery && !audioBase64 && !imageBase64) {
        res.status(400).json({
          error:
            "Please type a question, record a voice note, or attach a crop photo.",
        });
        return;
      }

      const result = await runKisanAdvisor({
        location: String(location),
        languageLabel: String(languageLabel),
        textQuery: String(textQuery),
        audioBase64,
        audioMimeType,
        imageBase64,
        imageMimeType,
      });

      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Advisory request failed.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, languageLabel = "Hindi (हिन्दी)" } = req.body ?? {};
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Text is required for voice synthesis." });
        return;
      }
      const audio = await synthesizeAdvisorySpeech(text, String(languageLabel));
      res.json(audio);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Voice synthesis failed.";
      res.status(500).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexHtml = path.join(distPath, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("Build artifacts not found.");
      }
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KisanMitra AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
