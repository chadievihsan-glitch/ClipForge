const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { google } = require("googleapis");

const app = express();

const PORT = process.env.PORT || 10000;

const FRONTEND_URL =
  "https://clipforge-we2q.onrender.com";

const REDIRECT_URI =
  `${FRONTEND_URL}/auth/youtube/callback`;


/* =========================
   MIDDLEWARE
========================= */

app.set("trust proxy", 1);

app.use(express.json());

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(session({
  secret:
    process.env.SESSION_SECRET ||
    "clipforge-secret-2026-change-this",

  resave: false,

  saveUninitialized: false,

  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));


/* =========================
   GOOGLE OAUTH
========================= */

function createOAuthClient() {

  return new google.auth.OAuth2(

    process.env.GOOGLE_CLIENT_ID,

    process.env.GOOGLE_CLIENT_SECRET,

    REDIRECT_URI

  );
}


/* =========================
   HOME / TEST
========================= */

app.get("/", (req, res) => {

  res.json({

    success: true,

    backend: "online",

    youtube: "ready",

    ffmpeg: true,

    message:
      "ClipForge backend werkt!"

  });

});


/* =========================
   CONNECT YOUTUBE
========================= */

app.get("/auth/youtube", (req, res) => {

  try {

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET
    ) {

      return res.status(500).json({

        success: false,

        error:
          "Google OAuth gegevens ontbreken op Render."

      });

    }


    const oauth =
      createOAuthClient();


    const authUrl =
      oauth.generateAuthUrl({

        access_type: "offline",

        prompt: "consent",

        scope: [
          "https://www.googleapis.com/auth/youtube.upload"
        ]

      });


    res.redirect(authUrl);


  } catch (error) {

    console.error(
      "YouTube start error:",
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
   YOUTUBE CALLBACK
========================= */

app.get(
  "/auth/youtube/callback",
  async (req, res) => {

    try {

      const code =
        req.query.code;


      if (!code) {

        return res.status(400).send(
          "Geen Google authorization code."
        );

      }


      const oauth =
        createOAuthClient();


      const result =
        await oauth.getToken(code);


      const tokens =
        result.tokens;


      oauth.setCredentials(tokens);


      const youtube =
        google.youtube({

          version: "v3",

          auth: oauth

        });


      const response =
        await youtube.channels.list({

          part: "snippet",

          mine: true

        });


      const channel =
        response.data.items?.[0];


      if (!channel) {

        return res.status(400).send(
          "Geen YouTube-kanaal gevonden."
        );

      }


      req.session.youtube = {

        connected: true,

        tokens: tokens,

        channel: {

          id: channel.id,

          title:
            channel.snippet.title,

          thumbnail:
            channel.snippet.thumbnails
              ?.default?.url || ""

        }

      };


      res.redirect(
        `${FRONTEND_URL}/?youtube=connected`
      );


    } catch (error) {

      console.error(
        "YouTube callback error:",
        error
      );


      res.status(500).send(
        "YouTube verbinden mislukt: " +
        error.message
      );

    }

  }
);


/* =========================
   YOUTUBE STATUS
========================= */

app.get(
  "/api/youtube/status",
  (req, res) => {

    const youtube =
      req.session.youtube;


    if (
      youtube &&
      youtube.connected
    ) {

      return res.json({

        connected: true,

        channel:
          youtube.channel

      });

    }


    res.json({

      connected: false

    });

  }
);


/* =========================
   DISCONNECT YOUTUBE
========================= */

app.post(
  "/api/youtube/disconnect",
  (req, res) => {

    req.session.youtube = null;


    res.json({

      success: true,

      connected: false

    });

  }
);


/* =========================
   TEST YOUTUBE CONFIG
========================= */

app.get(
  "/api/youtube/config",
  (req, res) => {

    res.json({

      googleClientId:
        Boolean(
          process.env.GOOGLE_CLIENT_ID
        ),

      googleClientSecret:
        Boolean(
          process.env.GOOGLE_CLIENT_SECRET
        ),

      sessionSecret:
        Boolean(
          process.env.SESSION_SECRET
        ),

      redirectUri:
        REDIRECT_URI

    });

  }
);


/* =========================
   SERVER
========================= */

app.listen(
  PORT,
  () => {

    console.log(
      `ClipForge backend running on port ${PORT}`
    );

  }
);
