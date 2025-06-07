import express, { Request, Response } from "express";
import { ImageProvider } from "../ImageProvider";
import { ObjectId } from "mongodb";
import {
  imageMiddlewareFactory,
  handleImageFileErrors,
} from "../imageUploadMiddleware";

// Extend the Express Request type to include file from multer
declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
  }
}

export function registerImageRoutes(
  app: express.Application,
  imageProvider: ImageProvider
) {
  // Updated API endpoint for images that fetches from MongoDB with denormalized author data
  app.get("/api/images", async (req: Request, res: Response) => {
    try {
      await waitDuration();

      // Get images from database with authors denormalized (all images)
      const imagesWithAuthors = await imageProvider.getImagesWithAuthors();
      res.json(imagesWithAuthors);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
      return;
    }
  });

  // Search images by name
  app.get("/api/images/search", async (req: Request, res: Response) => {
    try {
      const nameQuery = req.query.name as string;

      // Log the search query to confirm it's working
      console.log(`Searching for images with name containing: "${nameQuery}"`);

      if (!nameQuery) {
        res
          .status(400)
          .json({ error: "Search query parameter 'name' is required" });
        return;
      }

      const searchResults = await imageProvider.getImagesWithAuthors(nameQuery);
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching images:", error);
      res.status(500).json({ error: "Failed to search images" });
      return;
    }
  });

  // Update image name with improved error handling and authorization
  app.patch("/api/images/:id", async (req: Request, res: Response) => {
    const imageId = req.params.id;
    const { name } = req.body;
    const MAX_NAME_LENGTH = 100;

    // Check if the request body has a name property
    if (!name) {
      res.status(400).send({
        error: "Bad Request",
        message: "Name field is required in request body",
      });
      return;
    }

    // Check if the name is too long
    if (name.length > MAX_NAME_LENGTH) {
      res.status(422).send({
        error: "Unprocessable Entity",
        message: `Image name exceeds ${MAX_NAME_LENGTH} characters`,
      });
      return;
    }

    // Check if the ID is a valid ObjectId
    if (!ObjectId.isValid(imageId)) {
      res.status(404).send({
        error: "Not Found",
        message: "Image does not exist",
      });
      return;
    }

    try {
      // Simulate some latency
      await waitDuration();
      // Get the username from the authenticated user
      if (!req.user || !req.user.username) {
        res.status(401).send({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const username = req.user?.username || "";

      // Verify ownership
      const { matchedCount, isOwner } = await imageProvider.updateImageName(
        imageId,
        name,
        username
      );

      // If the user is not the owner of the image
      if (!isOwner) {
        res.status(403).send({
          error: "Forbidden",
          message: "You are not authorized to edit this image",
        });
        return;
      }

      if (matchedCount > 0) {
        // Return 204 No Content for successful update
        res.status(204).send();
        return;
      } else {
        // Return 404 if no document matched the ID
        res.status(404).send({
          error: "Not Found",
          message: "Image does not exist",
        });
        return;
      }
    } catch (error) {
      console.error(`Error updating image name for ID ${imageId}:`, error);
      res.status(500).json({ error: "Failed to update image name" });
      return;
    }
  });

  app.post(
    "/api/images",
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response) => {
      try {
        // Image was successfully uploaded
        if (!req.file) {
          res.status(400).send({
            error: "Bad Request",
            message: "No image file was provided",
          });
          return;
        }

        if (!req.user?.username) {
          res.status(401).send({
            error: "Unauthorized",
            message: "User information missing",
          });
          return;
        }

        // Get image name from form
        const imageName = req.body.name || "Untitled image";

        // Save the image metadata to the database
        try {
          const imageId = await imageProvider.saveImage(
            req.file.filename,
            imageName,
            req.user.username
          );

          // Return success
          res.status(201).json({
            message: "Image uploaded successfully",
            id: imageId,
            name: imageName,
            src: `/uploads/${req.file.filename}`,
            file: req.file,
          });
        } catch (dbError) {
          console.error("Error saving image to database:", dbError);
          res.status(500).send({
            error: "Server Error",
            message: "Failed to save image metadata to database",
          });
        }
      } catch (error) {
        console.error("Error processing uploaded image:", error);
        res.status(500).send({
          error: "Server Error",
          message: "Failed to process the uploaded image",
        });
      }
    }
  );
}

// Helper function for creating a delayed response with random time
function waitDuration(): Promise<void> {
  const randomDelay = Math.random() * 5000;
  return new Promise((resolve) => setTimeout(resolve, randomDelay));
}
