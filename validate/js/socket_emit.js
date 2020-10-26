function socket_emit() {
  socket = io();
  
  socket.on('connect', function () {
    console.log('connected!');
  });

  socket.on("test", function(tmpData) {
    console.log(tmpData);
  });

  socket.on("validate", function(tmpData) {
    if(tmpData.code == 200) {
      d3.select("#valDiv").html('<p>The user account has been successfully validated!<br>You may now <a style="font-weight:bold;" href="https://ebtjv.ecosheds.org">login</a> to your account.</p>');
    }
    else {
      d3.select("#valDiv").html('<p>A problem was encounted validating your user account.<br>Please email <a style="font-weight:bold;" href="mailto:ebtjv.updater@gmail.com?subject=EBTJV Updater Validation">ebtjv.updater@gmail.com</a> to resolve the issue.</p>');
    }
  });

  load_page();
}
