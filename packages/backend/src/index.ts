import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { ValidRoutes } from "./shared/ValidRoutes";
import { IMAGES } from "./common/ApiImageData";

dotenv.config(); // Read the .env file in the current working directory, and load values into process.env.
const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || "public";

const app = express();
app.use(express.static(STATIC_DIR));

// Helper function for creating a delayed response
function waitDuration(numMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, numMs));
}

// New API endpoint for images with a 1 second delay
app.get("/api/images", async (req: Request, res: Response) => {
  // Wait for 1 second before responding
  await waitDuration(1000);
  res.json(IMAGES);
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
