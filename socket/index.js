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
    tmpQueries.push("SELECT user_pw, user_type, firstname, lastname, validated, states FROM ebtjv.users WHERE LOWER(email) = '" + tmpData.email.toLowerCase() + "';");

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
          var goodPW = "";
          bcrypt.compare(tmpData.password, hash, function(err, result) {
            if(err) { 
              console.log(err); 
              socket.emit("login", {"code": 500, "check": false});
            }

            //var tmpHash = results[i].rows[0].password;
            //tmpHash = hash.replace(/^\$2y(.+)$/i, '$2a$1');
            //console.log(tmpHash);

            if(result == true && results[i].rows[0].validated == true && results[i].rows[0].user_type != 'registrant') {
              const accessToken = jwt.sign({ email: tmpData.email,  user_type: results[i].rows[0].user_type, firstname: results[i].rows[0].firstname, lastname: results[i].rows[0].lastname }, accessTokenSecret, { expiresIn: '8h' });
              socket.emit("login", {"code": 200, "token": accessToken, "firstname": results[i].rows[0].firstname, "lastname": results[i].rows[0].lastname, "states": results[i].rows[0].states});  //Credentials are valid; 'check' object can be any string, just has to match the 'status' object in the secure code below
            }
            else if(results[i].rows[0].validated != true) {
              socket.emit("login", {"code": 404, "msg": "User account has not been validated"});  //User and password correct, but account hasn't been validated
            }
            else if(results[i].rows[0].user_type == 'registrant' && result == true) {
              socket.emit("login", {"code": 404, "msg": "User account has not been granted access to view data"});  //User and password correct, but account hasn't been validated
            }
            else if(result == false) {
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
        tmpQueries.push("INSERT INTO ebtjv.users (organization, user_pw, firstname, lastname, email, val_code, user_type) VALUES ('" + tmpData.org + "', '" + hash + "', '" + tmpData.fname + "', '" + tmpData.lname + "', '" + tmpData.email + "', '" + val_code + "', 'registrant');");
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
                bcc: ['Jason Coombs <jason_coombs@fws.gov>', 'Lori Maloney <lori.maloney@canaanvi.org>'],
                subject: 'Validate EBTJV Updater Account',
                text: 'User: ' + tmpData.fname + ' ' + tmpData.lname + '\nOrganization: ' + tmpData.org + '\nEmail: ' + tmpData.email + '\n\nClick on the following link to validate your account and complete your EBTJV Catchment Updater registration: https://ebtjv.ecosheds.org/validate?id=' + val_code
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
//UPDATE ebtjv.users SET states = ARRAY['North Carolina','Virginia','Tennessee','South Carolina'] WHERE email = 'jacob.rash@ncwildlife.org';

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
          socket.emit("validate", {"code": 404, "msg": "A problem was encountered validating your user account. The most likely reason is that it has already been validated, however if you still need assistance please email ebtjv.updater@gmail.com to help resolve the issue."});
        }
      }
    });
  });



  socket.on("get_reasons", function(tmpData) {
    console.log("Getting existing reasons for changing catchment code for " + tmpData.user);
    //console.log(tmpData);
    var tmpQueries = [];
    tmpQueries.push("SELECT reason FROM gis.ebtjv_catchments_current WHERE editor = '" + tmpData.user + "' GROUP BY reason ORDER BY reason;");

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
      if(typeof results[0] != 'undefined') {
        for(var i in results) {
          //if(results[i].rowCount > 0) {
            socket.emit("get_reasons", {"code": 200, "data": results[i]});
          //}
          //else {
            //socket.emit("sendError", {"code": 401, "msg": "There are currently no reasons present in the ebtjv_catchments_current table"});
          //}
        }
      }
      else {
        //socket.emit("sendError", {"code": 401, "msg": "There are currently no reasons present in the ebtjv_catchments_current table"});
      }
    });    
  });


  //******Get ebtjv_code counts
  //select ebtjv_code, count(ebtjv_code) from gis.ebtjv_catchments_current where state = 'North Carolina' group by ebtjv_code;

  socket.on("get_latest_update", function() {
    console.log("Getting most recent update year for each state");

    var tmpQueries = [];
    tmpQueries.push('SELECT state, max(samp_year) AS max_samp_year FROM gis."ebtjv_catchments_current" WHERE samp_year < 9999 GROUP BY state ORDER BY state;');

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
      if(typeof results[0] != 'undefined') {
        for(var i in results) {
          if(results[i].rowCount > 0) {
            socket.emit("get_latest_update", {"code": 200, "data": results[i].rows});
          }
          else {
            //socket.emit("sendError", {"code": 401, "msg": "There are currently no reasons present in the ebtjv_catchments_current table"});
          }
        }
      }
      else {
        //socket.emit("sendError", {"code": 401, "msg": "There are currently no reasons present in the ebtjv_catchments_current table"});
      }
    });    
  });




  socket.on("check_admin", function(tmpData) {
    console.log("Verifying user has state permissions for catchment");
    //console.log(tmpData);
    var tmpQueries = [];
    tmpQueries.push("SELECT state FROM gis.ebtjv_catchments_current WHERE featureid = '" + tmpData.feat + "';");

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
      if(typeof results[0] != 'undefined') {
        for(var i in results) {
          if(results[i].rowCount > 0) {
            socket.emit("check_admin", {"code": 200, "data": results[i], "params": tmpData});
          }
          else {
            socket.emit("sendError", {"code": 401, "msg": "There was no catchment with a feature id of " + tmpData.tmpFeat});
          }
        }
      }
      else {
        //socket.emit("sendError", {"code": 401, "msg": "There was no catchment with a feature id of " + tmpData.tmpFeat});
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
        addPoints(tmpData, pool);
      }
      else {
        socket.emit("sendError", {"code": 401, "msg": err});
      }  
    });
  });



  socket.on("get_codes", function(tmpObj) {
    //console.log(tmpObj);
    console.log("Get ebtjv code and bounding box for batch edit");

    var tmpWhere = "";
    tmpObj.tmpFeats.forEach(function(feat,i) {
      if(i == 0) {
        tmpWhere = "(featureid = '" + feat + "'";
      }
      else {
        tmpWhere += " OR featureid = '" + feat + "'";
      }
    });
    tmpWhere += ")";

    var tmpQueries = [];
    tmpQueries.push("SELECT ebtjv_code, featureid, state, ST_AsGeoJSON(ST_Envelope(wkb_geometry)) as bbox FROM gis.ebtjv_catchments_current WHERE " + tmpWhere + ";");

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
        if(typeof(results[i].rowCount) == 'undefined') {
          console.log(tmpQueries[0]);
          socket.emit("sendError", {"code": 401, "msg": "Error encounterd getting EBTJV code and bounding box for the following features: " + featArray.toString()});
        }
        else if(results[i].rowCount > 0) {
          socket.emit("get_codes", {"code": 200, "data": results[i].rows, "tmpData": tmpObj.tmpData});
        }
        else {
          socket.emit("sendError", {"code": 401, "msg": "Error encounterd getting EBTJV code and bounding box for the following features: " + featArray.toString()});
        }  
      }
    });    
  });



  socket.on("edit", function(tmpData) {
    //console.log(tmpData);
    console.log("Authenticating user " + tmpData[0].user);
    var verToken = authenticateJWT(tmpData[0].token);
    
    if(verToken.code == 200 && verToken.user.user_type == "admin") {
      console.log("Editing catchment layer");

      var tmpQueries = [];
      tmpData.forEach(function(tmpDatas) {
        if(typeof(tmpDatas.reason) == "undefined") { tmpDatas.reason = ""; }
        tmpQueries.push("UPDATE gis.ebtjv_catchments_current SET prior_code = ebtjv_code, prior_year = samp_year, ebtjv_code = '" + tmpDatas.code + "', samp_year = " + tmpDatas.sampYear + ", reason = '" + tmpDatas.reason + "', editor = '" + tmpDatas.user + "', latest_sample = '" + tmpDatas.sampDate + "', edit_date = CURRENT_DATE, prior_edits = CASE WHEN prior_edits = '' THEN CONCAT(samp_year, ' = ', ebtjv_code) ELSE CONCAT(prior_edits, ', ', samp_year, ' = ', ebtjv_code) END WHERE featureid = '" + tmpDatas.feat + "';");
      })
     
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

      recCnt = 0;

      async.series(queue, function(err, results) {
        for(var i in results) {
          if(results[i].rowCount > 0) {
            if(tmpData[i].extend == "yes") {
              extendFetch(tmpData[i], i, pool);
            }
            else {
              if(parseInt(i) == tmpData[i].totLines) {
                if(tmpData[i].totLines == 0) {
                  var tmpMsg = "Successfully updated target catchment";
                }
                else {
                  var tmpMsg = "Succussfully updated " + (tmpData[i].totLines + 1) + " catchments in the import file";
                }

                socket.emit("updateProg", {"percent": Math.round(((parseInt(i) + 1)/(parseInt(tmpData[i].totLines) + 1))*100)});
                setTimeout(function() { socket.emit("edit", {"code": 200, "msg": tmpMsg}); }, 1000);
              }
              else {
                socket.emit("updateProg", {"percent": Math.round(((parseInt(i) + 1)/(parseInt(tmpData[i].totLines) + 1))*100)});
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
      socket.emit("sendError", {"code": 201, "msg": "Your account has been validated, but not approved to make edits.\n\nPlease contact your supervisor to request editing privileges."});
    }
    else {
      socket.emit("sendError", verToken);
    }

  });




  function addPoints(tmpData, pool) {
    console.log("Adding coordinate points to tmppoints table");
    var strPoints = "";
    var tmpBi = 0;
    tmpData.coords.forEach(function(tmpCoords) {
      //***Check for missing coordinates
      if(tmpCoords.long == "" || isNaN(tmpCoords.long) || tmpCoords.lat == "" || isNaN(tmpCoords.lat)) {
        tmpBi = 1;
        return;
      }
      
      if(strPoints == "") {
        strPoints = "('" + tmpData.user + "', ST_SetSRID(ST_Point(" + tmpCoords.long + "," + tmpCoords.lat + "), 4326))";
      }
      else {
        strPoints += ", ('" + tmpData.user + "', ST_SetSRID(ST_Point(" + tmpCoords.long + "," + tmpCoords.lat + "), 4326))";
      }
    });

    if(tmpBi == 1) {
      socket.emit("sendError", {"code": 401, "msg": "Encountered missing or non-numeric coordinates for at least 1 record, please edit or remove incorrectly formatted records."});
      return;
    }
    

    var tmpQueries = [];
    tmpQueries.push("INSERT INTO gis.tmppoints (user_name, geom) VALUES " + strPoints + ";");
/*
    const pool = new Pool({
      user: "Jason",
      host: "ecosheds.org",
      database: "ebtjv",
      password: "Jason20!",
      port: 5432,
    });
*/
    var queue = [];
    tmpQueries.forEach(function(query,i) {
      queue.push(pool.query.bind(pool, query));
    });

    async.parallel(queue, function(err, results) {
      if(err == null) {
        console.log("Added " + results[0].rowCount + " points for user " + tmpData.user);
        findFeats(tmpData, pool);
      }
      else {
        socket.emit("sendError", {"code": 401, "msg": "There were no points to get feature id for"});
      }  
    });    
  }
  



  function findFeats(tmpData, pool) {
    console.log("Finding feature ids for points in tmppoint table");
    var tmpQueries = [];
    tmpQueries.push("SELECT a.featureid, ST_AsGeoJSON(b.geom) as point FROM gis.ebtjv_catchments_current a, gis.tmppoints b WHERE ST_Contains(a.wkb_geometry, b.geom) AND b.user_name = '" + tmpData.user + "';");
/*
    const pool = new Pool({
      user: "Jason",
      host: "ecosheds.org",
      database: "ebtjv",
      password: "Jason20!",
      port: 5432,
    });
*/
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




  function extendFetch(tmpData, iVal, pool) {
    console.log("Getting catchment count and sample OID");
    var tmpQueries = [];
    tmpQueries.push("SELECT featureid, ebtjv_code, catch_cnt, samp_year, samp_oid, state, editor, prior_code, reason, edit_date, latest_sample, prior_year, prior_edits FROM gis.ebtjv_catchments_current WHERE featureid = '" + tmpData.feat + "';");
/*
    const pool = new Pool({
      user: "Jason",
      host: "ecosheds.org",
      database: "ebtjv",
      password: "Jason20!",
      port: 5432,
    });
*/
    var queue = [];
    tmpQueries.forEach(function(query,i) {
      queue.push(pool.query.bind(pool, query));
    });

    async.parallel(queue, function(err, results) {
      //console.log(results);
      for(var i in results) {
        if(typeof(results[i]) == 'undefined') {
          console.log("Query recursion error!");
          console.log(results);
          console.log(tmpData.feat);
          console.log(tmpQueries[0]);  
        }
        else if(results[i].rowCount > 0) {
          extendEdit({"newData": results[i].rows[0], "oldData": tmpData}, iVal, pool);
        }
        else {
          socket.emit("sendError", {"code": 401, "msg": "There was an error querying for catch_cnt and samp_oid for featureid " + tmpData.feat});
        }  
      }
    });    
  }



  function extendEdit(tmpData, iVal, pool) {
    console.log("Updating upstream catchments");

    //***return if catchment wasn't classified by original 2012 EBTJV algorithm
    if(tmpData.newData.samp_oid == -1) {
      recCnt +=1
      //if(tmpData.oldData.curLine == tmpData.oldData.totLines) {
      if(recCnt == tmpData.oldData.totLines + 1) {
        if(tmpData.oldData.totLines == 0) {
          var tmpMsg = "Successfully updated target catchment but couldn't move upstream as catchment was not previously classified (Catchment Count = 0 and Sample OID = -1)";
        }
        else {
          var tmpMsg = "Succussfully updated " + (tmpData.oldData.totLines + 1) + " catchments in the import file and their associated upstream catchments";
        }

        socket.emit("updateProg", {"percent": Math.round(((recCnt)/(parseInt(tmpData.oldData.totLines) + 1))*100)});
        //socket.emit("edit", {"code": 200, "msg": tmpMsg});
        setTimeout(function() { socket.emit("edit", {"code": 200, "msg": tmpMsg}); }, 1000);
      }
      else {
        socket.emit("updateProg", {"percent": Math.round(((recCnt)/(parseInt(tmpData.oldData.totLines) + 1))*100)});
      }
      //console.log("-1 catchment");
      return;
    }

    //console.log("made it past");

    //***Convert dates
    var newDate = new Date(tmpData.newData.edit_date);
    var strDate = newDate.getFullYear() + "/" + (newDate.getMonth() + 1) + "/" + newDate.getDate();
    tmpData.newData.edit_date = strDate;

    newDate = new Date(tmpData.newData.latest_sample);
    strDate = newDate.getFullYear() + "/" + (newDate.getMonth() + 1) + "/" + newDate.getDate();
    tmpData.newData.latest_sample = strDate;

    var tmpQueries = [];
    tmpQueries.push("UPDATE gis.ebtjv_catchments_current SET prior_code = ebtjv_code, prior_year = samp_year, ebtjv_code = '" + tmpData.newData.ebtjv_code + "', samp_year = " + tmpData.newData.samp_year + ", reason = '" + tmpData.newData.reason + "', editor = '" + tmpData.newData.editor + "', latest_sample = '" + tmpData.newData.latest_sample + "', edit_date = '" + tmpData.newData.edit_date + "', prior_edits = CASE WHEN prior_edits = '' THEN CONCAT(samp_year, ' = ', ebtjv_code) ELSE CONCAT(prior_edits, ', ', samp_year, ' = ', ebtjv_code) END WHERE state = '" + tmpData.newData.state + "' AND samp_oid = '" + tmpData.newData.samp_oid + "' AND catch_cnt > " + tmpData.newData.catch_cnt + ";");
/*
    const pool = new Pool({
      user: "Jason",
      host: "ecosheds.org",
      database: "ebtjv",
      password: "Jason20!",
      port: 5432,
    });
*/
    var queue = [];
    tmpQueries.forEach(function(query,i) {
      queue.push(pool.query.bind(pool, query));
    });

    async.parallel(queue, function(err, results) {
      recCnt +=1
      //console.log("Rec: " + recCnt + ", i: " + iVal);
      for(var i in results) {
        //if(tmpData.oldData.curLine == tmpData.oldData.totLines) {
        if(recCnt == tmpData.oldData.totLines + 1) {
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
          socket.emit("updateProg", {"percent": Math.round(((recCnt)/(parseInt(tmpData.oldData.totLines) + 1))*100)});
          //socket.emit("edit", {"code": 200, "msg": tmpMsg});
          setTimeout(function() { socket.emit("edit", {"code": 200, "msg": tmpMsg}); }, 1000);
        }
        else {
          socket.emit("updateProg", {"percent": Math.round(((recCnt)/(parseInt(tmpData.oldData.totLines) + 1))*100)});
        }
      }
    });    
  }
});





http.listen(3123, function() {
  console.log("listening on *:3123");
});
