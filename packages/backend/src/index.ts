import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { ValidRoutes } from "./shared/ValidRoutes";
import { connectMongo } from "./connectMongo";
import { MongoClient } from "mongodb";
import { ImageProvider } from "./ImageProvider";
import { CredentialsProvider } from "./CredentialsProvider";
import { registerImageRoutes } from "./router/imageRoutes";
import { registerAuthRoutes } from "./router/authRoutes";
import { verifyAuthToken } from "./middleware";

dotenv.config();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR || "public";
const UPLOAD_DIR = process.env.IMAGE_UPLOAD_DIR || "uploads";
const JWT_SECRET = process.env.JWT_SECRET || "csc437-default-secret-key";

let mongoClient: MongoClient;
let imageProvider: ImageProvider;
let credentialsProvider: CredentialsProvider;

const app = express();
app.locals.JWT_SECRET = JWT_SECRET;
app.use(express.static(STATIC_DIR));

// Serve uploaded images from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "..", UPLOAD_DIR)));

app.use(express.json());

// Connect to MongoDB
(async () => {
  try {
    mongoClient = await connectMongo();
    imageProvider = new ImageProvider(mongoClient);
    credentialsProvider = new CredentialsProvider(mongoClient);
    console.log("MongoDB connection established successfully.");

    // Register routes after successful MongoDB connection
    app.use("/api/*", verifyAuthToken);
    registerImageRoutes(app, imageProvider);
    registerAuthRoutes(app, credentialsProvider);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
})();

app.get("/api/hello", (req: Request, res: Response) => {
  res.send("Hello, World");
});

// Dynamic route handler for all valid frontend routes
Object.values(ValidRoutes).forEach((route) => {
  app.get(route, (req: Request, res: Response) => {
    const indexPath = path.join(__dirname, "../../frontend/dist/index.html");
    res.sendFile(indexPath);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
