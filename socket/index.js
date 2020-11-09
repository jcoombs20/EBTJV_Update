const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
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
    var verToken = jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        return {"code": 403, "msg": err};
      }

      return {"code": 200, "user": user};
    });
    return verToken;
  } 
  else {
    return {"code": 401, "msg": "You are not currently logged in"};
  }
};




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
              const accessToken = jwt.sign({ email: tmpData.email,  user_type: results[i].rows[0].user_type, firstname: results[i].rows[0].firstname, lastname: results[i].rows[0].lastname }, accessTokenSecret, { expiresIn: '8h' });
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
    console.log("Email check for " + tmpData);
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
          socket.emit("check_email", "exists");
        }
        else {
          socket.emit("check_email", "false");
        }  
      }
    });    
  });



  socket.on("register", function(tmpData) {
    console.log("Registering " + tmpData.fname + " " + tmpData.lname);
    const saltRnds = 8;

    bcrypt.hash(tmpData.password, saltRnds, function(err, hash) {
      if(err) { console.log(err); };

      crypto.randomBytes(48, function(err, buffer) {
        var val_code = buffer.toString('hex');

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
    console.log("Validating registered email account");

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
          socket.emit("validate", {"code": 200, "msg": "The user account has been successfully validated, you may now login to your account"});
        }
        else {
          socket.emit("validate", {"code": 404, "msg": "A problem was encounted validating you user account, email ebtjv.updater@gmail.com to resolve the problem"});
        }
      }
    });
  });



  socket.on("get_reasons", function() {
    console.log("Getting existing reasons for changing catchment code");
    var tmpQueries = [];
    tmpQueries.push("SELECT reason FROM gis.ebtjv_catchments_current GROUP BY reason ORDER BY reason;");

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
          socket.emit("get_reasons", {"code": 200, "data": results[i]});
        }
        else {
          socket.emit("sendError", {"code": 401, "msg": "There are currently no reasons present in the ebtjv_catchments_current table"});
        }  
      }
    });    
  });



  socket.on("feat_zoom", function(tmpData) {
    console.log("Getting bounding box for feature");
    var tmpQueries = [];
    tmpQueries.push("SELECT ST_Extent(wkb_geometry) FROM gis.ebtjv_catchments_current WHERE featureid = '" + tmpData.tmpFeat + "';");

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
          socket.emit("feat_zoom", {"code": 200, "data": results[i].rows[0]});
        }
        else {
          socket.emit("sendError", {"code": 401, "msg": "There was no catchment with a feature id of " + tmpData.tmpFeat});
        }  
      }
    });    
  });




  socket.on("get_featureid", function(tmpData) {
    console.log("Delete any existing points in table for this user")

    var tmpQueries = [];
    tmpQueries.push("DELETE FROM gis.tmpPoints WHERE user_name = '" + tmpData.user + "';");

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
      if(err == null) {
        console.log("Deleted " + results[0].rowCount + " points for user " + tmpData.user);
        addPoints(tmpData);
      }
      else {
        socket.emit("sendError", {"code": 401, "msg": err});
      }  
    });
  });



  socket.on("edit", function(tmpData) {
    var verToken = authenticateJWT(tmpData.token);
    
    if(verToken.code == 200 && verToken.user.user_type == "admin") {
      console.log("Editing catchment layer");
      var tmpQueries = [];
      tmpQueries.push("UPDATE gis.ebtjv_catchments_current SET prior_code = ebtjv_code, prior_year = samp_year, ebtjv_code = '" + tmpData.code + "', samp_year = " + tmpData.sampYear + ", reason = '" + tmpData.reason + "', editor = '" + tmpData.user + "', latest_sample = '" + tmpData.sampDate + "', edit_date = CURRENT_DATE, prior_edits = CASE WHEN prior_edits = '' THEN CONCAT(samp_year, ' = ', ebtjv_code) ELSE CONCAT(prior_edits, ', ', samp_year, ' = ', ebtjv_code) END WHERE featureid = '" + tmpData.feat + "';");

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
            if(tmpData.extend == "yes") {
              extendFetch(tmpData);
            }
            else {
              if(tmpData.curLine == tmpData.totLines) {
                if(tmpData.totLines == 0) {
                  var tmpMsg = "Successfully updated target catchment";
                }
                else {
                  var tmpMsg = "Succussfully updated " + (tmpData.totLines + 1) + " catchments in the import file";
                }

                socket.emit("edit", {"code": 200, "msg": tmpMsg});
              }
            }
          }
          else {
            socket.emit("sendError", {"code": 401, "msg": "An error was encountered and the update was unsuccessful"});
          }  
        }
      });    
    }
    else if(verToken.code == 200) {
      socket.emit("sendError", {"code": 200, "msg": "Your account is not a member of the admin group and therefore does not have permission to make edits"});
    }
    else {
      socket.emit("sendError", verToken);
    }

  });




  function addPoints(tmpData) {
    console.log("Adding coordinate points to tmppoints table");
    var strPoints = "";
    tmpData.coords.forEach(function(tmpCoords) {
      if(strPoints == "") {
        strPoints = "('" + tmpData.user + "', ST_SetSRID(ST_Point(" + tmpCoords.long + "," + tmpCoords.lat + "), 4326))";
      }
      else {
        strPoints += ", ('" + tmpData.user + "', ST_SetSRID(ST_Point(" + tmpCoords.long + "," + tmpCoords.lat + "), 4326))";
      }
    });
    

    var tmpQueries = [];
    tmpQueries.push("INSERT INTO gis.tmppoints (user_name, geom) VALUES " + strPoints + ";");

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
      if(err == null) {
        console.log("Added " + results[0].rowCount + " points for user " + tmpData.user);
        findFeats(tmpData);
      }
      else {
        socket.emit("sendError", {"code": 401, "msg": "There were no points to get feature id for"});
      }  
    });    
  }
  



  function findFeats(tmpData) {
    console.log("Finding feature ids for points in tmppoint table");
    var tmpQueries = [];
    tmpQueries.push("SELECT a.featureid, ST_AsGeoJSON(b.geom) as point FROM gis.ebtjv_catchments_current a, gis.tmppoints b WHERE ST_Contains(a.wkb_geometry, b.geom) AND b.user_name = '" + tmpData.user + "';");

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
      if(err == null) {
        console.log("Found " + results[0].rowCount + " feature ids for user " + tmpData.user);
        socket.emit("get_featureid", {"code": 200, "data": results[0].rows});
      }
      else {
        socket.emit("sendError", {"code": 401, "msg": "There were no points to get feature id for"});
      }  
    });    
  }




  function extendFetch(tmpData) {
    console.log("Getting catchment count and sample OID");
    var tmpQueries = [];
    tmpQueries.push("SELECT featureid, ebtjv_code, catch_cnt, samp_year, samp_oid, state, editor, prior_code, reason, edit_date, latest_sample, prior_year, prior_edits FROM gis.ebtjv_catchments_current WHERE featureid = '" + tmpData.feat + "';");

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
          extendEdit({"newData": results[i].rows[0], "oldData": tmpData});
        }
        else {
          socket.emit("sendError", {"code": 401, "msg": "There was an error querying for catch_cnt and samp_oid"});
        }  
      }
    });    
  }



  function extendEdit(tmpData) {
    console.log("Updating upstream catchments");
  
    //***Convert dates
    var newDate = new Date(tmpData.newData.edit_date);
    var strDate = newDate.getFullYear() + "/" + (newDate.getMonth() + 1) + "/" + newDate.getDate();
    tmpData.newData.edit_date = strDate;

    newDate = new Date(tmpData.newData.latest_sample);
    strDate = newDate.getFullYear() + "/" + (newDate.getMonth() + 1) + "/" + newDate.getDate();
    tmpData.newData.latest_sample = strDate;

    var tmpQueries = [];
    tmpQueries.push("UPDATE gis.ebtjv_catchments_current SET prior_code = ebtjv_code, prior_year = samp_year, ebtjv_code = '" + tmpData.newData.ebtjv_code + "', samp_year = " + tmpData.newData.samp_year + ", reason = '" + tmpData.newData.reason + "', editor = '" + tmpData.newData.editor + "', latest_sample = '" + tmpData.newData.latest_sample + "', edit_date = '" + tmpData.newData.edit_date + "', prior_edits = CASE WHEN prior_edits = '' THEN CONCAT(samp_year, ' = ', ebtjv_code) ELSE CONCAT(prior_edits, ', ', samp_year, ' = ', ebtjv_code) END WHERE state = '" + tmpData.newData.state + "' AND samp_oid = '" + tmpData.newData.samp_oid + "' AND catch_cnt > " + tmpData.newData.catch_cnt + ";");

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
        if(tmpData.oldData.curLine == tmpData.oldData.totLines) {
          if(tmpData.oldData.totLines == 0) {
            if(results[i].rowCount == 1) {
              var tmpMsg = "Successfully updated target catchment and " + results[i].rowCount + " upstream catchment";
            }
            else {
              var tmpMsg = "Successfully updated target catchment and " + results[i].rowCount + " upstream catchments";
            }
          }
          else {
            var tmpMsg = "Succussfully updated " + (tmpData.oldData.totLines + 1) + " catchments in the import file and their associated upstream catchments";
          }

          socket.emit("edit", {"code": 200, "msg": tmpMsg});
        }
      }
    });    
  }



});





http.listen(3123, function() {
  console.log("listening on *:3123");
});
