const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { google } = require("googleapis");

const app = express();

app.use(express.json());

app.use(cors({
  origin: "https://clipforge-we2q.onrender.com",
  credentials: true
}));

app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

const PORT = process.env.PORT || 10000;

const REDIRECT_URI =
  "https://clipforge-we2q.onrender.com/auth/youtube/callback";

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}


/* =========================
   TEST
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    backend: "online",
    youtube: "ready",
    message: "ClipForge backend werkt!"
  });
});


/* =========================
   CONNECT YOUTUBE
========================= */

app.get("/auth/youtube", (req, res) => {

  try {

    const oauth = createOAuthClient();

    const url = oauth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload"
      ]
    });

    res.redirect(url);

  } catch (error) {

    console.error(error);

    res.status(500).send(
      "YouTube verbinding kon niet gestart worden."
    );
  }
});


/* =========================
   YOUTUBE CALLBACK
========================= */

app.get("/auth/youtube/callback", async (req, res) => {

  try {

    const code = req.query.code;

    if (!code) {
      return res.status(400).send(
        "Geen Google authorization code ontvangen."
      );
    }

    const oauth = createOAuthClient();

    const { tokens } =
      await oauth.getToken(code);

    oauth.setCredentials(tokens);

    const youtube = google.youtube({
      version: "v3",
      auth: oauth
    });

    const result =
      await youtube.channels.list({
        part: "snippet",
        mine: true
      });

    const channel =
      result.data.items &&
      result.data.items[0];

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
        title: channel.snippet.title,
        thumbnail:
          channel.snippet.thumbnails?.default?.url || ""
      }
    };

    res.redirect(
      "https://clipforge-we2q.onrender.com/?youtube=connected"
    );

  } catch (error) {

    console.error(
      "YouTube OAuth error:",
      error
    );

    res.status(500).send(
      "YouTube verbinden mislukt: " +
      error.message
    );
  }
});


/* =========================
   YOUTUBE STATUS
========================= */

app.get("/api/youtube/status", (req, res) => {

  if (
    req.session.youtube &&
    req.session.youtube.connected
  ) {

    return res.json({
      connected: true,
      channel: req.session.youtube.channel
    });
  }

  res.json({
    connected: false
  });
});


/* =========================
   DISCONNECT
========================= */

app.post("/api/youtube/disconnect", (req, res) => {

  req.session.youtube = null;

  res.json({
    success: true
  });
});


/* =========================
   SERVER
========================= */

app.listen(PORT, () => {

  console.log(
    `ClipForge running on port ${PORT}`
  );

});
