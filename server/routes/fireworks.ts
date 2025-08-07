import { Router } from "express";
import { completeWithFireworks } from "../services/fireworksService";

const router = Router();

export async function fireworksRoutes(app: any): Promise<void> {
  
  router.post("/completions", async (req, res) => {
    try {
      const { prompt, options } = req.body ?? {};
      if (!prompt) return res.status(400).json({ error: "Missing prompt" });
      const text = await completeWithFireworks(prompt, options);
      res.json({ text });
    } catch (err: any) {
      console.error("Fireworks error:", err?.response?.data || err?.message);
      res.status(500).json({ error: "Fireworks request failed", detail: err?.response?.data || err?.message });
    }
  });

  app.use("/api/fireworks", router);

  console.log('Fireworks AI routes registered successfully');
}