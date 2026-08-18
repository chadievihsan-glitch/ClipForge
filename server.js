const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const ytDlp = require("yt-dlp-exec");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const OUTPUT_DIR = path.join(os.tmpdir(), "clipforge");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}


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
        ai: "free",
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
   DOWNLOAD + CREATE CLIP
========================= */

app.post("/api/create-clips", async (req, res) => {

    let inputFile = null;
    let outputFile = null;

    try {

        const { videoUrl } = req.body;

        if (!videoUrl) {

            return res.status(400).json({
                success: false,
                error: "Geen video-link ontvangen."
            });

        }

        if (
            !videoUrl.startsWith("https://") &&
            !videoUrl.startsWith("http://")
        ) {

            return res.status(400).json({
                success: false,
                error: "Ongeldige video-link."
            });

        }


        const id =
            Date.now().toString();

        inputFile =
            path.join(
                OUTPUT_DIR,
                `${id}-input.mp4`
            );

        outputFile =
            path.join(
                OUTPUT_DIR,
                `${id}-clip.mp4`
            );


        console.log(
            "Video downloaden:",
            videoUrl
        );


        /*
        Download de video.
        Gebruik alleen video's waarvoor
        je toestemming hebt om ze te verwerken.
        */

        await ytDlp(
            videoUrl,
            {
                output: inputFile,
                format:
                    "best[ext=mp4]/best",
                noPlaylist: true,
                maxFilesize: "500M"
            }
        );


        if (!fs.existsSync(inputFile)) {

            throw new Error(
                "Video kon niet worden gedownload."
            );

        }


        console.log(
            "Video gedownload."
        );


        /*
        Maak een echte MP4 clip
        van de eerste 30 seconden.
        */

        await new Promise(
            (resolve, reject) => {

                const command =
                    `ffmpeg -y -i "${inputFile}" ` +
                    `-t 30 ` +
                    `-c:v libx264 ` +
                    `-preset veryfast ` +
                    `-c:a aac ` +
                    `"${outputFile}"`;

                exec(
                    command,
                    (error, stdout, stderr) => {

                        if (error) {

                            console.error(
                                stderr
                            );

                            reject(error);

                            return;
                        }

                        resolve();

                    }
                );

            }
        );


        if (!fs.existsSync(outputFile)) {

            throw new Error(
                "MP4 clip kon niet worden gemaakt."
            );

        }


        console.log(
            "Clip gemaakt:",
            outputFile
        );


        res.download(
            outputFile,
            "clipforge-clip.mp4",
            (error) => {

                if (error) {
                    console.error(error);
                }

                /*
                Tijdelijke bestanden verwijderen
                */

                try {

                    if (
                        inputFile &&
                        fs.existsSync(inputFile)
                    ) {
                        fs.unlinkSync(inputFile);
                    }

                    if (
                        outputFile &&
                        fs.existsSync(outputFile)
                    ) {
                        fs.unlinkSync(outputFile);
                    }

                } catch (cleanupError) {

                    console.error(
                        cleanupError
                    );

                }

            }
        );


    } catch (error) {

        console.error(
            "CLIP ERROR:",
            error
        );


        /*
        Opruimen als er iets fout gaat.
        */

        try {

            if (
                inputFile &&
                fs.existsSync(inputFile)
            ) {
                fs.unlinkSync(inputFile);
            }

            if (
                outputFile &&
                fs.existsSync(outputFile)
            ) {
                fs.unlinkSync(outputFile);
            }

        } catch (cleanupError) {

            console.error(
                cleanupError
            );

        }


        res.status(500).json({

            success: false,

            error:
                error.message ||
                "Er ging iets fout bij het maken van de clip."

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
