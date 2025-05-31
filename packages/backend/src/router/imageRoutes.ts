import express, { Request, Response } from "express";
import { ImageProvider } from "../ImageProvider";
import { ObjectId } from "mongodb";

export function registerImageRoutes(
  app: express.Application,
  imageProvider: ImageProvider
) {
  // Updated API endpoint for images that fetches from MongoDB with denormalized author data
  app.get("/api/images", async (req: Request, res: Response) => {
    try {
      // Wait for 1 second before responding
      await waitDuration(1000);

      // Get images from database with authors denormalized (all images)
      const imagesWithAuthors = await imageProvider.getImagesWithAuthors();
      res.json(imagesWithAuthors);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // New endpoint to search images by name
  app.get("/api/images/search", async (req: Request, res: Response) => {
    try {
      const nameQuery = req.query.name as string;

      // Log the search query to confirm it's working
      console.log(`Searching for images with name containing: "${nameQuery}"`);

      if (!nameQuery) {
        res
          .status(400)
          .json({ error: "Search query parameter 'name' is required" });
      }

      // Use the updated getImagesWithAuthors method with the name query parameter
      const searchResults = await imageProvider.getImagesWithAuthors(nameQuery);
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching images:", error);
      res.status(500).json({ error: "Failed to search images" });
    }
  });

  // New endpoint to update image name with improved error handling
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
    }

    // Check if the name is too long
    if (name.length > MAX_NAME_LENGTH) {
      res.status(422).send({
        error: "Unprocessable Entity",
        message: `Image name exceeds ${MAX_NAME_LENGTH} characters`,
      });
    }

    // Check if the ID is a valid ObjectId
    if (!ObjectId.isValid(imageId)) {
      res.status(404).send({
        error: "Not Found",
        message: "Image does not exist",
      });
    }

    try {
      // Simulate some latency for better UX feedback
      await waitDuration(500);

      // Call the updateImageName method and get the matchedCount
      const matchedCount = await imageProvider.updateImageName(imageId, name);

      if (matchedCount > 0) {
        // Return 204 No Content for successful update
        res.status(204).send();
      } else {
        // Return 404 if no document matched the ID
        res.status(404).send({
          error: "Not Found",
          message: "Image does not exist",
        });
      }
    } catch (error) {
      console.error(`Error updating image name for ID ${imageId}:`, error);
      res.status(500).json({ error: "Failed to update image name" });
    }
  });
}

// Helper function for creating a delayed response
function waitDuration(numMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, numMs));
}
