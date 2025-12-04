const fetch = require("node-fetch");

module.exports = function prodCatalogAuth(app) {
  const router = require("express").Router();

  router.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // adjust for production frontend URL
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });



  app.use("/api/prod-catalog/auth", router);
};
