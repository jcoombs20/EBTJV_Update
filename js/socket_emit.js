function socket_emit() {
  socket = io();
  
  socket.on('connect', function () {
    console.log('connected!');
  });

  socket.on('error', function(err) {
    alert(err.error);
  });

  socket.on("test", function(tmpData) {
    console.log(tmpData);
  });



  socket.on("login", function(tmpData) {
    console.log(tmpData);
    if(tmpData.code == 404) {
      alert(tmpData.msg);
    }
    else {
      accessToken = tmpData.token;
      $('#loginModal').modal('hide')
      d3.select("#loginIcon").classed("fa-lock", false).classed("fa-unlock", true).property("title", "Click to logout");
      d3.select("#loginNameP").text(tmpData.firstname + " " + tmpData.lastname);
    }
  });



  socket.on("check_email", function(tmpData) {
    if(tmpData == "exists") {
      emailExists = true;
      if(d3.select("#register").style("display") == "block") {
        $("#email_reg").popover("enable");
        $("#email_reg").popover("show");
        $("#email_reg").popover("disable");
        document.getElementById("email_reg").focus();
      }
    }
    else {
      emailExists = false;
    }
  });



  socket.on("register", function(tmpData) {
    console.log("Successfully registered");
    alert("You have successfully registered. An email will be sent to the supplied address with a link to validate your account.");
  });



  socket.on("edit", function(tmpData) {
    console.log(tmpData);
  });



  socket.on("sendError", function(tmpData) {
    console.log(tmpData);
    //***Not logged in
    if(tmpData.code == 401) {  
      alert(tmpData.msg);
    }
    //***Token exprired
    else if(tmpData.code == 403) {
      //alert(JSON.stringify(tmpData.msg));
      alert("Your session has expired, please log in again");
    }
  });


}

