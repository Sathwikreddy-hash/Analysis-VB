import express from "express";
import gplay from "google-play-scraper";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to search for an app
  app.get("/api/search", async (req, res) => {
    try {
      const { term } = req.query;
      if (!term) return res.status(400).json({ error: "Search term is required" });
      
      const searchTerm = term as string;
      
      // Check if it's a Play Store URL
      if (searchTerm.includes("id=")) {
        const appId = searchTerm.split("id=")[1].split("&")[0];
        const appDetails = await gplay.app({ appId });
        return res.json([appDetails]);
      }

      const results = await gplay.search({
        term: searchTerm,
        num: 5
      });
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search for app" });
    }
  });

  // API to get app details
  app.get("/api/app", async (req, res) => {
    try {
      const { appId } = req.query;
      if (!appId) return res.status(400).json({ error: "App ID is required" });
      const details = await gplay.app({ appId: appId as string });
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch app details" });
    }
  });

  // API to get reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const { appId } = req.query;
      if (!appId) return res.status(400).json({ error: "App ID is required" });

      // Fetch up to 1000 reviews (paginated)
      const reviews = await gplay.reviews({
        appId: appId as string,
        sort: 2, // gplay.sort.NEWEST
        num: 1000
      });

      res.json(reviews.data);
    } catch (error) {
      console.error("Reviews error:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
