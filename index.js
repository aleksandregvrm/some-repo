require("dotenv").config();
const express = require("express");
const fileUpload = require("express-fileupload");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const axios = require("axios");
const { User } = require("./entities/User");
const { ConnectedUser } = require("./entities/ConnectedUser");
const { dataSource, connectToDatabase } = require("./db/posgreConnect");
const createJWT = require("./utils/jwt");
const { Server } = require("socket.io");
const cors = require("cors");
const AWS = require("aws-sdk");
const UnauthorizedError = require("./error/unauthorized");
const sendMessage = require("./utils/sendMessageQue");
const s3 = new AWS.S3({
  accessKeyId: `${process.env.AWS_ACCESS_KEY}`,
  secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`,
  region: "eu-north-1",
});
// const newFileNameKey = 'file.png';
// const filePath = image;

function uploadFile(filePath, bucketName, newFileNameKey) {
  const fileStream = fs.createReadStream(filePath);
  fileStream.on("error", (err) => {
    console.error(err);
  });

  const params = {
    Bucket: bucketName,
    Key: newFileNameKey,
    Body: fileStream,
  };

  return s3.upload(params).promise();
}

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(fileUpload({ useTempFiles: true }));
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    socket.removeAllListeners();
  });
});

const GOOGLE_CALLBACK_URL = "http://localhost:5002/google/callback";
const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

app.get("/", (req, res) => {
  const state = "some_state";
  const scopes = GOOGLE_OAUTH_SCOPES.join(" ");
  const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${process.env.GOOGLE_OAUTH_URL}?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${scopes}`;
  res.redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);
});

app.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  const data = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: "http://localhost:5002/google/callback",
    grant_type: "authorization_code",
  };
  try {
    const response = await axios.post(
      process.env.GOOGLE_ACCESS_TOKEN_URL,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const access_token_data = response.data;
    console.log(access_token_data);
    const { id_token } = access_token_data;
    const token_info_response = await axios.get(
      `${process.env.GOOGLE_TOKEN_INFO_URL}?id_token=${id_token}`
    );

    const token_info_data = token_info_response.data;
    console.log(token_info_data);
    const { email, name } = token_info_data;

    const userRepository = dataSource.getRepository(User);
    const connectedUserRepository = dataSource.getRepository(ConnectedUser);

    const jwtToken = createJWT({ payload: { name, email } });
    console.log(jwtToken);
    let user = await userRepository.findOne({ where: { email: email } });
    if (!user) {
      const newConnectedUser = connectedUserRepository.create({
        email,
        connectionPlatform: "Google",
      });
      await connectedUserRepository.save(newConnectedUser);

      user = userRepository.create({
        name,
        email,
        connectedUser: newConnectedUser,
      });
      await userRepository.save(user);
    }
    io.emit("stateAdded", { state: "someState" });
    res
      .status(201)
      .json({ message: "User logging in with google", jwt: jwtToken });
  } catch (error) {
    console.error("Error fetching access token:", error);
  }
});

app.post("/fileUpload", async (req, res) => {
  const bucketName = "file-uploadsandro";
  const file = req.files.file
  
  let newFileNameKey;
  if (file.mimetype === "application/pdf") {
    newFileNameKey = `${uuidv4()}.pdf`;
  } else {
    newFileNameKey = `${uuidv4()}.png`;
  } 
  const filePath = file.tempFilePath;

  try {
    await uploadFile(filePath, bucketName, newFileNameKey);
    await fs.promises.unlink(filePath);
    res
      .status(200)
      .send("File uploaded");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error");
  }
});
const authentication = (req, res, next) => {
  console.log(req.body);
  const token = req.headers.authorization;
  if(token !== 'adasdmsgmdfk1243902390/xc'){
    throw new UnauthorizedError("You are not authorized to access this route")
  }
  req.user = {
    name:"gela",
    surname:"gelashvili",
    email:"gelagelashvili@gmail.com",
    id:"12341"
  }
  next()
}
app.get("/authenticatedRoute",authentication,async (req,res)=>{
  const {message} = req.body;
  await sendMessage(message);
  res.send('message sent')
})
const PORT = process.env.PORT || 5002;
const start = async () => {
  try {
    await connectToDatabase();
    await dataSource.initialize();
    console.log("Connected to PostgreSQL database");
    server.listen(PORT, () => {
      console.log(
        `Server running and listening on port: ${PORT}`
      );
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
};
start();
