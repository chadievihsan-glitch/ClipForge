const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const WAYIN_API =
    "https://wayinvideo-api.wayin.ai/api/v2";

const WAYIN_KEY =
    process.env.WAYIN_API_KEY;


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.send("ClipForge werkt! 🚀");

});


/* =========================
   TEST WAYIN
========================= */

app.get("/api/test-wayin", async (req, res) => {

    try {

        if (!WAYIN_KEY) {

            return res.status(500).json({
                success: false,
                error: "WAYIN_API_KEY ontbreekt."
            });

        }

        const response = await fetch(
            `${WAYIN_API}/clips`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${WAYIN_KEY}`,
                    "x-wayinvideo-api-version":
                        "v2"
                },

                body: JSON.stringify({})
            }
        );

        const data =
            await response.json();

        res.json({
            success: response.ok,
            status: response.status,
            wayinResponse: data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


/* =========================
   CREATE REAL CLIPS
========================= */

app.post("/api/create-clips", async (req, res) => {

    try {

        const { videoUrl } = req.body;


        if (!videoUrl) {

            return res.status(400).json({
                success: false,
                error: "Geen video-link."
            });

        }


        if (!WAYIN_KEY) {

            return res.status(500).json({
                success: false,
                error: "WAYIN_API_KEY ontbreekt."
            });

        }


        console.log(
            "Video ontvangen:",
            videoUrl
        );


        /* START AI */

        const createResponse =
            await fetch(
                `${WAYIN_API}/clips`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${WAYIN_KEY}`,

                        "x-wayinvideo-api-version":
                            "v2"

                    },

                    body: JSON.stringify({

                        video_url:
                            videoUrl,

                        project_name:
                            "ClipForge",

                        target_duration:
                            "DURATION_30_60",

                        enable_export:
                            true,

                        resolution:
                            "HD_720",

                        enable_caption:
                            true,

                        enable_ai_reframe:
                            true,

                        ratio:
                            "RATIO_9_16"

                    })

                }
            );


        const createData =
            await createResponse.json();


        console.log(
            "Wayin:",
            createData
        );


        if (!createResponse.ok) {

            return res.status(
                createResponse.status
            ).json({

                success: false,

                error:
                    createData.message ||
                    createData.error ||
                    "WayinVideo fout."

            });

        }


        const projectId =
            createData.data.id;


        /* WACHTEN OP AI */

        let result = null;


        for (
            let attempt = 0;
            attempt < 40;
            attempt++
        ) {

            console.log(
                `Controleren ${attempt + 1}/40`
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        15000
                    )
            );


            const resultResponse =
                await fetch(

                    `${WAYIN_API}/clips/results/${projectId}`,

                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${WAYIN_KEY}`,

                            "x-wayinvideo-api-version":
                                "v2"

                        }

                    }

                );


            result =
                await resultResponse.json();


            const status =
                result?.data?.status;


            console.log(
                "Status:",
                status
            );


            if (
                status === "SUCCEEDED"
            ) {

                break;

            }


            if (
                status === "FAILED"
            ) {

                return res.status(500).json({

                    success: false,

                    error:
                        result?.data?.error_message ||
                        "AI verwerking mislukt."

                });

            }

        }


        if (
            !result ||
            result?.data?.status !==
            "SUCCEEDED"
        ) {

            return res.status(408).json({

                success: false,

                error:
                    "De AI heeft te lang nodig."

            });

        }


        /* CLIPS */

        const wayinClips =
            result?.data?.clips || [];


        const clips =
            wayinClips.map(
                (clip, index) => ({

                    id:
                        index + 1,

                    title:
                        clip.title ||
                        `AI Clip ${index + 1}`,

                    score:
                        clip.viral_score ||
                        clip.score ||
                        0,

                    start:
                        clip.start_time ||
                        clip.start ||
                        "",

                    end:
                        clip.end_time ||
                        clip.end ||
                        "",

                    download:
                        clip.export_link ||
                        clip.download_url ||
                        ""

                })
            );


        res.json({

            success: true,

            clips: clips

        });


    } catch (error) {

        console.error(
            "ClipForge error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

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
