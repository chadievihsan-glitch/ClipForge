const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();

const PORT = process.env.PORT || 10000;

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "clips");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(uploadDir));
app.use("/clips", express.static(outputDir));

const storage = multer.diskStorage({
  destination: uploadDir,

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const name =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 9) +
      ext;

    cb(null, name);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 500 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska"
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed."));
    }
  }
});


/* =========================
   STATUS
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    backend: "online",
    ai: "free-demo",
    ffmpeg: true,
    message: "ClipForge backend werkt!"
  });
});


/* =========================
   CREATE CLIP
========================= */

app.post("/api/create-clip", upload.single("video"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Geen video ontvangen."
    });
  }

  const input = req.file.path;

  const outputName =
    "clip-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2, 7) +
    ".mp4";

  const output =
    path.join(outputDir, outputName);

  /*
    Test clip:
    - eerste 15 seconden
    - H264 video
    - AAC audio
  */

  const args = [
    "-y",
    "-i",
    input,
    "-t",
    "15",
    "-vf",
    "scale=-2:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    output
  ];

  execFile("ffmpeg", args, (error, stdout, stderr) => {

    if (error) {

      console.error("FFMPEG ERROR:");
      console.error(stderr);

      return res.status(500).json({
        success: false,
        error: "FFmpeg kon de video niet verwerken.",
        details: stderr
      });
    }

    /*
      Originele upload verwijderen
    */

    try {
      fs.unlinkSync(input);
    } catch {}

    const baseUrl =
      `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,

      clip: {
        name: outputName,
        url: `${baseUrl}/clips/${outputName}`
      }
    });

  });

});


/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({
    success: false,
    error: err.message || "Server error"
  });

});


/* =========================
   START
========================= */

app.listen(PORT, () => {

  console.log(
    `ClipForge running on port ${PORT}`
  );

});
