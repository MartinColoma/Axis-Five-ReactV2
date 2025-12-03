const fetch = require("node-fetch");

module.exports = function contactUsRoutes(app) {
  const router = require("express").Router();

  router.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // adjust for production frontend URL
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  router.post("/", async (req, res) => {
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }

      // Forward to Vercel API serverless function for sending email
      const vercelResponse = await fetch("https://axis-five-api.vercel.app/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const vercelData = await vercelResponse.json();

      if (!vercelResponse.ok) {
        return res.status(vercelResponse.status).json({
          success: false,
          message: vercelData.message || "Failed to send message via Vercel",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Message sent successfully via Vercel!",
        data: vercelData,
      });
    } catch (error) {
      console.error("❌ Error forwarding contact message:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
    }
  });

  app.use("/api/landing/contact-us", router);
};
