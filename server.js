const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
    res.send("ClipForge werkt! 🚀");
});


/* =========================
   STATUS
========================= */

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        backend: "online",
        ai: "free-demo",
        ffmpeg: true,
        message: "ClipForge backend werkt!"
    });

});


/* =========================
   FFMPEG TEST
========================= */

app.get("/api/ffmpeg-test", (req, res) => {

    exec("ffmpeg -version", (error, stdout) => {

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


/* =========================
   CREATE CLIPS
========================= */

app.post("/api/create-clips", (req, res) => {

    const { videoUrl } = req.body;


    if (!videoUrl) {

        return res.status(400).json({

            success: false,

            error:
                "Geen video-link ontvangen."

        });

    }


    console.log(
        "Video ontvangen:",
        videoUrl
    );


    /*
      TIJDELIJKE DEMO

      We gebruiken hier geen
      yt-dlp-exec meer.
    */

    const clips = [

        {
            id: 1,
            title: "🔥 Best Moment",
            score: 94,
            start: "00:30",
            end: "01:00",
            download: null
        },

        {
            id: 2,
            title: "🚀 Viral Moment",
            score: 89,
            start: "02:10",
            end: "02:40",
            download: null
        },

        {
            id: 3,
            title: "😂 Funny Moment",
            score: 86,
            start: "04:20",
            end: "04:50",
            download: null
        }

    ];


    res.json({

        success: true,

        demo: true,

        message:
            "ClipForge demo werkt!",

        clips

    });

});


/* =========================
   START
========================= */

app.listen(
    PORT,
    () => {

        console.log(
            `ClipForge draait op poort ${PORT}`
        );

    }
);
