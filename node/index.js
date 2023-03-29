const express = require("express");
const cors = require("cors");

const { google } = require("googleapis");

const CLIENT_ID =
  "965144383271-bgalndtd6cvp4mqjr47tl58h0o61i9b8.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3000/callback";

const port = 3001;
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

app.get("/auth", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  //issue with google api cors should be (res.redirect) instead of res.send
  res.send(authUrl);
});

app.post("/signout", async (req, res) => {
  try {
    const { token } = req.query;
    const response = await oauth2Client.revokeToken(token);
    console.log("Token revoked:", response.data);
    res.send();
  } catch (error) {
    console.error("Error revoking token:", error.message);
  }
});

app.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    //get the messages in the authenticated user
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const {
      data: { emailAddress },
    } = await gmail.users.getProfile({ userId: "me" });
    const {
      data: { messages },
    } = await gmail.users.messages.list({ userId: "me" });

    let fullMessages = [];

    //loop all the messageList to get additional data
    for (const message of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const headers = fullMessage.data.payload.headers;
      const messageData = {
        id: message.id,
        content: fullMessage.data.snippet,
        subject: headers.find((header) => header.name === "Subject").value,
        sender: headers.find((header) => header.name === "From").value,
        receiver: headers.find((header) => header.name === "To").value,
        date: headers.find((header) => header.name === "Date").value,
      };
      fullMessages.push({ ...messageData });
    }

    res.send({ emailAddress, fullMessages, token: tokens.access_token });
  } catch (error) {
    // console.error("Error retrieving access token:", error);
    res.status(500).send("Error retrieving access token");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
