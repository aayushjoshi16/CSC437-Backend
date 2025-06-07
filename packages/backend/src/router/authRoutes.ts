import express from "express";
import type { Request, Response } from "express";
import { CredentialsProvider } from "../CredentialsProvider";
import jwt from "jsonwebtoken";

export interface IAuthTokenPayload {
  username: string;
}

function generateAuthToken(
  username: string,
  jwtSecret: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const payload: IAuthTokenPayload = {
      username,
    };
    jwt.sign(payload, jwtSecret, { expiresIn: "1d" }, (error, token) => {
      if (error) reject(error);
      else resolve(token as string);
    });
  });
}

export function registerAuthRoutes(
  app: express.Application,
  credentialsProvider: CredentialsProvider
) {
  app.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).send({
          error: "Bad request",
          message: "Missing username or password",
        });
        return;
      }

      // Register the user
      const success = await credentialsProvider.registerUser(
        username,
        password
      );
      if (success) {
        const jwtSecret = req.app.locals.JWT_SECRET;
        const token = await generateAuthToken(username, jwtSecret);

        // Return 201 Created with auth token
        res.status(201).json({
          username,
          token,
          message: "Registration successful",
        });
        return;
      } else {
        // Username already exists
        res.status(409).send({
          error: "Bad request",
          message: "Username already taken",
        });
        return;
      }
    } catch (error) {
      console.error("Error processing registration:", error);
      res.status(500).send({
        error: "Server error",
        message: "Failed to process registration",
      });
      return;
    }
  });

  app.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).send({
          error: "Bad request",
          message: "Missing username or password",
        });
        return;
      }

      // Verify password
      const isValid = await credentialsProvider.verifyPassword(
        username,
        password
      );

      if (isValid) {
        // Get JWT secret from app.locals
        const jwtSecret = req.app.locals.JWT_SECRET;

        // Generate JWT token
        const token = await generateAuthToken(username, jwtSecret);

        // Return token in response
        res.status(200).send({
          username,
          token,
          message: "Login successful",
        });
        return;
      } else {
        // Return 401 Unauthorized for invalid credentials
        res.status(401).send({
          error: "Authentication failed",
          message: "Incorrect username or password",
        });
        return;
      }
    } catch (error) {
      console.error("Error processing login:", error);
      res.status(500).send({
        error: "Server error",
        message: "Failed to process login",
      });
      return;
    }
  });
}
