import { MongoClient, Collection, ObjectId } from "mongodb";
import { IApiImageData } from "./shared/types";

interface IImageDocument {
  _id: ObjectId;
  src: string;
  name: string;
  authorId: string; // This contains usernames, not ObjectIds
}

interface IUserDocument {
  _id: ObjectId;
  username: string; // Username field to match against authorId
  name: string;
  avatarSrc: string;
  // Add any other fields that might be in your user documents
}

export class ImageProvider {
  private imageCollection: Collection<IImageDocument>;
  private userCollection: Collection<IUserDocument>;

  constructor(private readonly mongoClient: MongoClient) {
    const imagesCollectionName = process.env.IMAGES_COLLECTION_NAME;
    const usersCollectionName = process.env.USERS_COLLECTION_NAME;

    if (!imagesCollectionName) {
      throw new Error(
        "Missing IMAGES_COLLECTION_NAME from environment variables"
      );
    }

    if (!usersCollectionName) {
      throw new Error(
        "Missing USERS_COLLECTION_NAME from environment variables"
      );
    }

    this.imageCollection = this.mongoClient
      .db()
      .collection(imagesCollectionName);
    this.userCollection = this.mongoClient.db().collection(usersCollectionName);
  }

  getAllImages() {
    return this.imageCollection.find().toArray(); // For direct DB access
  }

  async getImagesWithAuthors(): Promise<IApiImageData[]> {
    try {
      // Step 1: Fetch all images
      const images = await this.imageCollection.find().toArray();

      // Step 2: Extract unique author IDs (usernames)
      const authorUsernames = [...new Set(images.map((img) => img.authorId))];

      console.log("Unique author usernames:", authorUsernames);

      // Step 3: Fetch all users that match these usernames
      let authorMap = new Map<string, IUserDocument>();

      if (authorUsernames.length > 0) {
        const authors = await this.userCollection
          .find({
            username: { $in: authorUsernames },
          })
          .toArray();

        // Log the found authors to debug
        console.log("Found authors:", authors.length);
        console.log("Sample author data:", authors[0] || "No authors found");

        // Step 4: Create a map of username to author data for quick lookups
        authors.forEach((author) => {
          authorMap.set(author.username, author);
        });
      }

      // Step 5: Transform image data to match IApiImageData
      return images.map((image) => {
        const authorUsername = image.authorId;
        const author = authorMap.get(authorUsername);

        if (!author) {
          console.log(`Author not found for username: ${authorUsername}`);
          // Provide complete fallback author data for missing authors
          return {
            id: image._id.toString(),
            src: image.src,
            name: image.name,
            author: {
              id: authorUsername || "unknown",
              name: `${authorUsername || "Unknown"} (No profile)`,
              avatarSrc: "/default-avatar.png",
            },
          };
        }

        // Ensure all required fields are present
        return {
          id: image._id.toString(),
          src: image.src,
          name: image.name,
          author: {
            id: author.username,
            name: author.name || `${author.username}`,
            avatarSrc: author.avatarSrc || "/default-avatar.png",
          },
        };
      });
    } catch (error) {
      console.error("Error fetching images with authors:", error);
      throw error;
    }
  }

  // Method to add to support name update functionality
  async updateImageName(imageId: string, newName: string): Promise<boolean> {
    try {
      const result = await this.imageCollection.updateOne(
        { _id: new ObjectId(imageId) },
        { $set: { name: newName } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`Error updating image name for ID ${imageId}:`, error);
      return false;
    }
  }
}
