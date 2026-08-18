const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const uploadDir = path.join(os.tmpdir(), "clipforge-uploads");
const outputDir = path.join(os.tmpdir(), "clipforge-output");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    backend: "online",
    ffmpeg: true,
    message: "ClipForge backend werkt!"
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    backend: "online"
  });
});

app.get("/api/ffmpeg-test", (req, res) => {
  execFile("ffmpeg", ["-version"], (error, stdout) => {
    if (error) {
      return res.status(500).json({
        success: false,
        ffmpeg: false
      });
    }

    res.json({
      success: true,
      ffmpeg: true,
      version: stdout.split("\n")[0]
    });
  });
});

app.post("/api/upload-clip", upload.single("video"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Geen video ontvangen."
    });
  }

  const input = req.file.path;

  const output = path.join(
    outputDir,
    `clip-${Date.now()}.mp4`
  );

  console.log("Video ontvangen:", req.file.originalname);

  execFile(
    "ffmpeg",
    [
      "-y",
      "-i", input,

      "-t", "30",

      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",

      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",

      "-c:a", "aac",
      "-b:a", "128k",

      "-movflags", "+faststart",

      output
    ],
    (error, stdout, stderr) => {

      try {
        fs.unlinkSync(input);
      } catch {}

      if (error) {

        console.error(stderr);

        return res.status(500).json({
          success: false,
          error: "FFmpeg kon de video niet verwerken.",
          details: stderr.slice(-2000)
        });
      }

      if (!fs.existsSync(output)) {
        return res.status(500).json({
          success: false,
          error: "FFmpeg heeft geen MP4 gemaakt."
        });
      }

      console.log("✅ Clip gemaakt:", output);

      res.download(
        output,
        "clipforge-short.mp4",
        () => {
          try {
            fs.unlinkSync(output);
          } catch {}
        }
      );
    }
  );
});

app.listen(PORT, () => {
  console.log(`ClipForge draait op poort ${PORT}`);
});
