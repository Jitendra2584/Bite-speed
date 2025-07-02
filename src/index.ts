import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { IdentifyRequestSchema } from "./zod";
import { contactService } from "./service/contact.service";
import { ZodError } from "zod";
import { Contacts } from "./entity/contacts";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(cors());
app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    // Routes
    app.get("/", (req, res) => {
      res.json({ message: "Bite speed Identity Service is running!" });
    });

    app.post("/identify", async (req, res) => {
      try {
        // Parse and validate input
        const { email, phoneNumber } = req.body ?? {};
        const parsedInput = IdentifyRequestSchema.parse({ email, phoneNumber });

        const contactIdentity =
          await contactService.identifyContact(parsedInput);

        res.status(200).json({
          message: "Contact identified successfully",
          contact: contactIdentity.contact ?? {},
        });
      } catch (error) {
        console.error("Error in /identify:", error);
        if (error instanceof ZodError) {
          // Handle validation errors
          res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        } else
          res.status(500).json({
            message: "Internal server error",
          });
      }
    });

    app.post("/clear-db", async (req, res) => {
      try {
        // Clear the database logic here
        await AppDataSource.getRepository(Contacts).clear();
        res.status(200).json({ message: "Database cleared successfully" });
      } catch (error) {
        console.error("Error clearing database:", error);
        res.status(500).json({ message: "Failed to clear database" });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error during Data Source initialization:", error);
  });
