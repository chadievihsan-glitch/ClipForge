const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { google } = require("googleapis");

const app = express();

const PORT = process.env.PORT || 10000;

const BACKEND_URL =
  "https://clipforge-we2q.onrender.com";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://clipforge-we2q.onrender.com";

const REDIRECT_URI =
  `${BACKEND_URL}/auth/youtube/callback`;


/* =========================
   MIDDLEWARE
========================= */

app.set("trust proxy", 1);

app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);


/* =========================
   SESSION
========================= */

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "CHANGE_THIS_SESSION_SECRET",

    resave: false,

    saveUninitialized: false,

    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge:
        7 * 24 * 60 * 60 * 1000
    }
  })
);


/* =========================
   GOOGLE OAUTH
========================= */

function createOAuthClient() {

  const clientId =
    process.env.GOOGLE_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET;


  if (!clientId) {

    throw new Error(
      "GOOGLE_CLIENT_ID ontbreekt op Render."
    );

  }


  if (!clientSecret) {

    throw new Error(
      "GOOGLE_CLIENT_SECRET ontbreekt op Render."
    );

  }


  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );
}


/* =========================
   HOME
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
   YOUTUBE CONNECT
========================= */

app.get(
  "/auth/youtube",
  (req, res) => {

    try {

      const oauth =
        createOAuthClient();


      const authUrl =
        oauth.generateAuthUrl({

          access_type: "offline",

          prompt: "consent",

          scope: [

            "https://www.googleapis.com/auth/youtube.upload",

            "https://www.googleapis.com/auth/youtube.readonly"

          ]

        });


      res.redirect(authUrl);


    } catch (error) {

      console.error(
        "YouTube OAuth error:",
        error
      );


      res.status(500).json({

        success: false,

        error:
          error.message

      });

    }

  }
);


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

        return res
          .status(400)
          .send(
            "Geen Google authorization code."
          );

      }


      const oauth =
        createOAuthClient();


      const result =
        await oauth.getToken(code);


      const tokens =
        result.tokens;


      oauth.setCredentials(
        tokens
      );


      const youtube =
        google.youtube({

          version: "v3",

          auth: oauth

        });


      /*
        Haal het kanaal van de
        ingelogde gebruiker op.
      */

      const response =
        await youtube.channels.list({

          part: "snippet",

          mine: true

        });


      const channel =
        response.data.items?.[0];


      if (!channel) {

        return res
          .status(400)
          .send(
            "Geen YouTube-kanaal gevonden."
          );

      }


      req.session.youtube = {

        connected: true,

        tokens: tokens,

        channel: {

          id:
            channel.id,

          title:
            channel.snippet?.title ||
            "YouTube Channel",

          thumbnail:
            channel.snippet
              ?.thumbnails
              ?.default
              ?.url || ""

        }

      };


      req.session.save(() => {

        res.redirect(
          `${FRONTEND_URL}/?youtube=connected`
        );

      });


    } catch (error) {

      console.error(
        "YouTube callback error:",
        error
      );


      res
        .status(500)
        .send(
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
   DISCONNECT
========================= */

app.post(
  "/api/youtube/disconnect",
  (req, res) => {

    req.session.youtube =
      null;


    req.session.save(() => {

      res.json({

        success: true,

        connected: false

      });

    });

  }
);


/* =========================
   CONFIG TEST
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

      frontendUrl:
        FRONTEND_URL,

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
