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
      adStates = tmpData.states;
      $('#loginModal').modal('hide')
      d3.select("#loginIcon").classed("fa-lock", false).classed("fa-unlock", true).property("title", "Click to logout");
      d3.select("#loginNameP").text(tmpData.firstname + " " + tmpData.lastname).attr("data-states", tmpData.states);
      console.log(tmpData.states);
      socket.emit("get_reasons", {"user": curUser});
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
    console.log(tmpData);
    if(tmpData.code == 200) {
      d3.select("#manualReasonSel").selectAll("option").remove();
      var tmpReasons = tmpData.data.rows.map(function(tmpEl) { return tmpEl.reason; });
      console.log(tmpReasons);
      tmpReasons.splice(0,0,"Select reason...");
      console.log(tmpReasons);
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



  socket.on("check_admin", function(tmpData) {
    var tmpStates = tmpData.data.rows.map(function(tmpEl) { return tmpEl.state; });
    console.log(tmpStates);
    var tmpStatus = false;
    var j = 0;
    tmpStates.some(function(state, i) {
      if(adStates.indexOf(state) != -1) {
        tmpStatus = true;
        j = i;
        return true;
      }
      return false;
    });

    if(tmpStatus == true) {
      socket.emit("edit", tmpData.params);
    }
    else {
      alert("Your account does not have permission to edit catchments in " + tmpStates[j] + ".\r\n\r\nStates you have permissions for are: " + adStates.toString().replace(",", ", "));
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
    selEdits(tmpData);
  });



  socket.on("get_codes", function(tmpObj) {
    //******Initialize bootstrap tooltip
    $(function() {
      $('[data-toggle="tooltip"]').tooltip();
    });

    d3.select("#confirmTbody").selectAll("tr").remove();

    var featArray = [];
    tmpObj.data.forEach(function(el) { featArray.push(el.featureid.toString()); });

    var allLines = fileImport.split(/\r?\n/);
    const tmpFields = allLines[0].split(",");
    allLines.splice(0,1);
    //***Remove empty lines
    allLinesClean = allLines.filter(function(tmpLine) { return tmpLine != ""; });

    var tmpData = tmpObj.tmpData;
    var lineCnt = allLinesClean.length - 1;

    //***Make array of feature ids
    var tmpArray = [];
    allLinesClean.forEach(function(tmpLine, i) {
      var lineArray = tmpLine.split(",");
      tmpArray.push(lineArray[tmpFields.indexOf(tmpData.tmpFeat)]);
    });

    allLinesClean.forEach(function(tmpLine, i) {
      var lineArray = tmpLine.split(",");
      var newDate = new Date(lineArray[tmpFields.indexOf(tmpData.tmpDate)]);
      var tmpYear = newDate.getFullYear();

      var j = featArray.indexOf(lineArray[tmpFields.indexOf(tmpData.tmpFeat)]);
      var tmpBbox = JSON.parse(tmpObj.data[j].bbox);
      var tmpCoords = [tmpBbox.coordinates[0][0],tmpBbox.coordinates[0][2]];

      var tmpCnt = tmpArray.filter(x => x === lineArray[tmpFields.indexOf(tmpData.tmpFeat)]).length;
      var tmpFlag = "";
      if(tmpCnt > 1) {
        tmpFlag = '<span class="fa fa-exclamation-triangle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>There are ' + tmpCnt + ' edit records for this catchment</p>"></span>';
      }

      console.log(tmpObj.data[j].state);
      if(adStates.indexOf(tmpObj.data[j].state) > -1 || adStates.indexOf("All") > -1) {
        var tmpConfirm = '<td><span id="confirmSpan_' + i + '" class="confirmSpan fa fa-check-square" data-ad_states="yes" title="Click to exclude from updates"></span></td>';
      }
      else {
        var tmpConfirm = '<td><span id="confirmSpan_' + i + '" class="confirmSpan fa fa-times-circle notAllowed" data-ad_states="no" title="Your account does not have permission to edit catchments in ' + tmpObj.data[j].state + '.\nStates you have permissions for are: ' + adStates.toString().replace(",", ", ") + '"></span></td>';
      }

      d3.select("#confirmTbody")
        .append("tr")
        .attr("data-count", tmpCnt)
        .attr("data-same", function() { return tmpObj.data[j].ebtjv_code == lineArray[tmpFields.indexOf(tmpData.tmpCode)]; })
        .attr("data-edit", JSON.stringify({"feat": lineArray[tmpFields.indexOf(tmpData.tmpFeat)], "code": lineArray[tmpFields.indexOf(tmpData.tmpCode)], "sampDate": lineArray[tmpFields.indexOf(tmpData.tmpDate)], "sampYear": tmpYear, "reason": lineArray[tmpFields.indexOf(tmpData.tmpReason)], "extend": tmpData.tmpExtend, "user": curUser, "token": accessToken, "curLine": i, "totLines": lineCnt}))
        .html('<td id="confirmTD_' + i + '" data-coords="' + tmpCoords + '" title="Click to zoom to catchment">' + lineArray[tmpFields.indexOf(tmpData.tmpFeat)] + '</td>'
          + '<td title="Current code: ' + tmpObj.data[j].ebtjv_code + '">' + tmpObj.data[j].ebtjv_code + '</td>'
          + '<td title="New code: ' + lineArray[tmpFields.indexOf(tmpData.tmpCode)] + '">' + lineArray[tmpFields.indexOf(tmpData.tmpCode)] + '</td>'
          + '<td title="Sample date: ' + lineArray[tmpFields.indexOf(tmpData.tmpDate)] + '">' + lineArray[tmpFields.indexOf(tmpData.tmpDate)] + '</td>'
          + '<td>' + tmpFlag + '</td>'
          + tmpConfirm
          //+ '<td><span id="confirmSpan_' + i + '" class="confirmSpan fa fa-check-square" data-ad_states="yes" title="Click to exclude from updates"></span></td>'
        );
      
      d3.select("#confirmTD_" + i)
        .on("click", function() {
          //***Style parent row
          //d3.select("#confirmTbody").selectAll("tr").classed("zoomed", false);
          //d3.select(this.parentNode).classed("zoomed", true);

          //***Zoom to catchment
          var tmpCoords = d3.select(this).attr("data-coords").split(",");
          map.fitBounds([[tmpCoords[1],tmpCoords[0]],[tmpCoords[3],tmpCoords[2]]]);

          //***Turn on catchment layer if not already on
          if(d3.select("#layerToggleDiv9").select("span").style("visibility") != "visible") { 
            $("#layerToggleDiv9").click();
          }

          //***Select the catchment of interest
          var latlngPoint = new L.LatLng( ((parseFloat(tmpCoords[1]) + parseFloat(tmpCoords[3]))/2), ((parseFloat(tmpCoords[0]) + parseFloat(tmpCoords[2]))/2) );
          //Waiting for layer to load before initiating below click 
          setTimeout(function () {
            map.fireEvent('click', {
              latlng: latlngPoint,
              layerPoint: map.latLngToLayerPoint(latlngPoint),
              containerPoint: map.latLngToContainerPoint(latlngPoint)
            });
          }, 1000);
        });

      d3.select("#confirmSpan_" + i)
        .on("click", function() { 
          if(d3.select(this).attr("data-ad_states") == "yes") {
            if(d3.select(this).classed("fa-check-square") == true) {
              d3.select(this).classed("fa-check-square", false).classed("fa-times-circle", true).property("title", "Click to include in updates");
            }
            else {
              d3.select(this).classed("fa-check-square", true).classed("fa-times-circle", false).property("title", "Click to exclude from updates");
            }
            getConfirmCSV();
          }
        });
    });

    getConfirmCSV();

    if(d3.select("#confirmDiv").style("opacity") == 0) { toolWindowToggle("confirm"); }
  });




  socket.on("edit", function(tmpData) {
    d3.select("#progBar")
      .attr("aria-valuenow", 100)
      .style("width", "100%")
      .text("100%");

    if(map.getZoom() >= 8) {
      catchments.setUrl("https://ecosheds.org/geoserver/wms?" + Math.random() + "&");
    }

    catchments.redraw();
    alert(tmpData.msg);

    //***reset forms
    //***manual
    document.getElementById("manualForm").reset();
    d3.select("#manualReasonSel").property("selectedIndex", 0);
    document.getElementById("manualReasonSel").setCustomValidity("A reason must be selected");
    ["#manualRadNew", "#manualRadOld"].forEach(function(tmpRad) {
      $(tmpRad).click();
    });
    
    //***file import
    document.getElementById("codeFile").value = "";
    d3.select("#codeForm").selectAll("select").property("selectedIndex", 0).each(function() { 
      this.setCustomValidity("A field must be selected");
    });
    ["#codeRadFeatID", "#codeRadCoords", "#codeRadRaw", "#codeRadCodes"].forEach(function(tmpRad) {
      $(tmpRad).click();
    });
    if(d3.select("#codeReasonUse").property("checked") == true) { $("#codeReasonUse").click(); }
    d3.select("#progBarDiv").style("display", "none")

    //d3.select("#codeForm").selectAll(".filterAttrList.minwidth").property("selectedIndex", 0).each(function() { setCodeSelVal(this); });
    if(d3.select("#confirmDiv").style("opacity") == 1) {
      toolWindowToggle("confirm");
    }
  });



  socket.on("updateProg", function(tmpData) {
    console.log(tmpData);
    d3.select("#progBar")
      .attr("aria-valuenow", parseInt(tmpData.percent))
      .style("width", tmpData.percent + "%")
      .text(tmpData.percent + "%");
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
    //***Not approved to make edits (admin)
    else if(tmpData.code == 201) {
      alert(tmpData.msg);
    }
  });


}



