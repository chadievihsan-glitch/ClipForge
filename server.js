const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(os.tmpdir(), "clipforge-uploads");
const outputDir = path.join(os.tmpdir(), "clipforge-clips");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});


/* HOME */

app.get("/", (req, res) => {
  res.send("ClipForge werkt! 🚀");
});


/* STATUS */

app.get("/api/status", (req, res) => {

  res.json({
    success: true,
    backend: "online",
    ffmpeg: true,
    message: "ClipForge backend werkt!"
  });

});


/* FFMPEG TEST */

app.get("/api/ffmpeg-test", (req, res) => {

  execFile("ffmpeg", ["-version"], (error, stdout) => {

    if (error) {

      return res.json({
        success: false,
        ffmpeg: false,
        error: error.message
      });

    }

    res.json({
      success: true,
      ffmpeg: true,
      version: stdout.split("\n")[0]
    });

  });

});


/* CREATE REAL CLIP */

app.post(
  "/api/upload-clip",
  upload.single("video"),
  (req, res) => {

    if (!req.file) {

      return res.status(400).json({
        success: false,
        error: "Geen video ontvangen."
      });

    }

    const input = req.file.path;

    const output = path.join(
      outputDir,
      `${Date.now()}-clip.mp4`
    );


    console.log(
      "Video ontvangen:",
      req.file.originalname
    );


    execFile(
      "ffmpeg",
      [
        "-y",
        "-i",
        input,

        "-t",
        "30",

        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",

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

        "-movflags",
        "+faststart",

        output
      ],
      (error, stdout, stderr) => {

        try {
          fs.unlinkSync(input);
        } catch {}


        if (error) {

          console.error(
            "FFMPEG ERROR:",
            stderr
          );

          return res.status(500).json({
            success: false,
            error:
              "FFmpeg kon de video niet verwerken."
          });

        }


        if (!fs.existsSync(output)) {

          return res.status(500).json({
            success: false,
            error:
              "Clip werd niet gemaakt."
          });

        }


        console.log(
          "Clip succesvol gemaakt."
        );


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

  }
);


/* START */

app.listen(PORT, () => {

  console.log(
    `ClipForge draait op poort ${PORT}`
  );

});
