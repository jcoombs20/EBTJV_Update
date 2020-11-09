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
    if(tmpData.code == 404) {
      alert(tmpData.msg);
    }
    else {
      accessToken = tmpData.token;
      curUser = tmpData.firstname + " " + tmpData.lastname;
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



  socket.on("get_reasons", function(tmpData) {
    if(tmpData.code == 200) {
      d3.select("#manualReasonSel").selectAll("option").remove();
      var tmpReasons = tmpData.data.rows.map(function(tmpEl) { return tmpEl.reason; });
      tmpReasons.splice(0,1,"Select reason...");
      d3.select("#manualReasonSel").selectAll("option")
        .data(tmpReasons)
        .enter()
          .append("option")
          .attr("value", function(d) { return d; })
          .attr("data-i", function(d,i) { return i; })
          .property("disabled", function(d, i) { if(i==0) {return "disabled";} })
          .text(function(d) { return d; });

      d3.select("#manualReasonSel").property("selectedIndex", 0);
      document.getElementById("manualReasonSel").setCustomValidity("A reason must be selected");
    }
  });



  socket.on("feat_zoom", function(tmpData) {
    var tmpBbox = tmpData.data.st_extent.replace("BOX(","").replace(")","").split(",");
    var finalBbox = [];
    tmpBbox.forEach(function(tmpCoord) { finalBbox.push(tmpCoord.split(" ")); });
    console.log(finalBbox);
    map.fitBounds([[finalBbox[0][1],finalBbox[0][0]],[finalBbox[1][1],finalBbox[1][0]]]);
  });



  socket.on("get_featureid", function(tmpData) {
    var allLines = fileImport.split(/\r?\n/);
    const tmpFields = allLines[0].split(",");
    //***Remove empty lines
    allLinesClean = allLines.filter(function(tmpLine) { return tmpLine != ""; });

    var tmpForm = document.getElementById("codeForm");
    var tmpMapLat = tmpForm.codeLatSel.value;
    var tmpMapLong = tmpForm.codeLongSel.value;
    if(tmpForm.codeClassify.value == "ebtjv_code") {
      var tmpCode = tmpForm.codeCodeSel.value;
    }
    else {
      var tmpCode = "EBTJV Code";
    }

    newFileImport = "";

    allLinesClean.forEach(function(tmpLine, i) {
      var lineArray = tmpLine.split(",");
      if(i == 0) {
        tmpFields.push("Feature ID");
        lineArray.push("Feature ID");
      }
      else {
        tmpData.data.some(function(feat) {
          if(feat.point.includes(lineArray[tmpFields.indexOf(tmpMapLong)]) && feat.point.includes(lineArray[tmpFields.indexOf(tmpMapLat)])) {
            lineArray.push(feat.featureid);
            return true;
          }
          return false;
        });
      }
      newFileImport += lineArray.join(",") + "\n"; 
    }); 
    fileImport = newFileImport;

    var tmpData = {"tmpExtend": tmpForm.codeExtend.value, "tmpFeat": "Feature ID", "tmpCode": tmpCode, "tmpDate": tmpForm.codeDateSel.value, "tmpReason": tmpForm.codeReasonSel.value};
    doEdits(tmpData);
  });



  socket.on("edit", function(tmpData) {
    catchments.setUrl("https://ecosheds.org/geoserver/wms?" + Math.random() + "&");
    catchments.redraw();
    alert(tmpData.msg);
  });



  socket.on("sendError", function(tmpData) {
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



