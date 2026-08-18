const express = require("express");
const cors = require("cors");

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
   BACKEND TEST
========================= */

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        backend: "online",
        ai: "free-demo",
        message: "ClipForge backend werkt!"
    });

});


/* =========================
   CREATE CLIPS
========================= */

app.post("/api/create-clips", async (req, res) => {

    try {

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
        GRATIS DEMO

        We maken hier tijdelijk
        clip-resultaten zonder
        betaalde AI API.
        */


        const clips = [

            {
                id: 1,

                title:
                    "🔥 Best Moment",

                score:
                    94,

                start:
                    "00:30",

                end:
                    "01:00",

                download:
                    null
            },

            {
                id: 2,

                title:
                    "🚀 Viral Moment",

                score:
                    89,

                start:
                    "02:10",

                end:
                    "02:40",

                download:
                    null
            },

            {
                id: 3,

                title:
                    "😂 Funny Moment",

                score:
                    86,

                start:
                    "04:20",

                end:
                    "04:50",

                download:
                    null
            }

        ];


        res.json({

            success:
                true,

            demo:
                true,

            message:
                "Gratis ClipForge demo",

            clips:
                clips

        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            success:
                false,

            error:
                error.message

        });

    }

});


/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    () => {

        console.log(
            `ClipForge draait op poort ${PORT}`
        );

    }
);
