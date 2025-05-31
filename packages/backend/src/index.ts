import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { ValidRoutes } from "./shared/ValidRoutes";
import { connectMongo } from "./connectMongo";
import { MongoClient } from "mongodb";
import { ImageProvider } from "./ImageProvider";

dotenv.config(); // Read the .env file in the current working directory, and load values into process.env.
const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || "public";

let mongoClient: MongoClient;
let imageProvider: ImageProvider;

// Connect to MongoDB
(async () => {
  try {
    mongoClient = await connectMongo();
    imageProvider = new ImageProvider(mongoClient);
    console.log("MongoDB connection established successfully.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
})();

const app = express();
app.use(express.static(STATIC_DIR));
app.use(express.json()); // Add middleware to parse JSON bodies

// Helper function for creating a delayed response
function waitDuration(numMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, numMs));
}

// Updated API endpoint for images that fetches from MongoDB with denormalized author data
app.get("/api/images", async (req: Request, res: Response) => {
  try {
    // Wait for 1 second before responding
    await waitDuration(1000);

    // Get images from database with authors denormalized
    const imagesWithAuthors = await imageProvider.getImagesWithAuthors();
    res.json(imagesWithAuthors);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// New endpoint to update image name
app.patch("/api/images/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
  }

  try {
    // Simulate some latency for better UX feedback
    await waitDuration(500);

    const success = await imageProvider.updateImageName(id, name);

    if (success) {
      res.json({ success: true, id, name });
    } else {
      res.status(404).json({ error: "Image not found or update failed" });
    }
  } catch (error) {
    console.error(`Error updating image name for ID ${id}:`, error);
    res.status(500).json({ error: "Failed to update image name" });
  }
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.send("Hello, World");
});

// Replace the individual route with a dynamic route handler for all valid frontend routes
Object.values(ValidRoutes).forEach((route) => {
  app.get(route, (req: Request, res: Response) => {
    // Use path.join to create a platform-independent path
    const indexPath = path.join(__dirname, "../../frontend/dist/index.html");
    res.sendFile(indexPath);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
