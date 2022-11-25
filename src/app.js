const express = require('express');
const cors = require('cors')
const redis = require('./v1/databases/init.redis')
const {
  sendOTPConfirmEmail,
  sendOTPResetPassword,
  sendMailToActiveAccount
} = require('./v1/utils/templateEmail')
const {
  deleteFiles
} = require('./v1/services/uploadFile.server')
const app = express();


const { sendMail, sendOtp } = require('./v1/services/sendMail')
//init dbs 
//require('./v1/databases/init.mongodb')
redis.subscribe(
  "send_mail",
  "send_otp_reset_password",
  "send_otp_register_mobile",
  "delete_file_list",
   (err, count) =>{
    if (err) {
        console.error("Failed to subscribe: %s", err.message);
      } else {
        console.log(
          `Subscribed successfully! This client is currently subscribed to ${count} channels.`
        );
      }
})

redis.on('message',async (channel, data) => {
  console.log(`Received data from ${channel}`);
  if(channel === "send_mail") {
    try {
      const payload = JSON.parse(data)
        sendMail({
          sendTo:payload.email, 
          token:payload.verifyToken, 
          name:payload.name, 
          subject:'Access the link to active account',
          html:sendMailToActiveAccount,
          _id: payload._id
        }
          )
    } catch (error) {
      console.log(error)
    }
  }
  if(channel === "send_otp_reset_password") {
    try {
      const payload = JSON.parse(data)
      sendOtp(payload.email,payload.name, payload.otp, "The OTP Code Reset Password", sendOTPResetPassword)
      return 
    } catch (error) {
      console.log(error)
    }
  }
  if(channel === "send_otp_register_mobile") {
    try {
      const payload = JSON.parse(data)
      sendOtp(payload.email,payload.name ,payload.otp, "The OTP code active your account", sendOTPConfirmEmail)
      return 
    } catch (error) {
      console.log(error)
    }
  }
  if(channel === "delete_file_list"){
    const payload = JSON.parse(data)
    console.log(payload)
    deleteFiles(payload.fileList)
  }
})

// parse application/json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
//router
app.use(require('./v1/routes/index.router'))

// Error Handling Middleware called

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});


// error handler middleware
app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
        error: {
            status: error.status || 500,
            message: error.message || 'Internal Server Error',
        },
    });
});

module.exports = app;