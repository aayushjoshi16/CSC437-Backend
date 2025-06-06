import { Collection, MongoClient } from "mongodb";
import bcrypt from "bcrypt";

interface ICredentialsDocument {
  username: string;
  password: string;
}

export class CredentialsProvider {
  private readonly collection: Collection<ICredentialsDocument>;

  constructor(mongoClient: MongoClient) {
    const COLLECTION_NAME = process.env.CREDS_COLLECTION_NAME;
    if (!COLLECTION_NAME) {
      throw new Error("Missing CREDS_COLLECTION_NAME from env file");
    }
    this.collection = mongoClient
      .db()
      .collection<ICredentialsDocument>(COLLECTION_NAME);
  }

  async registerUser(username: string, plaintextPassword: string) {
    // Check if user already exists
    const existingUser = await this.collection.findOne({ username });
    if (existingUser) {
      return false;
    }

    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plaintextPassword, salt);

    // Store the user in the database
    await this.collection.insertOne({
      username,
      password: hashedPassword,
    });

    return true;
  }

  async verifyPassword(username: string, plaintextPassword: string) {
    // Find user by username
    const user = await this.collection.findOne({ username });
    if (!user) {
      return false;
    }

    // Compare the provided password with the stored hash
    // bcrypt.compare handles extracting the salt from the hash
    const isPasswordValid = await bcrypt.compare(
      plaintextPassword,
      user.password
    );
    return isPasswordValid;
  }
}
