import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith("https://")) {
  console.error("Invalid Supabase URL. Must start with https://");
  process.exit(1);
}

if (!supabaseKey) {
  console.error("Missing Supabase anon key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body) {
    console.log("Request Body:", req.body);
  }
  next();
});

// Helper function to clean code format
function cleanCode(code) {
  return code.replace(/-/g, "").toUpperCase();
}

// Database endpoints
app.get("/rest/v1/Database", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const cleanCode = code.replace(/-/g, "").toUpperCase();
    console.log("Querying Supabase for code:", cleanCode);

    // Query for code
    const { data, error } = await supabase
      .from("Database")
      .select("*")
      .eq("code", cleanCode)
      .single();

    if (error) {
      console.error("Supabase error details:", error);
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Invalid activation code" });
    }

    // Log the data we received
    console.log("Received data from database:", data);

    // Return success response
    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({
      error: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
});

app.patch("/rest/v1/Database", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const cleanCode = code.replace(/-/g, "").toUpperCase();
    console.log("Updating Supabase for code:", cleanCode);
    console.log("Update data:", req.body);

    // Update the database
    const { data, error } = await supabase
      .from("Database")
      .update(req.body)
      .eq("code", cleanCode)
      .select()
      .single();

    if (error) {
      console.error("Supabase error details:", error);
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Code not found" });
    }

    // Return success response
    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({
      error: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log("Handling Supabase requests directly");
});
