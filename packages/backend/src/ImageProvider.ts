import { MongoClient, Collection, ObjectId } from "mongodb";
import { IApiImageData } from "./shared/types";

interface IImageDocument {
  _id: ObjectId;
  src: string;
  name: string;
  authorId: string;
}

interface IUserDocument {
  _id: ObjectId;
  username: string;
  name: string;
  avatarSrc: string;
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

  // getAllImages() {
  //   return this.imageCollection.find().toArray();
  // }
  async getImagesWithAuthors(nameQuery?: string): Promise<IApiImageData[]> {
    try {
      // Fetch images, with optional name filter
      let query = {};
      if (nameQuery) {
        // Case-insensitive partial match on the name field
        query = { name: { $regex: nameQuery, $options: "i" } };
      }

      const images = await this.imageCollection.find(query).toArray();

      // Transform images and provide default author information
      return images.map((image) => {
        const authorUsername = image.authorId;

        return {
          id: image._id.toString(),
          src: image.src,
          name: image.name,
          author: {
            id: authorUsername || "unknown",
            name: authorUsername || "Unknown User",
            avatarSrc: "/default-avatar.png",
          },
        };
      });
    } catch (error) {
      console.error("Error fetching images:", error);
      throw error;
    }
  }

  // Method to search images by name
  async searchImagesByName(nameQuery: string): Promise<IApiImageData[]> {
    return this.getImagesWithAuthors(nameQuery);
  }

  // Get an image by ID
  async getImageById(imageId: string): Promise<IImageDocument | null> {
    try {
      return await this.imageCollection.findOne({ _id: new ObjectId(imageId) });
    } catch (error) {
      console.error(`Error fetching image for ID ${imageId}:`, error);
      return null;
    }
  }

  // Method to update image name with owner verification
  async updateImageName(
    imageId: string,
    newName: string,
    username: string
  ): Promise<{ matchedCount: number; isOwner: boolean }> {
    try {
      // First, get the image to check ownership
      const image = await this.getImageById(imageId);

      // If image doesn't exist or user is not the owner
      if (!image) {
        return { matchedCount: 0, isOwner: false };
      }

      // Check if the current user is the owner of the image
      const isOwner = image.authorId === username;

      if (!isOwner) {
        return { matchedCount: 0, isOwner: false };
      }

      // If user is the owner, proceed with the update
      const result = await this.imageCollection.updateOne(
        { _id: new ObjectId(imageId) },
        { $set: { name: newName } }
      );

      return {
        matchedCount: result.matchedCount,
        isOwner: true,
      };
    } catch (error) {
      console.error(`Error updating image name for ID ${imageId}:`, error);
      return { matchedCount: 0, isOwner: false };
    }
  }

  // Method to save a new uploaded image
  async saveImage(
    filename: string,
    name: string,
    username: string
  ): Promise<string> {
    try {
      const result = await this.imageCollection.insertOne({
        _id: new ObjectId(),
        src: `/uploads/${filename}`,
        name: name,
        authorId: username,
      });

      return result.insertedId.toString();
    } catch (error) {
      console.error("Error saving image to database:", error);
      throw error;
    }
  }
}
