const express = require("express");
const nodemailer = require('nodemailer');
const port = process.env.PORT || 8000
const path = require("path")
const hbs = require('hbs');
const { google } = require("googleapis");
const { log } = require("console");
const OAuth2 = google.auth.OAuth2;
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const { job } = require("./cron.js");

const publicPath = path.join(__dirname, "/public");
app.use(express.static(publicPath));
const partialPath = path.join(__dirname, "/partials");
hbs.registerPartials(partialPath);

app.set("view engine", "hbs")
app.use(express.urlencoded());
app.use(express.json());
job.start();
app.get("/", (req, res) => {
  res.render("index")
})

app.get("/contact", (req, res) => {

  res.render("contactPage");
})

app.post("/contact", (req, res) => {
  const createTransporter = async () => {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.log(err);
        }
        resolve(token);
      });
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    return transporter;

  };

  const sendmail = async (mailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(mailOptions);
  }

  sendmail({
    subject: `Message from a website visitor - ${req.body.name}`,
    text: `${req.body.email}` + `\n` + req.body.message,
    from: req.body.email,
    to: process.env.EMAIL,

  })
  res.redirect("/contact");
})
app.get("/privacy", (req, res) => {
  res.render("privacy");
})

app.get("*", (req, res) => {
  res.render("404")
})
app.listen(port, (req, res) => {
  console.log("Server Started");
});