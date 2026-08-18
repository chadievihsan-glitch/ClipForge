const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ClipForge werkt! 🚀");
});

app.listen(3000, () => {
  console.log("ClipForge draait op http://localhost:3000");
});