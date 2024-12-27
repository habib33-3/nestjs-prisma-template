import * as dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

// Define environment variables with validation using Zod (optional but recommended)
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.coerce.number().min(1).max(65535),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export default env;
