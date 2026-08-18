app.get("/api/test-wayin", async (req, res) => {

    try {

        if (!process.env.WAYIN_API_KEY) {
            return res.status(500).json({
                success: false,
                error: "WAYIN_API_KEY wordt niet gevonden."
            });
        }

        const response = await fetch(
            "https://wayinvideo-api.wayin.ai/api/v2/clips",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.WAYIN_API_KEY}`,
                    "x-wayinvideo-api-version": "v2"
                },

                body: JSON.stringify({})
            }
        );

        const data = await response.json();

        res.json({
            success: response.ok,
            status: response.status,
            wayinResponse: data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});
