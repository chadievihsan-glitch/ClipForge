const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// HOME
app.get("/", (req, res) => {
    res.send("ClipForge werkt! 🚀");
});


// CREATE CLIPS
app.post("/api/create-clips", (req, res) => {

    const videoUrl = req.body.videoUrl;

    if (!videoUrl) {
        return res.status(400).json({
            success: false,
            error: "Geen video-link."
        });
    }

    console.log("Video ontvangen:", videoUrl);


    // TEST RESULTATEN
    const clips = [

        {
            id: 1,
            title: "🔥 Best Moment",
            score: 94,
            start: "00:42",
            end: "01:18"
        },

        {
            id: 2,
            title: "🚀 Viral Moment",
            score: 89,
            start: "03:14",
            end: "03:51"
        },

        {
            id: 3,
            title: "😂 Funny Moment",
            score: 86,
            start: "07:21",
            end: "07:58"
        }

    ];


    res.json({
        success: true,
        clips: clips
    });

});


// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `ClipForge backend draait op poort ${PORT}`
    );

});
