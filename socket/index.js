const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
//var cp = require("child_process");
const async = require('async');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Pool } = require("pg");
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ebtjv.updater@gmail.com',
    pass: 'mudulfekffmfczod'
  }
});


const accessTokenSecret = 'c4615ae1183b56bb0a121fcc39b48875ac93ec6939e92c5072fa5ead550b9c462204f5f5150803e4718efbe3721a16c1';


const authenticateJWT = function(token) {
  if (token) {
    console.log(token);

    var verToken = jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        return {"code": 403, "msg": err};
      }

      console.log(user);
      return {"code": 200, "user": user};
    });
    return verToken;
  } 
  else {
    return {"code": 401, "msg": "You are not currently logged in"};
  }
};



var topojson = require("topojson-server");
var topoSimp = require("topojson-simplify");


app.get("/", function(req, res) {
  res.send('<h1>Ottawa National Forest Riparian Planting Tool</h1><p style="color:blue;">Listening for queries...</p>');
});

io.on("connection", function(socket) {
  console.log("a user connected");

  socket.on("disconnect", function() {
    console.log("user disconnected");
  });

  socket.on("test", function(tmpData) {
    console.log(tmpData);
    socket.emit("test", tmpData + " back at ya!");
  });



  socket.on("login", function(tmpData) {
    console.log("Logging in " + tmpData.email);
    var tmpQueries = [];
    tmpQueries.push("SELECT user_pw, user_type, firstname, lastname, validated FROM ebtjv.users WHERE email = '" + tmpData.email + "';");

    const pool = new Pool({
      user: "Jason",
      host: "ecosheds.org",
      database: "ebtjv",
      password: "Jason20!",
      port: 5432,
    });

    var queue = [];
    tmpQueries.forEach(function(query,i) {
      queue.push(pool.query.bind(pool, query));
    });

    async.parallel(queue, function(err, results) {
      for(var i in results) {
        if(results[i].rowCount > 0) {
          var hash = results[i].rows[0].user_pw;
          bcrypt.compare(tmpData.password, hash, function(err, result) {
            if(err) { 
              console.log(err); 
              socket.emit("login", {"code": 500, "check": false});
            };

          //var hash = results[i].rows[0].password;
          //hash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
          //bcrypt.compare(tmpData.password, hash, function(err, res) {
            if(result == true && results[i].rows[0].validated == true) {
              const accessToken = jwt.sign({ email: tmpData.email,  user_type: results[i].rows[0].user_type, firstname: results[i].rows[0].firstname, lastname: results[i].rows[0].lastname }, accessTokenSecret, { expiresIn: 5 });
              socket.emit("login", {"code": 200, "token": accessToken, "firstname": results[i].rows[0].firstname, "lastname": results[i].rows[0].lastname});  //Credentials are valid; 'check' object can be any string, just has to match the 'status' object in the secure code below
            }
            else if(results[i].rows[0].validated != true) {
              socket.emit("login", {"code": 404, "msg": "User account has not been validated"});  //User and password correct, but account hasn't been validated
            }
            else {
              socket.emit("login", {"code": 404, "msg": "The password is incorrect for this email account"});  //User name is valid but password is not
            }
          });
        }
        else {
          socket.emit("login", {"code": 404, "msg": "User email does not exist, please register for an account"});  //User name does not exist
        }
      }
    });    
  });



  socket.on("check_email", function(tmpData) {
    console.log("Email exists check for " + tmpData);
    var tmpQueries = [];
    tmpQueries.push("SELECT email FROM ebtjv.users WHERE email = '" + tmpData + "';");

    const pool = new Pool({
      user: "Jason",
      host: "ecosheds.org",
      database: "ebtjv",
      password: "Jason20!",
      port: 5432,
    });

    var queue = [];
    tmpQueries.forEach(function(query,i) {
      queue.push(pool.query.bind(pool, query));
    });

    async.parallel(queue, function(err, results) {
      for(var i in results) {
        if(results[i].rowCount > 0) {
          console.log(results[i]);
          socket.emit("check_email", "exists");
        }
        else {
          socket.emit("check_email", "false");
        }  
      }
    });    
  });



  socket.on("register", function(tmpData) {
    console.log(tmpData);
    const saltRnds = 8;

    bcrypt.hash(tmpData.password, saltRnds, function(err, hash) {
      if(err) { console.log(err); };

      crypto.randomBytes(48, function(err, buffer) {
        var val_code = buffer.toString('hex');
        console.log(val_code);

        var tmpQueries = [];
        tmpQueries.push("INSERT INTO ebtjv.users (organization, user_pw, firstname, lastname, email, val_code, user_type) VALUES ('" + tmpData.org + "', '" + hash + "', '" + tmpData.fname + "', '" + tmpData.lname + "', '" + tmpData.email + "', '" + val_code + "', 'member');");
//DELETE FROM ebtjv.users WHERE email = 'jcoombs@umass.edu';

        const pool = new Pool({
          user: "Jason",
          host: "ecosheds.org",
          database: "ebtjv",
          password: "Jason20!",
          port: 5432,
        });

        var queue = [];
        tmpQueries.forEach(function(query,i) {
          queue.push(pool.query.bind(pool, query));
        });

        async.parallel(queue, function(err, results) {
          if(err) { 
            console.log(err); 
            socket.emit("register", error);
          };

          for(var i in results) {
            if(results[i].rowCount > 0) {
              console.log(results[i]);

              var mailOptions = {
                from: 'ebtjv.updater@gmail.com',
                to: tmpData.email,
                subject: 'Validate EBTJV Updater Account',
                text: 'Click on the following link to validate your account and complete your EBTJV Catchment Updater registration: https://ebtjv.ecosheds.org/validate?id=' + val_code
              }

              transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                  console.log(error);
                } 
                else {
                  console.log('Email sent: ' + info.response);
                }
              });
              socket.emit("register", "success");
            }
          }
        });
      });

    });
  });



  socket.on("validate", function(tmpData) {
    console.log(tmpData);

    var tmpQueries = [];
    tmpQueries.push("UPDATE ebtjv.users SET validated = true, val_code = '' WHERE val_code = '" + tmpData + "';");
//UPDATE ebtjv.users SET user_type = 'admin' WHERE email = 'jcoombs@umass.edu';

    const pool = new Pool({
      user: "Jason",
      host: "ecosheds.org",
      database: "ebtjv",
      password: "Jason20!",
      port: 5432,
    });

    var queue = [];
    tmpQueries.forEach(function(query,i) {
      queue.push(pool.query.bind(pool, query));
    });

    async.parallel(queue, function(err, results) {
      if(err) { 
        console.log(err); 
        socket.emit("validate", err);
      }

      for(var i in results) {
        if(results[i].rowCount > 0) {
          console.log(results[i]);
          socket.emit("validate", {"code": 200, "msg": "The user account has been successfully validated, you may now login to your account"});
        }
        else {
          socket.emit("validate", {"code": 404, "msg": "A problem was encounted validating you user account, email ebtjv.updater@gmail.com to resolve the problem"});
        }
      }
    });
  });



  socket.on("edit", function(tmpData) {
    var verToken = authenticateJWT(tmpData.token);
    
    if(verToken.code == 200 && verToken.user.user_type == "admin") {
      socket.emit("edit", verToken);
    }
    else if(verToken.code == 200) {
      socket.emit("sendError", {"code": 200, "msg": "Your account is not a member of the admin group and therefore does not have permission to make edits"});
    }
    else {
      socket.emit("sendError", verToken);
    }

  });

});



http.listen(3123, function() {
  console.log("listening on *:3123");
});
