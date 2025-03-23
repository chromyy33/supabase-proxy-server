// Helper function to generate a unique device ID
function generateDeviceId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return timestamp + random;
}

// New API endpoints
app.post("/api/check-activation", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, error: "Code is required" });
    }

    const cleanCode = code.replace(/-/g, "").toUpperCase();
    const { deviceId } = req.body;

    // Query for code
    const { data, error } = await supabase
      .from("Database")
      .select("*")
      .eq("code", cleanCode)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ valid: false, error: "Database error" });
    }

    if (!data) {
      return res
        .status(404)
        .json({ valid: false, error: "Invalid activation code" });
    }

    // Check if code is already used on another device
    if (data.deviceId && data.deviceId !== deviceId) {
      return res.status(400).json({
        valid: false,
        error: "This code is already activated on another device",
      });
    }

    // Check expiry date
    const serverDateStr = data.activeTill;
    const currentDate = new Date();
    const currentDateStr = currentDate.toLocaleDateString("en-CA");

    if (currentDateStr > serverDateStr) {
      // Update isActive to false
      await supabase
        .from("Database")
        .update({ isActive: false })
        .eq("code", cleanCode);

      return res.status(400).json({
        valid: false,
        error: "Your subscription has expired",
      });
    }

    // If no device ID is set, generate and set one
    if (!data.deviceId) {
      const newDeviceId = generateDeviceId();
      const { error: updateError } = await supabase
        .from("Database")
        .update({ deviceId: newDeviceId })
        .eq("code", cleanCode);

      if (updateError) {
        return res.status(500).json({
          valid: false,
          error: "Failed to activate code",
        });
      }

      return res.json({
        valid: true,
        data: {
          code: cleanCode,
          deviceId: newDeviceId,
          name: data.name,
          email: data.email,
          activeTill: data.activeTill,
          isActive: data.isActive,
        },
      });
    }

    // Return success with existing data
    return res.json({
      valid: true,
      data: {
        code: cleanCode,
        deviceId: data.deviceId,
        name: data.name,
        email: data.email,
        activeTill: data.activeTill,
        isActive: data.isActive,
      },
    });
  } catch (error) {
    console.error("Check activation error:", error);
    return res.status(500).json({
      valid: false,
      error: "Failed to check activation code",
    });
  }
});

app.post("/api/check-status", async (req, res) => {
  try {
    const { code, deviceId } = req.body;
    if (!code || !deviceId) {
      return res
        .status(400)
        .json({ success: false, error: "Code and deviceId are required" });
    }

    const cleanCode = code.replace(/-/g, "").toUpperCase();

    // Query the database
    const { data, error } = await supabase
      .from("Database")
      .select("*")
      .eq("code", cleanCode)
      .single();

    if (error || !data) {
      return res.json({ success: false, isLoggedIn: false });
    }

    // Check if device ID matches
    if (data.deviceId !== deviceId) {
      return res.json({ success: false, isLoggedIn: false });
    }

    // Check expiry date
    const serverDateStr = data.activeTill;
    const currentDate = new Date();
    const currentDateStr = currentDate.toLocaleDateString("en-CA");

    if (currentDateStr > serverDateStr || !data.isActive) {
      // Update isActive to false
      await supabase
        .from("Database")
        .update({ isActive: false })
        .eq("code", cleanCode);

      return res.json({
        success: false,
        isLoggedIn: false,
        data: {
          isActive: false,
        },
      });
    }

    return res.json({
      success: true,
      isLoggedIn: true,
      data: {
        isActive: data.isActive,
        name: data.name,
        email: data.email,
        activeTill: data.activeTill,
      },
    });
  } catch (error) {
    console.error("Check status error:", error);
    return res.status(500).json({ success: false, isLoggedIn: false });
  }
});

app.post("/api/deactivate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({ success: false, error: "Code is required" });
    }

    const cleanCode = code.replace(/-/g, "").toUpperCase();

    // Update database
    const { data, error } = await supabase
      .from("Database")
      .update({ deviceId: null, isActive: false })
      .eq("code", cleanCode)
      .select()
      .single();

    if (error) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to deactivate code" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Deactivate error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to deactivate code" });
  }
});

app.post("/api/update-expiry", async (req, res) => {
  try {
    const { code, expiryDate } = req.body;
    if (!code || !expiryDate) {
      return res
        .status(400)
        .json({ success: false, error: "Code and expiryDate are required" });
    }

    const cleanCode = code.replace(/-/g, "").toUpperCase();

    // Update database
    const { data, error } = await supabase
      .from("Database")
      .update({ activeTill: expiryDate })
      .eq("code", cleanCode)
      .select()
      .single();

    if (error) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to update expiry date" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Update expiry error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to update expiry date" });
  }
});

// Remove the old endpoints since we're now using the new API endpoints
app.get("/rest/v1/Database", async (req, res) => {
  res.status(410).json({
    error: "This endpoint is deprecated. Please use the new API endpoints.",
  });
});

app.patch("/rest/v1/Database", async (req, res) => {
  res.status(410).json({
    error: "This endpoint is deprecated. Please use the new API endpoints.",
  });
});

// ... existing server.listen code ...
