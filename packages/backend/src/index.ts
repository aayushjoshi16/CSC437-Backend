import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { ValidRoutes } from "./shared/ValidRoutes";
import { connectMongo } from "./connectMongo";
import { MongoClient } from "mongodb";
import { ImageProvider } from "./ImageProvider";
import { registerImageRoutes } from "./router/imageRoutes";

dotenv.config(); // Read the .env file in the current working directory, and load values into process.env.
const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || "public";

let mongoClient: MongoClient;
let imageProvider: ImageProvider;

const app = express();
app.use(express.static(STATIC_DIR));
app.use(express.json());

// Connect to MongoDB
(async () => {
  try {
    mongoClient = await connectMongo();
    imageProvider = new ImageProvider(mongoClient);
    console.log("MongoDB connection established successfully.");
    
    // Register image routes after imageProvider is initialized
    registerImageRoutes(app, imageProvider);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
})();

app.get("/api/hello", (req: Request, res: Response) => {
  res.send("Hello, World");
});

// Replace the individual route with a dynamic route handler for all valid frontend routes
Object.values(ValidRoutes).forEach((route) => {
  app.get(route, (req: Request, res: Response) => {
    const indexPath = path.join(__dirname, "../../frontend/dist/index.html");
    res.sendFile(indexPath);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
