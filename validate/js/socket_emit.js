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
      d3.select("#valDiv").html('<p>A problem was encountered validating your user account.<br>The most likely reason is that it has already been validated,<br>however if you still need assistance please email<br><a style="font-weight:bold;" href="mailto:ebtjv.updater@gmail.com?subject=EBTJV Updater Validation">ebtjv.updater@gmail.com</a><br>to help resolve the issue.</p>');
    }
  });

  load_page();
}
