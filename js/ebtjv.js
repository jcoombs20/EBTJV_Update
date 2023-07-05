function initPage() {

  //******Initialize bootstrap tooltip
  $(function() {
    $('[data-toggle="tooltip"]').tooltip();
  });

  //******Call function to reposition windows on resize
  window.addEventListener('resize', resizePanels);

  tmpLoad = true;

  map = new L.Map('map', {attributionControl: false, zoomControl: false, minZoom: 5, maxZoom: 19, inertiaDeceleration: 1000, worldCopyJump: true, maxBounds: [[75,-176],[0,-35]]});
  map.fitBounds([[35,-85],[47,-67]]);

  //******Watch events and get data from postgres when level is appropriate and add as SVG
  map.on("moveend", function(event) { d3.select("#map").style("cursor", ""); });
  map.on("movestart", function() { d3.select("#map").style("cursor", "grabbing"); });


  L.control.mousePosition().addTo(map);
  L.control.scale({ maxWidth: 150, position: 'bottomright' }).addTo(map);

  //***Bing geocoder control
  var tmpPoint = new L.marker;
  var bingGeocoder = new L.Control.BingGeocoder('At3gymJqaoGjGje-JJ-R5tJOuilUk-gd7SQ0DBZlTXTsRoMfVWU08ZWF1X7QKRRn', { callback: function (results)
    {
      if(results.statusCode == 200) {
        if(d3.select("#bingGeocoderSubmit").classed("fa-search")) {
          $(document).ready(function(){
            $('[data-toggle="tooltip"]').tooltip();   
          });
          document.getElementById("bingGeocoderInput").blur();
          var bbox = results.resourceSets[0].resources[0].bbox,
            first = new L.LatLng(bbox[0], bbox[1]),
            second = new L.LatLng(bbox[2], bbox[3]),
            tmpBounds = new L.LatLngBounds([first, second]);
          this._map.fitBounds(tmpBounds);
          this._map.removeLayer(tmpPoint);
          tmpPoint = new L.marker(results.resourceSets[0].resources[0].point.coordinates);
          this._map.addLayer(tmpPoint);
          d3.select(".leaflet-marker-icon")
            .attr("id","mapIcon")
            .attr("value", results.resourceSets[0].resources[0].name)
            .attr("data-toggle", "tooltip")
            .attr("data-container", "body")
            .attr("data-placement", "top")
            .attr("data-html", "true")
            .attr("title", '<p><b>' + results.resourceSets[0].resources[0].name + '</b></p>');
          d3.select(tmpPoint)
            .on("click", function() { clearSearch(); });
          d3.select("#bingGeocoderSubmit")
            .classed("fa-search", false)
            .classed("fa-times", true)
            .property("title", "Click to clear locate results");
        }
        else {
          clearSearch();
        }
      }
      else {
        d3.select("#bingGeocoderInput").property("value","No matching results");    
      }
    }
  });


  //******Make headerControls div
  d3.select("body")
    .insert("div", ":first-child")
    .attr("id", "headerControls");


  //******Make header div
  d3.select("body")
    .insert("div", ":first-child")
    .attr("class", "header")
    .style("padding", "3px 0px 3px 15px")
    .style("height", "40px")
    .html('<img id="titleImg" src="images/ebtjv_icon.png"></img><span class="brand">EBTJV Catchment Updater</span> <div id="headerLinks"><a id="launchIntro" href="#" title="Click to launch introduction tutorial" onclick="startIntro()">Tutorial</a><a id="showDetails" title="Click to display informational details about this tool" href="#" data-toggle="modal" data-target="#helpDiv">About</a></div><div id="printDownload" class="pull-right"><span id="downloadControl" class="glyphicon glyphicon-download-alt" title="Download spatial data" onclick="toolWindowToggle(&quot;download&quot;)"></span><span id="printControl" class="fa fa-print" title="Print current map" onclick="window.print()"></span></div>');
    //.html('<span class="brand">MI Riparian Planting Prioritization Tool</span> <div id="headerLinks"><a id="showWelcome" href="#" title="Click to show the welcome screen" onclick="d3.select(&quot;#splashScreen&quot;).style(&quot;display&quot;,&quot;flex&quot;)">Welcome</a><a id="launchIntro" href="#" title="Click to launch introduction tutorial" onclick="startIntro()">Tutorial</a><a id="showDetails" title="Click to display informational details about this tool" href="#" data-toggle="modal" data-target="#helpDiv">About</a><a title="Click to go to the Ecosheds homepage" href="http://ecosheds.org" target="_blank">SHEDS Home</a></div><div id="printDownload" class="pull-right"><span id="downloadControl" class="glyphicon glyphicon-download-alt" title="Download spatial data" onclick="toolWindowToggle(&quot;download&quot;)"></span><span id="printControl" class="glyphicon glyphicon-print" title="Print current map" onclick="window.print()"></span></div>');





  //Add login icon to enable editing of catchment codes

  d3.select(".header")
    .append("div")
    .attr("id", "secureDiv")
    .attr("class", "hcPanelDivs layerList")
    .html('<p id="loginNameP"></p><span id="loginIcon" class="secure fa fa-lock" title="Click to login or register"></span>');

  d3.select("#loginIcon")
    .on("click", function() {
      var tmpSpan = d3.select(this);
      //console.trace();
      if(tmpSpan.classed("fa-lock") == true) {
        $('#loginModal').modal('show')
      }
      else {
        
        var logOut = confirm("Do you want to log out?");
        if(logOut == true) {
          tmpSpan.classed("fa-unlock", false);
          tmpSpan.classed("fa-lock", true);
          tmpSpan.property("title", "Click to log in or register");
          d3.select("#loginNameP").text("");
          d3.select("#userLog").property("value", "")
          d3.select("#passwordLog").property("value", "")
          accessToken = "";
          curUser = "";
          adStates = "";
          d3.select("#launchIntro").style("pointer-events", "none");
          d3.select("#blurBackground").style("display", "block");
          d3.selectAll("#legendDiv,#infoDiv,#locateDiv,#updateDiv,#downloadDiv,#catchDiv,#confirmDiv").each(function() {
            if(d3.select(this).style("opacity") == 1) {
              toolWindowToggle(this.id.replace("Div",""));
            }
          });
          d3.selectAll("#baselayerListDropdown,#overlayListDropdown").style("display", "none");

          $("#loginIcon").click();
        }
      }
    });


  //******Add blur layer prior to login
  d3.select("body")
    .append("div")
    .attr("id", "blurBackground");


  //******Add modal login box
  d3.select("body")
    .append("div")
    .attr("id", "loginModal")
    .attr("class", "modal fade")
    .append("div")
    .attr("class", "modal-dialog modal-dialog-centered")
    .html('<div class="modal-body" id="login">'
      + '<span id="loginClose" class="fa fa-times-circle" data-dismiss="modal" title="Cancel login"></span>'
      + '<div id="loginDiv">'
        + '<form action="javascript:;" onsubmit="login(this)">'
          + '<input id="userLog" type="text" class="registerInput" name="email_log" placeholder="email" title="Email address" value="" required></input>'
          + '<input id="passwordLog" type="password" class="registerInput pw_input" name="password_log" placeholder="password" title="Password" value="" required></input><span class="pw fa fa-eye" id="togglePWLog" title="Click to show password"></span>'
          + '<p id="loginErr"></p>'
          + '<button type="submit" id="loginBut" class="btn btn-primary" title="Click to login"><span class="fa fa-sign-in"></span>Login</button>'
          + '<p id="registerP"><span id="registerSpan" title="Click to register for an account">Register</span> for an account</p>'
        + '</form>'
      + '</div>'
      + '</div>'
      + '<div class="modal-body" id="register">'
      + '<span id="registerClose" class="fa fa-mail-reply-all" title="Return to login window"></span>'
      + '<div id="registerDiv">'
        + '<form action="javascript:;" onsubmit="register(this)">'
          + '<input type="text" class="registerInput" name="fname" placeholder="first name" title="First name" required></input>'
          + '<input type="text" class="registerInput" name="lname" placeholder="last name" title="Last name" required></input>'
          + '<input type="text" class="registerInput" name="org" placeholder="organization" title="Organization" required></input>'
          + '<input id="email_reg" type="email" class="registerInput" name="email" placeholder="email address" title="Email Exists" required data-toggle="popover" data-content="This email has already been registered"></input>'
          + '<input id="password" type="password" class="registerInput pw_input" name="password" placeholder="password" minlength="8" title="Password" required></input><i class="pw fa fa-eye" id="togglePW" title="Click to show password" style="top:-19px;"></i>'
          + '<input id="passwordConf" type="password" class="registerInput pw_input" name="passwordConfirm" placeholder="confirm password" title="Confirm password" required></input><i class="pw fa fa-eye" id="togglePWConf" title="Click to show password"></i>'
          + '<button type="submit" id="registerBut" class="btn btn-primary" title="Click to register"><span class="fa fa-sign-in"></span>Submit</button>'
        + '</form>'
      + '</div>'
      + '</div>' 
    );

  document.getElementById("passwordConf").setCustomValidity("Passwords do not match");

  d3.selectAll(".pw")
    .on("click", function() {
      if(d3.select(this).classed("fa-eye") == true) {
        d3.select(this).classed("fa-eye", false).classed("fa-eye-slash", true).property("title", "Click to hide password");
        switch(this.id) {
          case "togglePWLog":
            d3.select("#passwordLog").attr("type", "text");
            break;
          case "togglePW":
            d3.select("#password").attr("type", "text");
            break;
          case "togglePWConf":
            d3.select("#passwordConf").attr("type", "text");
            break;
        }
      }
      else {
        d3.select(this).classed("fa-eye-slash", false).classed("fa-eye", true).property("title", "Click to show password");
        switch(this.id) {
          case "togglePWLog":
            d3.select("#passwordLog").attr("type", "password");
            break;
          case "togglePW":
            d3.select("#password").attr("type", "password");
            break;
          case "togglePWConf":
            d3.select("#passwordConf").attr("type", "password");
            break;
        }
      }

    });


  //***Add check for existing email during registration
  d3.select("#email_reg")
    .on("blur", function() {
      if(this.value != "") {
        if(d3.select("#email_reg").attr("aria-describedby") != null) {
          $("#email_reg").popover("hide"); 
          $("#email_reg").on("hidden.bs.popover", function () {
            socket.emit("check_email", this.value); 
          })
        }
        else {
          socket.emit("check_email", this.value); 
        }
      }
    });

  //***Add check for same passwords
  d3.select("#passwordConf")
    .on("blur", function() {
      if(this.value != d3.select("#password").property("value")) {
        this.setCustomValidity("Passwords must be matching");
        if(this.value.length > 0) {
          this.reportValidity();
        }
      }
      else {
        this.setCustomValidity("");
      }
    });

        

  $("#email_reg").popover("disable");

  //***Add register toggle
  d3.select("#registerSpan")
    .on("click", function() { d3.select("#login").style("display", "none"); d3.select("#register").style("display", "block"); });

  //***Cancel registration
  d3.select("#registerClose")
    .on("click", function() { 
      d3.select("#register").style("display", "none"); 
      d3.select("#login").style("display", "block"); 
      $("#email_reg").popover("hide");
    });

  //***Add keyboard listener to input
  d3.select("#loginDiv").selectAll("input")
    .on("keyup", function() { if(d3.event.keyCode == 13) { login(); } });

  d3.select("#loginBut")
    .on("click", function() {
      login();
    });








  //******Make div for geolocater
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "locateDiv");

  $('#locateDiv').draggable({containment: "html", cancel: ".toggle-group,input,textarea,button,select,option"});

  d3.select("#locateDiv")
    .append("h4")
    .text("Locate")
    .attr("class", "legTitle")
    .attr("id", "locateTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Locate</b></u></p><p>Enter name or coordinates to zoom to a location on the map.</p>"</span>');
 
  d3.select("#locateTitle")
    .html(d3.select("#locateTitle").html() + '<div class="exitDiv"><span id="hideLocate" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideLocate")
    .on("click", function() { toolWindowToggle("locate"); });

  d3.select("#locateDiv")
    .append("div")
    .attr("id", "bingGeoLocate");



  document.getElementById('bingGeoLocate').appendChild(bingGeocoder.onAdd(map));
  d3.select("#bingGeocoderInput")
    .on("mouseup", function() { if(this.value == "No matching results") { this.value = ""; } else { $(this).select(); } })
    .on("blur", function() { modifySearch(this, "blur"); })
    .on("keyup", function() { modifySearch(this, "key"); });

  function modifySearch(tmpEl, tmpEvent) {
    if(tmpEvent == "blur") {
      if((tmpEl.value == "" || tmpEl.value == "No matching results") && document.getElementById("mapIcon")) { 
        tmpEl.value = d3.select("#mapIcon").attr("value"); 
        d3.select("#bingGeocoderSubmit").classed("fa-times", true).classed("fa-search", false);
      }
      else if(tmpEl.value == "No matching results" && !document.getElementById("mapIcon")) {
        tmpEl.value = "";
      }
    } 
    else if(document.getElementById("mapIcon")) {
      if(tmpEl.value != d3.select("#mapIcon").attr("value")) {
        d3.select("#bingGeocoderSubmit").classed("fa-times", false).classed("fa-search", true);
      }
      else {
        d3.select("#bingGeocoderSubmit").classed("fa-times", true).classed("fa-search", false);
      }
    }
  }





  //******Clear the results of the geo search
  function clearSearch() {
    map.removeLayer(tmpPoint);
    d3.select(".tooltip").remove();
    d3.select("#bingGeocoderInput").property("value", "");

    d3.select("#bingGeocoderSubmit")
      .classed("fa-times", false)
      .classed("fa-search", true)
      .style("background", "")
      .property("title", "Click to zoom to specified location");
  }


  //***Add in backgrounds
  var googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  });
  var googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  }); 
  var googleStreet = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  });
  var googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  });

      var bingHybrid = new L.BingLayer("At3gymJqaoGjGje-JJ-R5tJOuilUk-gd7SQ0DBZlTXTsRoMfVWU08ZWF1X7QKRRn", {type: 'AerialWithLabels'});
      var bingSatellite = new L.BingLayer("At3gymJqaoGjGje-JJ-R5tJOuilUk-gd7SQ0DBZlTXTsRoMfVWU08ZWF1X7QKRRn", {type: 'Aerial'});
      var bingStreet = new L.BingLayer("At3gymJqaoGjGje-JJ-R5tJOuilUk-gd7SQ0DBZlTXTsRoMfVWU08ZWF1X7QKRRn", {type: 'Road'});

  var usgsTopo = new L.tileLayer('https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 15,
    zIndex: 0,
    attribution: '<a href="http://www.doi.gov">U.S. Department of the Interior</a> | <a href="https://www.usgs.gov">U.S. Geological Survey</a> | <a href="https://www.usgs.gov/laws/policies_notices.html">Policies</a>'
  });

  var blank = new L.tileLayer('');


  //***Add in overlays
  var boundary = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_boundary',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  states = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_states',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  var counties = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_counties',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  var huc6 = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_huc6',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  var huc8 = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_huc8',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  var huc10 = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_huc10',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  huc12 = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_huc12',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  patches_bkt = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_patches_bkt_09_22_16',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  patches_wild = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_patches_wild_trout_09_22_16',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  catchments = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_catchments_current',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  var streams = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebtjv_streams',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });

  var barriers = L.tileLayer.wms('https://ecosheds.org/geoserver/wms', {
    layers: 'ebtjv_updater:ebjtv_barriers_09_23_15_states_sj',
    format: 'image/png',
    transparent: true,
    tiled: true,
    version: '1.3.0',
    maxZoom: 22
  });



  var opaVar = [boundary, states, counties, huc6, huc8, huc10, huc12, patches_bkt, patches_wild, catchments, streams, barriers];
  infoObj = {"ebtjv_boundary": "EBTJV Boundary", "ebtjv_states": "States", "ebtjv_counties": "Counties", "ebtjv_huc6": "HUC-6", "ebtjv_huc8": "HUC-8", "ebtjv_huc10": "HUC-10", "ebtjv_huc12": "HUC-12", "ebtjv_patches_bkt_09_22_16": "Brook Trout Patches", "ebtjv_patches_wild_trout_09_22_16": "Wild Trout Patches", "ebtjv_catchments_current": "Catchments", "ebtjv_streams": "NHDPlus v2 Streams", "ebjtv_barriers_09_23_15_states_sj": "Stream Barriers"};
  infoIDField = {"ebtjv_boundary": "name", "ebtjv_states": "state", "ebtjv_counties": "county", "ebtjv_huc6": "hu_6_name", "ebtjv_huc8": "hu_8_name", "ebtjv_huc10": "hu_10_name", "ebtjv_huc12": "hu_12_name", "ebtjv_patches_bkt_09_22_16": "feat_id", "ebtjv_patches_wild_trout_09_22_16": "feat_id", "ebtjv_catchments_current": "featureid", "ebtjv_streams": "gnis_name", "ebjtv_barriers_09_23_15_states_sj": "dam_name"};
  infoDataType = {"ebtjv_boundary": "polygon", "ebtjv_states": "polygon", "ebtjv_counties": "polygon", "ebtjv_huc6": "polygon", "ebtjv_huc8": "polygon", "ebtjv_huc10": "polygon", "ebtjv_huc12": "polygon", "ebtjv_patches_bkt_09_22_16": "polygon", "ebtjv_patches_wild_trout_09_22_16": "polygon", "ebtjv_catchments_current": "polygon", "ebtjv_streams": "line", "ebjtv_barriers_09_23_15_states_sj": "point"};
  queryIDField = {"ebtjv_boundary": "id", "ebtjv_states": "fips", "ebtjv_counties": "counties_", "ebtjv_huc6": "objectid", "ebtjv_huc8": "objectid", "ebtjv_huc10": "objectid", "ebtjv_huc12": "objectid", "ebtjv_patches_bkt_09_22_16": "feat_id", "ebtjv_patches_wild_trout_09_22_16": "feat_id", "ebtjv_catchments_current": "featureid"};
  var overlayID = d3.keys(infoObj);
  var baselayers = {"Google Terrain": googleTerrain, "Google Hybrid": googleHybrid, "Google Satellite": googleSatellite, "Google Street": googleStreet, "Bing Hybrid": bingHybrid, "Bing Satellite": bingSatellite, "Bing Street": bingStreet, "USGS Topo": usgsTopo, "None": blank};
  var overlays = {"EBTJV Boundary": boundary, "States": states, "Counties": counties, "HUC-6": huc6, "HUC-8": huc8, "HUC-10": huc10, "HUC-12": huc12, "Brook Trout Patches": patches_bkt, "Wild Trout Patches": patches_wild, "Catchments": catchments, "NHDPlus v2 Streams": streams, "Stream Barriers": barriers};
  var overlayTitles = d3.keys(overlays);

  //******Make layer controller
  //***baselayers
  var layerNames = {};
  layerNames.baseLayers = baselayers; //{"Google Terrain": googleTerrain, "Google Hybrid": googleHybrid, "Google Satellite": googleSatellite, "Google Street": googleStreet, "None": blank};
  layerNames.baseLayers.keys = d3.keys(layerNames.baseLayers);
  layerNames.baseLayers.values = d3.values(layerNames.baseLayers);


  //***Overlay layers
  layerNames.overlays = {};
  overlayTitles.forEach(function(tmpTitle,i) {
    layerNames.overlays[tmpTitle] = opaVar[i];
  });
  layerNames.overlays.keys = d3.keys(overlays);
  layerNames.overlays.values = d3.values(overlays);



  d3.select("#headerControls")
    .insert("div", ":first-child")
    .attr("id", "mapTools")
    .append("div")
    .attr("id", "baselayerSelect")
    .attr("class", "layerList")
    .append("div")
    .attr("id", "baselayerList")
    .attr("class", "cl_select")
    .property("title", "Click to change map baselayer")
    .html('<span id="baselayerListHeader">Change Baselayer</span><span class="fa fa-caret-down pull-right" style="position:relative;top:3px;"></span>')
    .on("click", function() { if(d3.select("#baselayerListDropdown").style("display") == "none") {d3.select("#baselayerListDropdown").style("display", "inline-block");} else {d3.select("#baselayerListDropdown").style("display", "none");} });;

  d3.select("#baselayerSelect")
    .append("div")
    .attr("id", "baselayerListDropdown")
    .attr("class", "layerListDropdown")
    .on("mouseleave", function() { d3.select(this).style("display", "none") });

  //******Add baselayer options
  d3.select("#baselayerListDropdown").selectAll("div")
    .data(layerNames.baseLayers.keys)
    .enter()
      .append("div")
      .attr("class", "layerName")
      .text(function(d) { return d; })
      .property("value", function(d,i) { return i; })
      .property("title", function(d) { return d; })
      .on("click", function() { changeBaselayer(this); })
      .append("span")
      .attr("class", "fa fa-check pull-right activeOverlay")
      .style("visibility", function(d,i) { if(i == 0) {return "visible";} else {return "hidden";} });

  //******Initialize baselayer
  map.addLayer(googleTerrain);
  //map.addLayer(boundary);

  //******Function to change baselayer on select change
  function changeBaselayer(tmpDiv) {
    //***Remove old layer
    var layerDivs = d3.select("#baselayerListDropdown").selectAll("div");
      
    layerDivs._groups[0].forEach(function(tmpLayer) {
      if(d3.select(tmpLayer).select("span").style("visibility") == "visible") {
        d3.select(tmpLayer).select("span").style("visibility", "hidden");
        map.removeLayer(layerNames.baseLayers.values[d3.select(tmpLayer).property("value")]);
      }
    });

    //***Add new layer
    d3.select(tmpDiv).select("span").style("visibility", "visible");
    map.addLayer(layerNames.baseLayers.values[tmpDiv.value]);
    layerNames.baseLayers.values[tmpDiv.value].bringToBack();       
  }



  //***Overlay layers
  d3.select("#mapTools")
    .append("div")
    .attr("id", "overlaySelect")
    .attr("class", "layerList")
    .append("div")
    .attr("id", "overlayList")
    .attr("class", "cl_select")
    .property("title", "Click to select overlay layers to display on map")
    .html('<span id="overlayListHeader">View Overlay Layers</span><span class="fa fa-caret-down pull-right" style="position:relative;top:3px;"></span>')
    .on("click", function() { if(d3.select("#overlayListDropdown").style("display") == "none") {d3.select("#overlayListDropdown").style("display", "inline-block");} else {d3.select("#overlayListDropdown").style("display", "none");} });;
   d3.select("#overlaySelect")
    .append("div")
    .attr("id", "overlayListDropdown")
    .attr("class", "layerListDropdown")
    .on("mouseleave", function() { d3.select(this).style("display", "none") });

  //******Add overlay options
  d3.select("#overlayListDropdown").selectAll("div")
    .data(layerNames.overlays.keys)
    .enter()
      .append("div")
      .attr("id", function(d,i) { return "layerToggleDiv" + i; })
      .attr("class", "layerName")
      .text(function(d) { return d; })
      .property("value", function(d,i) { return i; })
      .property("title", function(d) { return d; })
      .property("name", function(d,i) { return overlayID[i]; })
      .on("click", function() { changeOverlay(this); })
      .append("span")
      .attr("class", "fa fa-check pull-right activeOverlay")
      .style("visibility", "hidden"); //function(d) { if(d == "US States") { map.addLayer(states); return "visible"; } else { return "hidden"; } });

  //******Function to add/remove overlay layer
  function changeOverlay(tmpDiv) {
    if(d3.select(tmpDiv).select("span").style("visibility") == "hidden") {
      d3.select(tmpDiv).select("span").style("visibility", "visible");
      map.addLayer(layerNames.overlays.values[tmpDiv.value]);
      layerNames.overlays.values[tmpDiv.value].bringToFront();
      addLegendImg(tmpDiv.name, tmpDiv.title, layerNames.overlays.values[tmpDiv.value], ["overlays",tmpDiv.title]);
    } 
    else {
      d3.select(tmpDiv).select("span").style("visibility", "hidden");
      map.removeLayer(layerNames.overlays.values[tmpDiv.value]);
      remLegendImg(tmpDiv.name);
    }
  }




  //Add panel icons
  d3.select("#headerControls")
    .append("div")
    .attr("id", "panelTools");

  var hcPanels = ["legend" ,"info", "update", "recents", "locate", "extent"];
  var hcGlyphs = ["fa-th-list", "fa-info", "fa-pencil-square", "fa-table", "fa-search", "fa-globe"];
  var hcLabel = ["Legend", "Identify", "Update", "Recent Edits", "Locate", "Zoom"]
  d3.select("#panelTools").selectAll("divs")
    .data(hcPanels)
    .enter()
      .append("div")
      .attr("id", function(d) { return "hc" + d.charAt(0).toUpperCase() + d.slice(1) + "Div"; })
      .attr("class", function(d) { if(d != "select") { return "hcPanelDivs layerList"; } else { return "hcPanelDivs layerList disabled"; } })
      .property("title", function(d,i) {
        if(d == "extent") {
          return "Click to zoom to initial extent";
        }
        else {
          return "Click to show " + hcLabel[i] + " window"; 
        }
      })
      .html(function(d,i) { if(d != "search") { return '<span class="fa ' + hcGlyphs[i] + '"></span>'; } else { return '<span class="fa ' + hcGlyphs[i] + '" data-toggle="collapse" data-target="#bingGeoLocate"></span>'; } })
      .on("click", function(d) { 
        switch (d) {
          case "extent":
            map.fitBounds([[35,-85],[47,-67]]);
            break;
          default:
            toolWindowToggle(d);
            break;
        }
      });


  //******Function to toggle tool windows
  var toggleWords = {"legend":"Legend", "info":"Identify", "locate": "Locate", "update": "Update", "download": "Download", "catch": "Catchment Info", "confirm": "Confirm", "recents": "Recent Edits"}
  toolWindowToggle = function (tmpDiv) {
    if (d3.select("#" + tmpDiv + "Div").style("opacity") == "1") {
      d3.select("#" + tmpDiv + "Div").transition().style("opacity", "0").style("visibility", "hidden");
      d3.select("#hc" + tmpDiv.charAt(0).toUpperCase() + tmpDiv.slice(1) + "Div").property("title", "Click to show " + toggleWords[tmpDiv] + " window");
      if(tmpDiv == "update") { d3.select("#manualFeat").property("value", ""); }
    }
    else {
      d3.select("#" + tmpDiv + "Div").transition().duration(250).ease(d3.easeCubic).style("opacity", "1").style("display", "block").style("visibility", "visible").on("end", resizePanels);            
      d3.select("#hc" + tmpDiv.charAt(0).toUpperCase() + tmpDiv.slice(1) + "Div").property("title", "Click to hide " + toggleWords[tmpDiv] + " window");
      setZ(d3.select("#" + tmpDiv + "Div")._groups[0][0]);
    }
  }


  function setZ(tmpWin) {
    if (d3.select("#map").classed("introjs-showElement") == false) {
      d3.selectAll("#legendDiv,#infoDiv,#locateDiv,#updateDiv,#downloadDiv,#catchDiv,#confirmDiv").style("z-index", function() { if(d3.select(this).style("opacity") == 1) {return 1001;} else {return 7500;} }); 
      d3.select(tmpWin).style("z-index", 1002);
    }
  }

    




  //******Make tooltip for displaying attribute data
  tooltip = d3.select("body")
    .append("div")
    .attr("id", "d3Tooltip")
    .attr("class", "d3Tooltip");






  //******Make div for viewing Catchment Info
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "catchDiv");

  $('#catchDiv').draggable({containment: "html", cancel: ".toggle-group,input,textarea,button,select,option,table"});

  d3.select("#catchDiv")
    .append("h4")
    .text("Catchment Info")
    .attr("class", "legTitle")
    .attr("id", "catchTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Catchment Information</b></u></p><p>Displays attribute values and editing information about the clicked catchment</p>"</span>');
 
  d3.select("#catchTitle")
    .html(d3.select("#catchTitle").html() + '<div class="exitDiv"><span id="hideCatch" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideCatch")
    .on("click", function() { toolWindowToggle("catch"); });

  d3.select("#catchDiv")
    .append("div")
    .attr("id", "catchInfoDiv")
    .html('<table id="catchInfoTable" class="infoTable"><thead><tr><th>Attribute</th><th>Value</th></tr></thead><tbody></tbody></table>');








  //******Make div for Catchment Update window
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "updateDiv");

  $('#updateDiv').draggable({containment: "html", cancel: ".toggle-group,input,textarea,button,select,option"});

  d3.select("#updateDiv")
    .append("h4")
    .text("Update Catchments")
    .attr("class", "legTitle")
    .attr("id", "updateTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Update Catchments</b></u></p><p>Update EBTJV catchment classification codes for salmonid species presence.</p>"</span>');
 
  d3.select("#updateTitle")
    .html(d3.select("#updateTitle").html() + '<div class="exitDiv"><span id="hideUpdate" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideUpdate")
    .on("click", function() { toolWindowToggle("update"); });

  d3.select("#updateDiv")
    .append("div")
    .attr("id", "updateCritDiv")
    .html(''
      + '<div id="methodSelDiv">'
        + '<label>Update Method</label>'
        + '<select id="methodSel" class="filterAttrList" title="Click to select a method of updating the catchments"></select><span id="featSelReset" class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Update Method</b></u></p><p>Catchments can be updated using one of the following methods:<ul><li><b><u>Manual Edit</u></b> - Select and edit a single catchment by hand</li><li><b><u>Import File</u></b> - Import a data file (Execl or CSV) containing catchment IDs or sample point coordinates with associated EBTJV code or species data</li></ul></p>"></span>'
      + '</div>'
      + '<hr id="updateHR">'
      //***Manual Entry
      + '<div id="manualDiv" class="updateMethodDiv">'
        + '<h5>Manual Edit<span class="fa fa-info-circle"  data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Manual Edit</b></u></p><p>Steps to update a catchment code through manual edit:<ol><li>Add catchment overlay layer</li><li>Select target catchment by clicking it on the map</li><li>Enter data into form fields</li><li>Click \'Update\' button</li></ol></p>"></span></h5>'
        + '<div id="manualFormDiv">'
          + '<form id="manualForm" action="javascript:;" onsubmit="manualEdit(this)">'
            + '<table id="manualTable" class="updateTable">'
            + '<tr>'
            + '<td><label>Feature ID: </label></td>'
            + '<td><input type="text" id="manualFeat" class="filterAttrList inputText minWidth" name="manualFeat" title="Enter the feature id of the target catchment or click on it on the map" required></input></td>'
            + '</tr>'
            + '<tr>'
            + '<td><label>Updated Code: </label></td>'
            + '<td><select id="manualCode" class="filterAttrList minWidth" name="manualCode" title="Select the EBTJV code to which to update" required></select><span class="fa fa-info-circle"  data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>EBTJV Catchment Codes</b></u></p><p><ul><li><u><b>-1</b></u>: Unknown</li><li><u><b>0</b></u>: No salmonids present</li><li><u><b>0.2</b></u>: Brown Trout</li><li><u><b>0.3</b></u>: Rainbow Trout</li><li><u><b>0.4</b></u>: Rainbow & Brown Trout</li><li><u><b>05</b></u>: Stocked Brook Trout</li><li><u><b>1.1</b></u>: Brook Trout</li><li><u><b>1.2</b></u>: Brook & Brown Trout</li><li><u><b>1.3</b></u>: Brook & Rainbow Trout</li><li><u><b>1.4</b></u>: Brook, Brown & Rainbow Trout</li></ul>*P added to end of code indicates predicted (>10 years since sampled)</p>"></span></td>'
            + '</tr>'
            + '<tr>'
            + '<td><label>Sample Date: </label></td>'
            + '<td><input type="date" id="manualSampDate" class="filterAttrList minWidth" name="manualSampDate" title="Date of new sample responsible for catchment update" required></input></td>'
            + '</tr>'
            + '<tr>'
            + '<td><label>Reason: </label></td>'
            + '<td><input type="radio" id="manualRadOld" class="filterAttrList manualRadio" name="manualReason" value="old" title="Choose this option to select a reason from a list populated with reasons that are currently in the table" checked><label class="manualRadioLabel" for="manualRadOld" title="Choose this option to select a reason from a list populated with reasons that are currently in the table">Existing</label></input><input type="radio" id="manualRadNew" class="filterAttrList manualRadio" name="manualReason" value="new" title="Choose this option to add a new reason not already present in the database"><label class="manualRadioLabel" for="manualRadNew" title="Choose this option to add a new reason not already present in the database">New</label></input></td>'
            + '</tr>' 
            + '<tr>'
            + '<td></td>'
            + '<td><select id="manualReasonSel" class="filterAttrList minWidth" name="manualReasonSel" title="Select the reason for updating the catchment" required><option>Select reason...</option></select><input type="text" id="manualReasonText" class="filterAttrList inputText minWidth" name="manualReasonText" title="Add a new reason for updating the catchment"</input></td>'
            + '</tr>'
            + '<tr>'
            + '<td><label>Extend Upstream: </label></td>'
            + '<td>'
              + '<input type="radio" id="manualRadNo" class="filterAttrList manualRadio" name="manualExtend" value="no" title="Choose this option to only edit the currently selected catchment" checked><label class="manualRadioLabel" for="manualRadNo" title="Choose this option to only edit the currently selected catchment">No</label></input>'
              + '<input type="radio" id="manualRadYes" class="filterAttrList manualRadio" name="manualExtend" value="yes" title="Choose this option to extend the current edit to upstream catchments that were originally classified using the same sample as the current catchment"><label class="manualRadioLabel" for="manualRadYes" title="Choose this option to extend the current edit to upstream catchments that were originally classified using the same sample as the current catchment">Yes</label></input>'
              + '<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Extend Upstream</b></u></p><p>A &apos;Yes&apos; selection will extend the current edit to all upstream catchments classified using the same Sample OID and having greater Catchment Count values.</p>" style="position:relative;top:-4px;right:-53px;"></span>'
            + '</td>'
            + '</tr>'
            + '</table>'
            + '<hr id="updateHR">'
            + '<div id="updateButDiv">'
              + '<button type="submit" id="manualBut" class="formBut btn btn-primary" title="Click to update catchment">Update <span class="fa fa-play"></span></button>'
            + '</div>'
          + '</form>'
        + '</div>'
      + '</div>'

      //***Import file
      + '<div id="codeDiv" class="updateMethodDiv">'
        + '<h5>Import File<span class="fa fa-info-circle"  data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Import File</b></u></p><p>Steps to update catchments by importing a data file:<ol><li>Choose your data file (can be either Excel or CSV format, see \'About\' for formatting details, NOTE: CSV files <b>cannot</b> contain internal commas in the data)</li><li>If data file is Excel format with multiple worksheets, select the appropriate worksheet name</li><li>Choose the appropriate options for how the catchment location and classification information is stored in your data file, and choose whether to extend current updates to upstream catchments (see \'About\' section for details regarding how and when to use the extend option)</li><li>Map the data file column names to the appropriate fields</li><li>Click the \'Update\' button to initiate the update process</li></ol></p>"></span></h5>'
        + '<div id="codeFormDiv">'
          + '<form id="codeForm" action="javascript:;" onsubmit="importEdit(this)">'
            + '<table id="codeTable" class="updateTable">' 
            + '<tr>' // style="border-bottom: 1px solid;">'
            + '<td colspan="3" style="padding-bottom:5px;"><input type="file" id="codeFile" class="inputText" name="codeFile" accept=".csv,.xlsx" title="Click to select a file" required></input></td>'
            //+ '<td style="text-align:center;"><span id="codeFileUpload" class="fa fa-upload" title="Click to upload the selected file"></span></td>'
            + '</tr>'
            + '<tr id="sheetSelTR">'
            + '<td colspan="3" style="padding-bottom:5px;text-align:center;"><label style="margin-right:5px;">Worksheet:</label><select id="sheetSel" class="filterAttrList" name="xlSheet" title="Click to select the appropriate Excel worksheet"></select></td>'
            + '</tr>'
            + '<tr class="radTR" style="border-top: 1px solid;">'
            + '<td><label>Locate Catchment: </label></td>'
            + '<td><input type="radio" id="codeRadCoords" class="filterAttrList manualRadio" name="codeLocID" value="coordinates" title="Choose this option to identify catchments through sample location coordinates (decimal degrees)" checked><label class="manualRadioLabel" for="codeRadCoords" title="Choose this option to identify catchments through sample location coordinates (decimal degrees)">Coordinates</label></input></td>'
            + '<td><input type="radio" id="codeRadFeatID" class="filterAttrList manualRadio" name="codeLocID" value="featureid" title="Choose this option to identify catchments by their feature ID\'s"><label class="manualRadioLabel" for="codeRadFeatID" title="Choose this option to identify catchments by their feature ID\'s">Feature ID</label></input></td>'
            + '</tr>'
            + '<tr class="radTR">'
            + '<td><label>Classify Catchment: </label></td>'
            + '<td><input type="radio" id="codeRadCodes" class="filterAttrList manualRadio" name="codeClassify" value="ebtjv_code" title="Choose this option to classify catchments using EBTJV codes" checked><label class="manualRadioLabel" for="codeRadCodes" title="Choose this option to classify catchments using EBTJV codes">EBTJV Code</label></input></td>'
            + '<td><input type="radio" id="codeRadRaw" class="filterAttrList manualRadio" name="codeClassify" value="raw_data" title="Choose this option to classify catchments using salmonid species presence data.\nUse 0 or an empty cell to indicate not present, and any integer > 0 to indicate present."><label class="manualRadioLabel" for="codeRadRaw" title="Choose this option to classify catchments using salmonid species presence data.\nUse 0 or an empty cell to indicate not present, and any integer > 0 to indicate present.">Species Presence</label></input></td>'
            + '</tr>'
            + '<tr class="radTR" style="border-bottom: 1px solid;">'
            + '<td style="padding-bottom:5px;"><label>Extend Upstream: </label></td>'
            + '<td><input type="radio" id="codeRadNo" class="filterAttrList manualRadio" name="codeExtend" value="no" title="Choose this option to only edit the catchments in the file" checked><label class="manualRadioLabel" for="codeRadNo" title="Choose this option to only edit the catchments in the file">No</label></input></td>'
            + '<td></input><input type="radio" id="codeRadYes" class="filterAttrList manualRadio" name="codeExtend" value="yes" title="Choose this option to extend the current edit to upstream catchments that were originally classified using the same sample as the current catchment"><label class="manualRadioLabel" for="codeRadYes" title="Choose this option to extend the current edit to upstream catchments that were originally classified using the same sample as the current catchment">Yes</label></td>'
            + '</tr>'
            + '<tr class="radTR">'
            + '<td><label><b>Map the below fields: </b></label></td>'
            + '<td></td>'
            + '<td></td>'
            + '</tr>'
            + '<tr id="codeFormLatTR">'
            + '<td><label>Latitude: </label></td>'
            + '<td><select id="codeLatSel" class="filterAttrList minwidth" name="codeLatSel" title="Select the field in the CSV file that contains the latitude of the new sample" required><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr id="codeFormLongTR">'
            + '<td><label>Longitude: </label></td>'
            + '<td><select id="codeLongSel" class="filterAttrList minwidth" name="codeLongSel" title="Select the field in the CSV file that contains the longitude of the new sample" required><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr id="codeFormFeatTR">'
            + '<td><label>Feature ID: </label></td>'
            + '<td><select id="codeFeatSel" class="filterAttrList minwidth" name="codeFeatSel" title="Select the field in the CSV file that contains the catchment feature ID"><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr id="codeFormCodeTR">'
            + '<td><label>Updated Code: </label></td>'
            + '<td><select id="codeCodeSel" class="filterAttrList minwidth" name="codeCodeSel" title="Select the field in the CSV file that contains the updated EBTJV catchment code" required><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr class="codeFormSppTR">'
            + '<td><label>Brook Trout: </label></td>'
            + '<td><select id="codeBktSel" class="filterAttrList minwidth spp" name="codeBktSel" title="Select the field in the CSV file that contains brook trout presence data"><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr class="codeFormSppTR">'
            + '<td><label>Brown Trout: </label></td>'
            + '<td><select id="codeBntSel" class="filterAttrList minwidth spp" name="codeBntSel" title="Select the field in the CSV file that contains brown trout presence data"><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr class="codeFormSppTR">'
            + '<td><label>Rainbow Trout: </label></td>'
            + '<td><select id="codeRbtSel" class="filterAttrList minwidth spp" name="codeRbtSel" title="Select the field in the CSV file that contains rainbow trout presence data"><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr class="codeFormSppTR">'
            + '<td><label>Stocked Brook Trout: </label></td>'
            + '<td><select id="codeBktStockedSel" class="filterAttrList minwidth spp" name="codeBktStockedSel" title="Select the field in the CSV file that contains stocked brook trout presence data" disabled><option>Select field...</option></select></td>'
            + '<td><input type="checkbox" id="codeBktStockedUse" class="filterAttrList useChkbox" name="codeBktStockedUse" title="Check to use and map a field in the file providing presence of stocked brook trout"></input>'
            + '</tr>'
            + '<tr>'
            + '<td><label>Sample Date: </label></td>'
            + '<td><select id="codeDateSel" class="filterAttrList minwidth" name="codeDateSel" title="Select the field in the CSV file that contains the most recent sample date" required><option>Select field...</option></select></td>'
            + '</tr>'
            + '<tr>'
            + '<td><label>Notes: </label></td>'
            + '<td><select id="codeReasonSel" class="filterAttrList minwidth" name="codeReasonSel" title="Select the field in the CSV file that contains notes about the update" disabled><option>Select field...</option></select></td>'
            + '<td><input type="checkbox" id="codeReasonUse" class="filterAttrList useChkbox" name="codeReasonUse" title="Check to use and map a field in the file providing notes about the update"></input>'
            + '</tr>'
            + '</table>'
            + '<hr id="updateHR">'
            + '<div id="updateButDiv">'
              + '<button type="submit" id="codeBut" class="formBut btn btn-primary" title="Click to update catchments">Update <span class="fa fa-play"></span></button>'
            + '</div>'
          + '</form>'
        + '</div>'
      + '</div>'
        
/*
      + '<div id="progBarDiv" class="progress">'
        + '<div id="progBar" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div>'
      + '</div>'
*/
    );


  var updateMethods = ["Select Method...", "Manual Edit", "Import File"];
  var updateMethodDivs = ["", "manualDiv", "codeDiv"];

  var tmpSel = d3.select("#methodSel")
    .on("change", function() { 
      d3.selectAll(".updateMethodDiv").style("display", "none");
      d3.select("#manualFeat").property("value", "");
      var tmpDiv = d3.select(this.options[this.selectedIndex]).attr("data-div");
      d3.select("#" + tmpDiv).style("display", "block");
    });


  tmpSel.selectAll("option")
    .data(updateMethods)
    .enter()
      .append("option")
      .attr("value", function(d) { return d; })
      .attr("data-i", function(d,i) { return i; })
      .attr("data-div", function(d,i) { return updateMethodDivs[i]; })
      .property("disabled", function(d, i) { if(i==0) {return "disabled";} })
      .text(function(d) { return d; });


  d3.select("#manualFeat")
    .on("keydown", function() { 
      if(d3.event.key == "Enter") {
        socket.emit("feat_zoom", {"tmpFeat": this.value});
      }
    });


  var codeTitle = ["", "No Salmonids", "No Salmonids Predicted", "Brown Trout", "Brown Trout Predicted", "Rainbow Trout", "Rainbow Trout Predicted", "Brown & Rainbow Trout", "Brown & Rainbow Trout Predicted", "Stocked Brook Trout", "Stocked Brook Trout Predicted", "Brook Trout", "Brook Trout Predicted", "Brook & Brown Trout", "Brook & Brown Trout Predicted", "Brook & Rainbow Trout", "Brook & Rainbow Trout Predicted", "Brook, Brown & Rainbow Trout", "Brook, Brown & Rainbow Trout Predicted"];
  d3.select("#manualCode").selectAll("option")
    .data(["", "0", "0P", "0.2", "0.2P", "0.3", "0.3P", "0.4", "0.4P", "0.5", "0.5P", "1.1", "1.1P", "1.2", "1.2P", "1.3", "1.3P", "1.4", "1.4P"])
    .enter()
      .append("option")
      .attr("value", function(d) { return d; })
      .property("title", function(d, i) { return codeTitle[i]; })
      .text(function(d) { return d; });

  //***Populate Reasons select
  //socket.emit("get_reasons", {"user": curUser});

  //***Set reason validity on change
  d3.select("#manualReasonSel")
    .on("change", function() { setReasonSelVal(this); });

  //***Set map selects validity on change
  d3.select("#codeForm").selectAll("select")
    .on("change", function() { setCodeSelVal(this); });

  //***Initialize map selects validity
  d3.select("#codeForm").selectAll("select").each(function() { setCodeSelVal(this); });

  //***Add radio button responses for manual edit method
  d3.selectAll("#manualRadOld,#manualRadNew")
    .on("change", function() {
      if(this.value == "old") {
        document.getElementById("manualReasonText").required = false;
        document.getElementById("manualReasonSel").required = true;
        setReasonSelVal(document.getElementById("manualReasonSel"));
        d3.select("#manualReasonText").style("display", "none");
        d3.select("#manualReasonSel").style("display", "block");
      }
      else {
        document.getElementById("manualReasonSel").required = false;
        document.getElementById("manualReasonText").required = true;
        setReasonSelVal(document.getElementById("manualReasonSel"));
        d3.select("#manualReasonSel").style("display", "none");
        d3.select("#manualReasonText").style("display", "block");        
      }
    });
  
  //***Add radio button responses for locate catchment in import method
  d3.selectAll("#codeRadCoords,#codeRadFeatID")
    .on("change", function() {
      if(this.value == "coordinates") {
        document.getElementById("codeFeatSel").required = false;
        document.getElementById("codeLatSel").required = true;
        document.getElementById("codeLongSel").required = true;
        ["codeFeatSel", "codeLatSel", "codeLongSel"].forEach(function(tmpSel) {
          setCodeSelVal(document.getElementById(tmpSel));
        });
        d3.select("#codeFormFeatTR").style("display", "none");
        d3.selectAll("#codeFormLatTR,#codeFormLongTR").style("display", "table-row");
      }
      else {
        document.getElementById("codeFeatSel").required = true;
        document.getElementById("codeLatSel").required = false;
        document.getElementById("codeLongSel").required = false;
        ["codeFeatSel", "codeLatSel", "codeLongSel"].forEach(function(tmpSel) {
          setCodeSelVal(document.getElementById(tmpSel));
        });
        d3.select("#codeFormFeatTR").style("display", "table-row");
        d3.selectAll("#codeFormLatTR,#codeFormLongTR").style("display", "none");
      }
    });

  //***Add radio button responses for classify catchment in import method
  d3.selectAll("#codeRadCodes,#codeRadRaw")
    .on("change", function() {
      if(this.value == "ebtjv_code") {
        var tmpSels = document.getElementsByClassName("spp");
        for (let i=0; i<tmpSels.length; i++) {
          tmpSels[i].required = false;
          setCodeSelVal(tmpSels[i]);
        }
        document.getElementById("codeCodeSel").required = true;
        setCodeSelVal(document.getElementById("codeCodeSel"));
        d3.selectAll(".codeFormSppTR").style("display", "none");
        d3.select("#codeFormCodeTR").style("display", "table-row");
      }
      else {
        var tmpSels = document.getElementsByClassName("spp");
        for (let i=0; i<tmpSels.length; i++) {
          tmpSels[i].required = true;
          setCodeSelVal(tmpSels[i]);
        }
        document.getElementById("codeCodeSel").required = false;
        setCodeSelVal(document.getElementById("codeCodeSel"));
        d3.selectAll(".codeFormSppTR").style("display", "table-row");
        d3.select("#codeFormCodeTR").style("display", "none");
      }
    });


  //***Set validity for manual reason
  function setReasonSelVal(tmpSel) { 
    if(d3.select(tmpSel).property("selectedIndex") > 0 || tmpSel.required == false) {
      document.getElementById("manualReasonSel").setCustomValidity("");
    }
    else {
      tmpSel.setCustomValidity("A reason must be selected");
    }
  }

  //***Set validity for import map selects
  function setCodeSelVal(tmpSel) { 
    if(d3.select(tmpSel).property("selectedIndex") > 0 || tmpSel.required == false) {
      tmpSel.setCustomValidity("");
    }
    else {
      tmpSel.setCustomValidity("A field must be selected");
    }
  }

  //***Enable use checkbox for stocked brook trout
  d3.selectAll("#codeBktStockedUse")
    .on("click", function() {
      if(this.checked == true) {
        d3.select("#codeBktStockedSel").property("disabled", false);
      }
      else {
        d3.select("#codeBktStockedSel").property("disabled", true);
      }
    });

  //***Enable use checkbox for reason
  d3.selectAll("#codeReasonUse")
    .on("click", function() {
      if(this.checked == true) {
        d3.select("#codeReasonSel").property("disabled", false);
      }
      else {
        d3.select("#codeReasonSel").property("disabled", true);
      }
    });


  //***Call when Excel worksheet is changed
  d3.select("#sheetSel")
    .on("change", function() {
      var tmpVal = d3.select(this.options[this.selectedIndex]).attr("value");

      if(tmpVal == "...") {
        this.setCustomValidity("A worksheet must be selected");
        fileImportReset();
      }
      else {
        this.setCustomValidity("");

        fileImport = XLSX.utils.sheet_to_csv(workbook.Sheets[tmpVal], {FS:"\t"});
        fileImport = fileImport.replace(/,/g, ";");
        fileImport = fileImport.replace(/\t/g, ",");

        addFileHeaders(fileImport);
      }
    });



  //***Add file upload function (csv file)
  const ImportRead = new FileReader();
  fileImport = "";

  //***Read import file
  ImportRead.onload = function(event) {
    fileImport = event.target.result;
    //console.log(fileImport);
    const allLines = fileImport.split(/\r?\n/);
    var tmpFields = allLines[0].split(",");
    tmpFields.splice(0,0,"Select field...");

    //***Add file headers to map select boxes
    d3.select("#codeForm").selectAll("select").each(function() {
      d3.select(this).selectAll("option").remove();
      d3.select(this).selectAll("option")
        .data(tmpFields)
        .enter()
          .append("option")
          .attr("value", function(d) { return d; })
          .property("title", function(d) { return d; })
          .text(function(d) { return d; });

          
    });
  }


  ImportRead.onerror = (event) => {
    alert(event.target.error.name);
  };



  //***Add file upload function (csv file)
  const ImportReadXL = new FileReader();
  workbook = {};

  //***Read import file
  ImportReadXL.onload = function(event) {
    var data = event.target.result;
    workbook = XLSX.read(data, {type: "binary"});

    if(workbook.SheetNames.length == 1) {
      fileImport = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]], {FS:"\t"});
      fileImport = fileImport.replace(/,/g, ";");
      fileImport = fileImport.replace(/\t/g, ","); 

      addFileHeaders(fileImport);
    }
    else {
      wsArray = ["..."];
      workbook.SheetNames.forEach(function(sheetName) {
        wsArray.push(sheetName);
      });
      
      d3.select("#sheetSel").selectAll("option").remove();

      d3.select("#sheetSel").selectAll("option")
        .data(wsArray)
        .enter()
          .append("option")
          .attr("value", function(d) { return d; })
          .text(function(d) { return d; });

      d3.select("#sheetSel").property("required", true);
      document.getElementById("sheetSel").setCustomValidity("A worksheet must be selected");
      d3.select("#sheetSelTR").style("display", "table-row");

      fileImportReset();
    }
  }

  function addFileHeaders(fileImport) {
    const allLines = fileImport.split(/\r?\n/);
    var tmpFields = allLines[0].split(",");
    tmpFields.splice(0,0,"Select field...");

    //***Add file headers to map select boxes
    d3.select("#codeForm").selectAll("select.filterAttrList.minwidth").each(function() {
      d3.select(this).selectAll("option").remove();
      d3.select(this).selectAll("option")
        .data(tmpFields)
        .enter()
          .append("option")
          .attr("value", function(d) { return d; })
          .property("title", function(d) { return d; })
          .text(function(d) { return d; });

    });

  }


  ImportReadXL.onerror = (event) => {
    alert(event.target.error.name);
  };



  //***Read in file and add field names to mapping selects
  d3.select("#codeFile")
    .on("change", function() {
      d3.select("#sheetSelTR").style("display", "none");
      if(this.files.length > 0) {
        if(document.getElementById("codeFile").files[0].name.toUpperCase().includes("CSV") == true) {
          ImportRead.readAsText(document.getElementById("codeFile").files[0]);
        }
        else if(document.getElementById("codeFile").files[0].name.toUpperCase().includes("XLSX") == true) {
          ImportReadXL.readAsBinaryString(document.getElementById("codeFile").files[0]);
        }
      }
      else {
        fileImportReset();
      }
    });


  d3.select("#codeFileUpload")
    .on("click", function() {
      if(d3.select("#codeFile").property("value") == "") {
        alert("Please select a file to upload");
      }
      else {
        ImportRead.readAsText(document.getElementById("codeFile").files[0]);
      }

    });







  //******Make div for edit confirmation
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "confirmDiv")
    .on("click", function() { getConfirmCSV(); });

  $('#confirmDiv').draggable({containment: "html", cancel: ".toggle-group,input,textarea,button,select,option"});

  d3.select("#confirmDiv")
    .append("h4")
    .text("Confirm Edits")
    .attr("class", "legTitle")
    .attr("id", "confirmTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Confirm Edits</b></u></p><p>Review proposed edits and uncheck any that you do not wish to make. Records are sorted by Feature ID (ascending order) and Date (descending order).</p>"</span>');
 
  d3.select("#confirmTitle")
    .html(d3.select("#confirmTitle").html() + '<div class="exitDiv"><span id="hideConfirm" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideConfirm")
    .on("click", function() { toolWindowToggle("confirm"); });

  d3.select("#confirmDiv")
    .append("div")
    .attr("id", "confirmEditsDiv")
    .html('<table id="confirmTable">'
      + '<thead>'
        + '<tr>'
          + '<th title="Unique identifier of catchment taken from NHDPlus v2, click ID to zoom to catchment on the map">Feature ID</th><th title="The EBTJV catchment code currently in the database">Current Code</th><th title="The EBTJV catchment code derived from the import file">New Code<span class="fa fa-info-circle" style="margin-left:5px;"  data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>EBTJV Catchment Codes</b></u></p><p>Click on the code to override its value<br><ul><li><u><b>-1</b></u>: Unknown</li><li><u><b>0</b></u>: No salmonids present</li><li><u><b>0.2</b></u>: Brown Trout</li><li><u><b>0.3</b></u>: Rainbow Trout</li><li><u><b>0.4</b></u>: Rainbow & Brown Trout</li><li><u><b>05</b></u>: Stocked Brook Trout</li><li><u><b>1.1</b></u>: Brook Trout</li><li><u><b>1.2</b></u>: Brook & Brown Trout</li><li><u><b>1.3</b></u>: Brook & Rainbow Trout</li><li><u><b>1.4</b></u>: Brook, Brown & Rainbow Trout</li></ul>*P added to end of code indicates predicted (>10 years since sampled)</p>"></span></th><th title="Sample date obtained from the import file">Date</th><th title="Click to add a comment or reason for the update">Note<span class="fa fa-info-circle" style="margin-left:5px;"  data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Standardized Reasons</b></u></p><p><ul><li>Conflicting data</li><li>Known barrier</li><li>Biologist knowledge</li><li>Outdated data</li><li>Other</li></ul></p>"></span></th><th title="Presence of an icon symbol indicates multiple records for the same catchment">Flag</th><th title="Click the icon symbol to toggle inclusion of that record\'s update">Make Edit</th>'
        + '</tr>'
      + '</thead>'
      + '<tbody id="confirmTbody"></tbody>'
      + '</table>'

      + '<div id="confirmSubmitDiv">'
        //+ '<button type="button" id="confirmAllBut" class="formBut btn btn-primary" title="Click to include all edits">Include All</span></button>'
        + '<button type="button" id="showFlagBut" class="formBut btn btn-primary confirmBut" title="Click to show edits that are flagged (e.g. multiple records for a catchment)">Show Flagged</span></button>'
        + '<button type="button" id="showDifBut" class="formBut btn btn-primary confirmBut" title="Click to show edits that change the current EBTJV code">Show Changes</span></button>'
        + '<button type="button" id="showAllBut" class="formBut btn btn-primary confirmBut active" title="Click to show all edits">Show All</span></button>'
        + '<a id="confirmDownloadA" href="#" download="ebtjv_update_edits.csv"><span id="confirmDownload" class="fa fa-download" title="Click to download currently displayed edits to a CSV file"></span></a>'
      + '</div>'
      + '<div>'
        + '<span id="confirmBack" class="fa fa-mail-reply-all" title="Click to return to previous window"></span>'
        + '<button type="button" id="makeEditsBut" class="formBut btn btn-primary" title="Click to proceed with included edits">Make Edits</button>'
      + '</div>'
      + '<div id="progBarDiv" class="progress">'
        + '<div id="progBar" class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">0%</div>'
      + '</div>'
    );

    //d3.select("#confirmAllBut").on("click", function() { d3.select("#confirmTable").selectAll(".confirmSpan").classed("fa-check-square", true).classed("fa-times-circle", false); });

    d3.select("#showFlagBut").on("click", function() { d3.selectAll(".confirmBut").classed("active", false); d3.select(this).classed("active", true); d3.select("#confirmTable").select("tbody").selectAll("tr").classed("filtered", function() { if(d3.select(this).attr("data-count") == "1") { return true; } else { return false; } }); getConfirmCSV(); });
    d3.select("#showDifBut").on("click", function() { d3.selectAll(".confirmBut").classed("active", false); d3.select(this).classed("active", true); d3.select("#confirmTable").select("tbody").selectAll("tr").classed("filtered", function() { if(d3.select(this).attr("data-same") == "true" || d3.select(this).select(".confirmSpan").classed("notAllowed") == true) { return true; } else { return false; } }); getConfirmCSV(); });
    d3.select("#showAllBut").on("click", function() { d3.selectAll(".confirmBut").classed("active", false); d3.select(this).classed("active", true); d3.select("#confirmTable").select("tbody").selectAll("tr").classed("filtered", false); getConfirmCSV(); });

    d3.select("#confirmBack").on("click", function() { toolWindowToggle("confirm"); toolWindowToggle("update"); });

    d3.select("#makeEditsBut").on("click", function() {
      d3.select("#map").style("cursor", "progress");

      var lineCnt = -1;
      d3.select("#confirmTable").select("tbody").selectAll("tr").each(function(tr, i) {
        if(d3.select("#confirmSpan_" + i).classed("fa-check-square") == true) {
          lineCnt += 1;
        }
      });

      if(lineCnt >= 0) {
        d3.select("#progBarDiv").style("display", "block");
        d3.select("#progBar")
          .attr("aria-valuenow", 0)
          .style("width", "0%")
          .text("0%");

        var curLine = -1;
        var dataArray = [];
        d3.select("#confirmTable").select("tbody").selectAll("tr").each(function(tr, i) {
          if(d3.select("#confirmSpan_" + i).classed("fa-check-square") == true) {
            var tmpData = JSON.parse(d3.select(this).attr("data-edit"));
            tmpData.totLines = lineCnt;
            curLine += 1;
            tmpData.curLine = curLine;
            tmpData.method = "file";
            //console.log(tmpData);
            dataArray.push(tmpData);
            //socket.emit("edit", tmpData);
          }
        });

        socket.emit("edit", dataArray);
      }
      else {
        alert("There are no records selected to be updated.");
      }
    });










  //******Make div for info
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "infoDiv");

  $('#infoDiv').draggable({containment: "html", cancel: ".toggle-group,input,textarea,button,select,option"});

  d3.select("#infoDiv")
    .append("h4")
    .text("Identify")
    .attr("class", "legTitle")
    .attr("id", "infoTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Identify</b></u></p><p>Displays attribute value for visible overlay layers for a clicked point on the map</p>"</span>');
 
  d3.select("#infoTitle")
    .html(d3.select("#infoTitle").html() + '<div class="exitDiv"><span id="hideInfo" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideInfo")
    .on("click", function() { toolWindowToggle("info"); });

  d3.select("#infoDiv")
    .append("div")
    .attr("id", "info");




  //******Make div for download
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "downloadDiv");

  $('#downloadDiv').draggable({containment: "html", cancel: ".toggle-group,input,textarea,button,select,option"});

  d3.select("#downloadDiv")
    .append("h4")
    .text("Download")
    .attr("class", "legTitle")
    .attr("id", "downloadTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Download</b></u></p><p>Download data for the current set of filtered locations as either a CSV or geoJSON (spatial files only) file.<br><br>NOTE: Queries for large numbers of sample locations and/or for raw data may take an extended time, but will appear in the bottom of this window for download once complete.</p>"</span>');
 
  d3.select("#downloadTitle")
    .html(d3.select("#downloadTitle").html() + '<div class="exitDiv"><span id="hideDownload" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideDownload")
    .on("click", function() { toolWindowToggle("download"); });

  d3.select("#downloadDiv")
    .append("div")
    .attr("id", "download")
    .append("div")
    .html('<h6 class="filterHeader">File Format</h6><select id="downloadSelect" class="cl_select"><option>CSV</option><option>geoJSON</option></select><hr><h6 class="filterHeader">Output Tables</h6><div id="downloadChkDiv"><input type="checkbox" id="chkIndicators" class="downloadChk" checked>Indicator Data</input><br><input type="checkbox" id="chkSpecies" class="downloadChk">Species Data</input><br><input type="checkbox" id="chkRaw" class="downloadChk">Raw Data</input></div><hr>');

  d3.select("#download")
    .append("div")
    .attr("id", "downloadButton")
    .attr("class", "ldcButton")
    .text("Proceed")
    .property("title", "Click to initiate queries for selected data")
    .on("click", function() { downloadData(); });

  d3.select("#download")
    .append("div")
    .attr("id", "downloadLinks")
    .html('<img id="downloadGif" class="disabled" src="images/processing.gif"></img>');






  //******Add description to info tooltip
  d3.select("#info")
    .append("p")
    .attr("id", "infoP");







  //******Make div for legend
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "legendDiv");

  $('#legendDiv').draggable({containment: "html", cancel: ".toggle-group,.layerLegend,textarea,button,select,option"});

  d3.select("#legendDiv")
    .append("h4")
    .text("Legend")
    .attr("class", "legTitle")
    .attr("id", "legendTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Legend</b></u></p><p>Displays legends for added map layers enabling their interpretation along with control over their transparency.<br><br>Drag and drop layers to change their order on the map.</p>"</span>');
 
  d3.select("#legendTitle")
    .html(d3.select("#legendTitle").html() + '<div class="exitDiv"><span id="hideLegend" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideLegend")
    .on("click", function() { toolWindowToggle("legend"); });

  d3.select("#legendDiv")
    .append("div")
    .attr("id", "legendDefault")
    .text("Add a map layer to view its legend...");

  d3.select("#legendDiv")
    .append("div")
    .attr("id", "legendImgDiv");

    $("#legendImgDiv").sortable({appendTo: "#legendImgDiv", containment: "#legendImgDiv", cancel: "input,textarea,button,select,option", forcePlaceholderSize: true, placeholder: "sortable-placeholder", helper: "original", tolerance: "pointer", stop: function(event, ui) { reorder(event, ui); }, start: function(event, ui) { helperPlaceholder(event, ui); }});


  //******Change the layer orders after drag and drop
  function reorder(tmpEvent, tmpUI) {
     var tmpCnt = tmpEvent.target.children.length;
     var i = 0
     for (let child of tmpEvent.target.children) {
       overlays[infoObj[child.id.slice(0,-6)]].setZIndex(tmpCnt - i);
       i += 1;
     }
  }

  //******Style the helper and placeholder when dragging/sorting
  function helperPlaceholder(tmpEvent, tmpUI) {
    //console.log(tmpUI); 
    d3.select(".ui-sortable-placeholder.sortable-placeholder").style("width", d3.select("#" + tmpUI.item[0].id).style("width")).style("height", "37px");  //.style("background", "rgba(255,255,255,0.25)"); 
  }


  //******Adds images to the legend
  function addLegendImg(tmpName, tmpTitle, tmpLayer, tmpPath) {
    //console.log(tmpName);
    if(tmpName.includes("surf") || tmpName.includes("mlra")) {
      var tmpOpa = 0.6;
    }
    else {
      var tmpOpa = 1;
    }
    tmpLayer.setOpacity(tmpOpa);

    d3.select("#legendImgDiv")
      .insert("div", ":first-child")
      .attr("id", tmpName + "Legend")
      .attr("value", tmpPath)
      .attr("class", "layerLegend")
      .append("div")
      .attr("id", tmpName + "LegendHeader")
      .attr("data-toggle", "collapse")
      .attr("data-target", "#" + tmpName + "collapseDiv")
      .on("click", function() { changeCaret(d3.select(this).select("span")._groups[0][0]); })
      .append("div")
      .attr("class", "legendTitle")
      .html('<h6>' + tmpTitle + '</h6><div class="exitDiv"><span class="fa fa-caret-down legendCollapse" title="View legend"></span></div>');


    function changeCaret(tmpSpan) {
      if(d3.select(tmpSpan).classed("fa-caret-down")) {
        d3.select(tmpSpan).classed("fa-caret-down", false).classed("fa-caret-up", true).property("title", "Hide legend");
      }
      else {
        d3.select(tmpSpan).classed("fa-caret-up", false).classed("fa-caret-down", true).property("title", "View legend");
      }
    }

    d3.select("#" + tmpName + "Legend")
      .append("div")
      .attr("id", tmpName + "collapseDiv")
      .attr("class", "collapseDiv collapse")
      .append("div")
      .attr("id", tmpName + "LegImgDiv")
      .attr("class","legImgDiv")
      .append("img")
      .attr("id", tmpName + "LegendImg")
      .attr("class", "legendImg")
      .property("title", tmpTitle);

    $("#" + tmpName + "collapseDiv").on("shown.bs.collapse", function() { resizePanels(); });
    $("#" + tmpName + "collapseDiv").on("hidden.bs.collapse", function() { resizePanels(); });


    //***Set div width and offset after the image has been loaded
    $("#" + tmpName + "LegendImg").one("load", function() {
      var tmpRect = document.getElementById(tmpName + "LegendImg").getBoundingClientRect();
      d3.select("#" + tmpName + "LegImgDiv").style({"max-height":tmpRect.height - 67 + "px", "max-width": tmpRect.width + "px"});
      d3.select("#" + tmpName + "Legend").style("opacity", "1");     
    }).attr("src", "https://ecosheds.org/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&SCALE=50000&WIDTH=30&HEIGHT=30&LAYER=ebtjv_updater:" + tmpName);

    d3.select("#" + tmpName + "collapseDiv")
      .append("div")
      .attr("id", tmpName + "LegendSlider")
      .property("title", tmpTitle + " Layer Opacity: " + tmpOpa * 100 + "%");

    $("#" + tmpName + "LegendSlider").slider({animate: "fast", min: 0, max: 100, value: tmpOpa * 100, slide: function(event, ui) { layerOpacity(ui, tmpLayer, tmpName + "LegendSlider", tmpTitle); } });

    d3.select("#legendDefault").style("display", "none");

    d3.select("#legendImgDiv")
      .style("display", "block");

    if(d3.select("#legendDiv").style("opacity") == 0 && tmpLoad == false) {
      toolWindowToggle("legend");
    }

    resizePanels();
  }


  //******Removes images to the legend
  function remLegendImg(tmpName) {
    d3.select("#" + tmpName + "Legend").remove();

    if(d3.select("#legendImgDiv").selectAll("div")._groups[0].length == 0) {
      d3.select("#legendImgDiv").style("display", "none");
      d3.select("#legendDefault").style("display", "block");
    }
  }


  //******Change transparency of current legend layer
  function layerOpacity(tmpSlider, tmpLayer, tmpEl, tmpTitle) {
    var tmpOpacity = tmpSlider.value/100; 
    d3.select("#" + tmpEl).property("title", tmpTitle + " Layer Opacity: " + tmpSlider.value + "%"); 
    tmpLayer.setOpacity(tmpOpacity);
  } 




  //******Set z-indexes of moveable divs so that clicked one is always on top
  d3.selectAll("#legendDiv,#infoDiv,#locateDiv,#updateDiv,#downloadDiv,#catchDiv,#confirmDiv")
    .on("mousedown", function() { setZ(this); });






  //******Make div for recent edit results
  d3.select("body")
    .append("div")
    .attr("class", "legend gradDown")
    .attr("id", "recentsDiv");

  $('#recentsDiv').draggable({containment: "html", cancel: ".toggle-group,input,textarea,button,select,option"});

  d3.select("#recentsDiv")
    .append("h4")
    .text("Recent Edits")
    .attr("class", "legTitle")
    .attr("id", "recentsTitle")
    .append("span")
    .html('<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p><u><b>Recent Edits</b></u></p><p>Displays data for catchment update occurrences</p>"</span>');
 
  d3.select("#recentsTitle")
    .html(d3.select("#recentsTitle").html() + '<div class="exitDiv"><span id="hideRecents" class="fa fa-times-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<p>Click to hide window</p>"</span></div>'); 

  d3.select("#hideRecents")
    .on("click", function() { toolWindowToggle("recents"); });

  d3.select("#recentsDiv")
    .append("div")
    .attr("id", "recents")
    .html('<div style="padding:5px;">'
      + '<label>Edit Type:</label>'
      + '<select id="recEditSel" class="filterAttrList">'
        + '<option>...</option>'
        + '<option value="state_year">Most recent state sample year</option>'
        //+ '<option value="state_person">Recent catchment edits</option>'
      + '</select>'
      + '</div>'
      + '<div><table id="recEditTableYear">'
        + '<thead><tr><th>State</th><th>Year</th></tr></thead>'
        + '<tbody id="recEditTableYearBody"></tbody>'
      + '</table></div>'
    );


  d3.select("#recEditSel")
    .on("change", function() { 
      if(d3.select(this).property("selectedIndex") == 0) {
        d3.select("#recents").selectAll("table").style("display", "none");
      }
      else if(d3.select(this).property("selectedIndex") == 1) {
        socket.emit("get_latest_update");
      }
      else if(d3.select(this).property("selectedIndex") == 2) {
        //socket.emit("get_latest_update");
      }

    });





      //*******Make Help/information div
      d3.select("body")
        .append("div")
        .attr("class", "modal fade ui-draggable in")
        .attr("id", "helpDiv")
        .style("display", "none")
        .append("div")
        .attr("class", "modal-dialog modal-lg")
        .attr("id", "aboutDiv")
        .append("div")
        .attr("class", "aboutLegendTitle")
        .text("EBTJV Catchment Updater")
        .property("title", "EBTJV Catchment Updater informational details")
        .append("span")
        .attr("class", "fa fa-times-circle pull-right minimize-button")
        .attr("data-toggle", "modal")
        .attr("data-target", "#helpDiv")
        .property("title", "Click to close");   
        
      d3.select("#aboutDiv")
        .append("div")
        .attr("id", "helpMenu")
        .html('<ul class="nav nav-pills nav-stacked"><li class="nav-item" id="overview" title="Tool Overview" onclick="changePill(this)"><a class="nav-link active" href="#">Tool<br>Overview</a></li><li class="nav-item" id="usage" title="Performance and Design" onclick="changePill(this)"><a class="nav-link" href="#">Performance and Design</a></li><li class="nav-item" id="sources" title="Data Sources" onclick="changePill(this)"><a class="nav-link" href="#">Data<br>Sources</a></li></ul>');

      d3.select("#aboutDiv")
        .append("div")
        .attr("id", "helpContent")
        .append("div")
        .attr("class", "helpDivs")
        .attr("id", "help-overview")
        .style("display", "inline-block") 
        .html('<h3>Background</h3>'
           + '<p>The EBTJV Catchment Updater is a data visualization and decision support tool that was developed to assist with updating of EBTJV catchment codes representing salmonid species presence.<br>This tool was designed to assist federal and state agencies, local decision-makers, regional planners, conservation organizations, and natural resource managers using open-source software.</p>'
           //+ '<p>Data for this tool comes from a variety of sources and was developed in partnership with other efforts, including <a href="http://www.umasscaps.org/" target="_blank">CAPS (Conservation Assessment and Prioritization System)</a> and the <a href="https://streamcontinuity.org/" target="_blank">North Atlantic Aquatic Connectivity Collaborative (NAACC)</a>. Thank you to all who provided data, expertise, and feedback for this tool.</p>'
           + '<br>'
           + '<h3>Rule Set</h3>'
           + '<p>The Updater is a continuation of the 2015 EBTJV catchment classification effort in that it uses the most recent classification data and fields produced by that algorithm.</p>' 
           + '<p>2015 Assessment catchment classification algorithm</p>'
           + '<div class="aboutImgDiv"><img src="images/catchment_algorithm_flowchart.jpg" style="width:calc(100% - 125px);"></img></div>'
           + '<p>2015 Assessment catchment classification data fields</p>'
           + '<div class="aboutImgDiv"><img src="images/catchment_data_fields.jpg" style="width:calc(100% - 125px);"></img></div>'
           + '<p>Catchment classification consisted of determining which salmonid species were present, and how long ago the sample was conducted. All samples occurring greater than 10 years from the analysis year were given a \'P\' after the code representing \'predicted\'. Catchments upstream of a sample point were inferred from the downstream catchment, and given the classification code of that catchment, until a barrier, different sample, or stream end was encountered. The below table details the different classification codes (BKT = brook trout, BNT = brown trout, RBT = rainbow trout):</p>'
           + '<div class="aboutImgDiv"><img src="images/ebtjv_codes.jpg" style="width:500px"></img></div>'
           + '<p>Certain accomodations ended up being necessary due to the sometimes absence of smaller streams in the flowline layer, and the occurrence of multiple stream reaches in a single catchment.</p>'
           + '<p>Examples of likely scenarios in which users may need to manually edit a catchment\'s classification are listed below, along with a supplied reason that should be used as justification in order to standardize data across the range.</p>'
           + '<ul>'
             + '<li>If a catchment includes a portion of the mainstem and tributary and two data points occur in the same catchment in the same year with conflicting results (e.g., Brown Trout in mainstem and Brook Trout in tributary), manually update to the catchment code that best describes the trout community and select "<b>Conflicting data</b>". In some cases, this may result in a sympatric patch code.</li>'
             + '<li>If a biologist knows that a barrier is present which changes trout community upstream of the barrier but it is not reflected in the data, manually update catchment code to reflect their knowledge of the stream and in comments for manual edit, select "<b>Known barrier</b>".</li>'
             + '<li>The most recent survey results (e.g., allopatric Brook Trout) conflicts with knowledge from prior surveys (e.g., sympatric Brook Trout and Rainbow Trout) and biologist knows Rainbow Trout are still in the stream but the sampling did not pick them up this year because they occur in low density, manually update to the code that best describes the trout community and select "<b>Biologist knowledge</b>".</li>'
             + '<li>If data is outdated and includes an inaccurate entry for a trout species present, (e.g., only data available was from 1981 and includes a hatchery rainbow trout that was recorded as a wild Rainbow Trout and is changing the catchment to sympatric Brook Trout and Rainbow Trout, manually update to the code that best describes the trout community and select "<b>Outdated data</b>".</li>'
             + '<li>If a situation occurs in which a manual edit is needed and does not fall within the categories outlined above, manually update to the code that best describes the trout community and select "<b>Other</b>" and provide brief rationale for why update was made.</li>'
           + '</ul>'

           + '<h3>Quick Start</h3>'
           + '<p>Throughout the Updater tool, additional information about a tool or an item can be found by hovering over the <span class="fa fa-info-circle" title="A tooltip displaying additional details appears upon hovering over most elements."></span> icon or the object itself to display a tooltip.</p>'
           + '<p>Given the high number of classification scenarios possible from complex spatial and temporal datasets involved with this project, we recommend the following steps as a means to better control and track the update process:</p>'
           + '<ol>'
             + '<li>Only use sample data that has been collected since the last catchment update</li>'
             + '<li>Parse the sample data into hydrologic units (e.g. HUC8 or HUC10) to avoid overwriting previous edits</li>'
             + '<li>Import data using the file import method first, followed by manual edits to prevent overwriting updates.</li>'
             + '<li>For file imports, download the \'Confirm Edits\' table as a CSV file to keep as a record of the updates.</li>'
           + '</ol>'  

           + '<h3>Data Format</h3>'
           + '<p>When using the \'Import File\' method to make updates, the data can be saved as either an Excel or CSV file. Excel files with multiple worksheets will require the user to select the appropriate one. <span style="color:red;"><b>IMPORTANT</b>: CSV files cannot have internal commas in any field.</span></p>'
           + '<p>Data should be formatted in rows, where a row represents a sampling event, and must contain information on:</p>'
           + '<ul>'
             + '<li><b>Sample location</b></li>'
             + '<ul>'
               + '<li>Coordinates (decimal degrees), or</li>'
               + '<li>Catchment feature ID</li>'
             + '</ul>'
             + '<li><b>Salmonid species present</b></li>'
             + '<ul>'
               + '<li>EBTJV code, or</li>'
               + '<li>Species occurrence data - A column for each species (BKT, BNT, RBT, stocked BKT (optional))</li>'
                 + '<ul>'
                   + '<li>Species occurrence data can be represented by an integer >= 1, or by the word \'true\'</li>'
                 + '</ul>'
             + '</ul>'
             + '<li><b>Sample date</b></li>'
               + '<ul>'
                 + '<li>MM/DD/YYYY format</li>'
               + '</ul>'
           + '</ul>'

           + '<p><u>Example data file formats</u>'
           + '<ul>'
             + '<li><a href="files/update_species_coordinates_tf.xlsx">Species occurrence (True/False) & Coordinates Excel file</a></li>'
             + '<li><a href="files/update_species_featureid.csv">Species occurrence (counts) & Feature IDs CSV file</a></li>'
             + '<li><a href="files/update_codes_coordinates_multiple.xlsx">EBTJV codes & Coordinates Excel file (multiple worksheets)</a></li>'
             + '<li><a href="files/update_codes_featureid.csv">EBTJV codes & Feature IDs CSV file</a></li>'
           + '</ul>'
    
           + '<h3>Additional Info</h3>'
           + '<p><b>Extend Upstream</b>: This is an option in both the manual edit and import file update options that uses information from the 2015 catchment classification, specifically the \'Catchment Count\' and \'Sample OID\' fields, to update any upstream catchments (catchment counts greater than focal catchment) classified by the same sample data (sample OID).</p>'
           + '<p>This option is only available to states classified using the 2015 algorithm (northern states), and should be used with caution as data overwriting is possible.</p>'


           + '<br>'
           + '<h3>Tool Development Team</h3>'
           + '<ul>'
             + '<li><p>Jason Coombs</p></li>'
             + '<li><p>Keith Nislow</p></li>'
           + '</ul>'
           + '<p>Questions or comments should be directed to Jason Coombs at <a href="mailto:jcoombs@umass.edu">jcoombs@umass.edu</a>.</p>'
         );

      d3.select("#helpContent")
        .append("div")
        .attr("class", "helpDivs")
        .attr("id", "help-usage")
        .html('<h3>Overview</h3>'
           + '<p> The EBTJV Catchment Updater presents coldwater resource managers with a means to update the species occurrence classification code through an intuitive browser-based mapping interface.</p>'
           + '<br>'
           + '<h3>Optimal Performance Requirements</h3>'
           + '<p>The tool is currently supported on the latest versions of all major web browsers, however, <a target="_blank" href="https://www.google.com/chrome/">Google Chrome</a> is highly recommended for the best user experience. The tool is not intended for use on mobile devices, and is a memory-intensive application. Older computers may have difficulty rendering the interface resulting in sluggish performance. If you run into issues, we recommend closing all other programs and browser tabs to increase available memory.</p>'
           + '<br>'
           + '<h3>Design and Implementation</h3>'
           //+ '<p>In order to achieve feature filtering in a highly responsive way, SCE was developed as a client-side web application, which means all computations are performed within the user&apos;s web browser (as opposed to remotely on the web server). The application is comprised of two primary components:</p>'
           //+ '<ul>'
           //  + '<li><p><b>Analytics Engine:</b> The <a href="http://square.github.io/crossfilter/" target="_blank">crossfilter.js</a> library provides an extremely fast computational engine that can filter and aggregate large multi-variate datasets in near-real time and all within the user&apos;s web browser.</p></li>'
           //  + '<li><p><b>Visualization Platform:</b> The <a href="https://d3js.org/" target="_blank">d3.js</a> library is a powerful toolkit for developing interactive visualizations such as charts and maps that can respond to user inputs such as clicking and dragging, and update with great speed and efficiency.</p></li>'
           //+ '</ul>'
           //+ '<h3>Software Libraries</h3>'
           + '<p>The following open-source software libraries were used to create the EBTJV Catchment Updater:</p>'
           + '<ul>'
             + '<li><p><b><a href="https://www.postgresql.org/" target="_blank">PostgreSQL</a>:</b> Relational database</p></li>'
             + '<li><p><b><a href="https://postgis.net/" target="_blank">PostGIS</a>:</b> Spatial database extension for PostgreSQL</p></li>'
             + '<li><p><b><a href="https://nodejs.org/en/" target="_blank">Node.js</a>:</b> Web server runtime environment</p></li>'
             + '<li><p><b><a href="https://expressjs.com/" target="_blank">Express</a>:</b> Web server framework and API</p></li>'
             + '<li><p><b><a href="http://leafletjs.com/" target="_blank">Leaflet</a>:</b> Interactive map framework</p></li>'
             //+ '<li><p><b><a href="https://github.com/topojson/topojson" target="_blank">Topojson.js</a>:</b> Geospatial data format</p></li>'
             + '<li><p><b><a href="https://d3js.org/" target="_blank">D3.js</a>:</b> Data visualization, mapping and interaction</p></li>'
             + '<li><p><b><a href="http://getbootstrap.com/" target="_blank">Bootstrap</a>:</b> Front-end framework and styling</p></li>'
             + '<li><p><b><a href="https://jquery.com/" target="_blank">jQuery.js</a>:</b> JavaScript library</p></li>'
             + '<li><p><b><a href="https://introjs.com/" target="_blank">Intro.js</a>:</b> Guide and feature introduction</p></li>'
             //+ '<li><p><b><a href="https://github.com/d3/d3-queue" target="_blank">Queue.js</a>:</b> Asynchronous dataset and file retrieval</p></li>'
             //+ '<li><p><b><a href="http://colorbrewer2.org/" target="_blank">ColorBrewer</a>:</b> Pre-defined color palettes</p></li>'
           + '</ul>'
           + '<br>'
           + '<h3>Future Work and Contact Info</h3>'
           + '<p>Development of this tool is currently ongoing. If you have any questions or encounter any errors, please contact Jason Coombs at <a href="mailto:jason_coombs@fws.gov">jason_coombs@fws.gov</a>.</p>'
           + '<br>'
           + '<h3>Tool Version</h3>'
           + '<p>v1.0.0 - 04-20-2022</p>'
           + '<ul><li><p>Initial release</p></li></ul>'
         );

/*
      d3.select("#helpContent")
        .append("div")
        .attr("class", "helpDivs")
        .attr("id", "help-videos")
        .html('' //<p style="background:red;color:white;"><u>NOTICE:</u> Videos were recorded on the previous version of the app and will be updated soon.</p>'
           + '<h3>Tool Overview</h3>'
           + '<div class="videoDiv">'
             + '<video id="video1" class="htmlVideo" controls preload="auto" poster="images/sce_overview.jpg">'
               + '<source src="video/sce_overview.mp4" type="video/mp4">'
               + 'Your browser does not support HTML5 video.'
             + '</video>'
           + '</div>'

           + '<h3>Filters & Spatial Joins</h3>'
           + '<div class="videoDiv">'
             + '<video id="video2" class="htmlVideo" controls preload="auto" poster="images/sce_filtering.jpg">'
               + '<source src="video/sce_filtering.mp4" type="video/mp4">'
               + 'Your browser does not support HTML5 video.'
             + '</video>'
           + '</div>'

           + '<h3>Case Study Example</h3>'
           + '<div class="videoDiv">'
             + '<video id="video3" class="htmlVideo" controls preload="auto" poster="images/sce_scenario.jpg">'
               + '<source src="video/sce_scenario.mp4" type="video/mp4">'
               + 'Your browser does not support HTML5 video.'
             + '</video>'
           + '</div>'
         );       
*/

      d3.select("#helpContent")
        .append("div")
        .attr("class", "helpDivs")
        .attr("id", "help-sources")
        .html('<h3>Datasets</h3>'
          + '<p>A list of sources for polygon layers.</p><br>'
/*
          + '<h4>Raster Layers</h4>'
          + '<table>'
            + '<tr><th>Name</th><th>Source</th><th>Download</th></tr>'
            + '<tr><td>Land Cover (2016)</td><td><a href="https://www.mrlc.gov/data?f%5B0%5D=category%3ALand%20Cover" target="_blank">Multi-Resolution Land Characteristics Consortium</a></td><td><a href="layers/land_cover_2016.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Impervious Surface (2016)</td><td><a href="https://www.mrlc.gov/data?f%5B0%5D=category%3AUrban%20Imperviousness" target="_blank">Multi-Resolution Land Characteristics Consortium</a></td><td><a href="layers/impervious_2016.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Impervious Descriptor (2016)</td><td><a href="https://www.mrlc.gov/data?f%5B0%5D=category%3AUrban%20Imperviousness" target="_blank">Multi-Resolution Land Characteristics Consortium</a></td><td><a href="layers/impervious_descr_2016.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Tree Canopy (2016)</td><td><a href="https://www.mrlc.gov/data?f%5B0%5D=category%3ATree%20Canopy" target="_blank">Multi-Resolution Land Characteristics Consortium</a></td><td><a href="layers/tree_canopy_2016.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Elevation</td><td><a href="https://datagateway.nrcs.usda.gov/GDGOrder.aspx" target="_blank">USDA Geospatial Data Gateway</a></td><td><a href="layers/elevation_30m.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Solar Gain</td><td><a href="mailto:jcoombs@umass.edu" target="_blank">Jason Coombs</a>, University of Massachusetts Amherst</td><td><a href="layers/solar_rad_30m_180.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Consecutive Years Pest Damage</td><td><a href="mailto:jcoombs@umass.edu" target="_blank">Jason Coombs</a>, University of Massachusetts Amherst</td><td><a href="layers/consec_years_pest_damage.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
          + '</table>'
          + '<br>'
*/
          + '<h4>Polygon Layers</h4>'
          + '<table>'
            + '<tr><th>Name</th><th>Source</th><th>Download</th></tr>'
            + '<tr><td>States</td><td><a href="https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html" target="_blank">United States Census Bureau</a></td><td><a href="layers/ebtjv_states.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Counties</td><td><a href="https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html" target="_blank">United States Census Bureau</a></td><td><a href="layers/ebtjv_counties.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>HUC-6</td><td><a href="https://datagateway.nrcs.usda.gov/GDGOrder.aspx" target="_blank">USDA Geospatial Data Gateway</a></td><td><a href="layers/ebtjv_huc_6.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>HUC-8</td><td><a href="https://datagateway.nrcs.usda.gov/GDGOrder.aspx" target="_blank">USDA Geospatial Data Gateway</a></td><td><a href="layers/ebtjv_huc_8.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>HUC-10</td><td><a href="https://datagateway.nrcs.usda.gov/GDGOrder.aspx" target="_blank">USDA Geospatial Data Gateway</a></td><td><a href="layers/ebtjv_huc_10.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>HUC-12</td><td><a href="https://datagateway.nrcs.usda.gov/GDGOrder.aspx" target="_blank">USDA Geospatial Data Gateway</a></td><td><a href="layers/ebtjv_huc_12.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
            + '<tr><td>Streams</td><td><a href="https://www.epa.gov/waterdata/get-nhdplus-national-hydrography-dataset-plus-data" target="_blank">NHDPlus v2 Streams</a></td><td><a href="layers/ebtjv_nhdplusv2_streams.zip" target="_blank" title="Click to download"><span class="fa fa-download"></span></a></td></tr>'
          + '</table>'
        );
/*
      d3.select("#helpContent")
        .append("div")
        .attr("class", "helpDivs")
        .attr("id", "help-appendix")
        .html('<h3>Appendix</h3>'
          + '<p>The following tables contain the shortened attribute name used as field headings in shapefile downloads, along with the attribute\'s definition.</p><br>'
          + '<h4>Crossings Layer</h4>'
          + '<table id="app_crossings">'
            + '<tr><th>Attribute</th><th>Shapefile Name</th><th>Definition</th></tr>'
          + '</table>'
          + '<br>'
          + '<h4>Streams Layer</h4>'
          + '<table id="app_streams">'
            + '<tr><th>Attribute</th><th>Shapefile Name</th><th>Definition</th></tr>'
          + '</table>'
          + '<br>'
          + '<h4>Catchments Layer</h4>'
          + '<table id="app_catchments">'
            + '<tr><th>Attribute</th><th>Shapefile Name</th><th>Definition</th></tr>'
          + '</table>');
*/
       d3.select("#aboutDiv")
         .append("div")
         .attr("id", "helpFunding")
         .html('<div id="fundingLeftImg"><a href="https://easternbrooktrout.org/" target="_blank"><img id="ebtjv" src="images/ebtjv_logo_name.jpg" title="Eastern Brook Trout Joint Venture"></a></div><div id="fundingRightImg"><a href="https://www.nrs.fs.fed.us/" target="_blank"><img id="usfs" src="images/shield_color.png" title="US Forest Service"></a><a href="https://www.umass.edu/" target="_blank"><img id="UMass" src="images/umass_amherst.png" title="University of Massachusetts"></a></div><p id="funders">Principle funding for this tool was contributed by the <a class="fundA" href="https://easternbrooktrout.org/" title="https://glri.us/" target="_blank">Eastern Brook Trout Joint Venture</a><br><br>Additional support was provided by: <a class="fundA" href="https://www.nrs.fs.fed.us/" title="https://www.nrs.fs.fed.us/" target="_blank">US Forest Service: Northern Research Station</a> | <a class="fundA" href="https://www.umass.edu/" title="https://www.umass.edu/" target="_blank">University of Massachusetts, Amherst</a></p>');
         //.html('<div id="fundingLeftImg"><a href="https://www.fs.usda.gov/ottawa" target="_blank"><img id="usfs" src="images/shield_color.png" title="US Forest Service: Ottawa National Forest"></a></div><div id="fundingRightImg"><a href="https://www.umass.edu/" target="_blank"><img id="UMass" src="images/umass_amherst.png" title="University of Massachusetts"></a></div><p id="funders">This project was funded by the <a href="https://www.fs.usda.gov/ottawa" target="_blank">US Forest Service - Ottawa National Forest</a><br><br>Additional support was provided by the <a href="https://www.umass.edu/" target="_blank">University of Massachusetts, Amherst</a>.</p>');


/*
      function stopVideos() {
        d3.selectAll(".htmlVideo")[0].forEach(function(d) {
          d.pause();
        });
      }
*/
















  map.addEventListener("click", getInfo);

  function getInfo(e) {
    //console.log(e.latlng.lat.toFixed(3) + ", " + e.latlng.lng.toFixed(3));
    var i = -1;
    var tmpLayers = "";
    var visLayers = [];
    map.eachLayer(function(layer) { 
      i += 1;
      //***Exclude baselayer and points layer
      if(typeof layer.options.layers != "undefined" && layer.options.layers.includes("bbox_mi") == false) {
        if(tmpLayers == "") {
          tmpLayers = layer.options.layers;
        }
        else {
          tmpLayers = layer.options.layers + "," + tmpLayers;
        }
        var tmpName = layer.options.layers.split(":")[1];
        if(infoDataType[tmpName] == "raster") {
          visLayers.splice(0,0,tmpName);
        }
      }
    });

    var bbox = map.getBounds(); //.toBBoxString();
    var tmpStr = bbox._southWest.lat + "," + bbox._southWest.lng + "," + bbox._northEast.lat + "," + bbox._northEast.lng;
    var tmpWidth = map.getSize().x;
    var tmpHeight = map.getSize().y;
    var tmpI = Math.round(map.layerPointToContainerPoint(e.layerPoint).x);
    var tmpJ = Math.round(map.layerPointToContainerPoint(e.layerPoint).y);

    var tmpUrl = 'https://ecosheds.org/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=' + tmpLayers + '&QUERY_LAYERS=' + tmpLayers + '&BBOX=' + tmpStr + '&FEATURE_COUNT=' + (i * 5) + '&HEIGHT=' + tmpHeight + '&WIDTH=' + tmpWidth + '&INFO_FORMAT=application/json&CRS=EPSG:4326&i=' + tmpI + '&j=' + tmpJ;
    //console.log(tmpUrl);

    //var catchTitles = {"areasqkm": "Area (km^2)", "catch_cnt": "Catchment Count", "changed_from": "Changed From", "comment": "Comments", "cum_length": "Cumulative Length (km)", "dam": "Dam Present", "ebtjv_code": "EBTJV Code", "edit_date": "Date Edited", "editor": "Editor", "featureid": "Feature ID", "reason": "Reason", "samp_dist": "Sample Distance (m)", "samp_loc": "Sample Location", "samp_oid": "Sample OID", "samp_year": "Sample Year", "state": "State", "str_order": "Stream Order", "val_change": "Validation Change", "val_reason": "Validation Reason"};
    var catchInfo = {"featureid": "Feature ID", "ebtjv_code": "EBTJV Code", "samp_year": "Sample Year", "state": "State", "str_order": "Stream Order", "catch_cnt": "Catchment Count", "dam": "Dam Present", "samp_loc": "Sample Location", "samp_dist": "Sample Distance (m)", "areasqkm": "Area (km^2)", "cum_length": "Cumulative Length (km)", "samp_oid": "Sample OID", "comment": "Comments"};
    var catchEdit = { "prior_code": "Prior Code", "prior_year": "Prior Year", "reason": "Notes", "latest_sample": "Latest Sample", "editor": "Editor", "edit_date": "Date Edited", "prior_edits": "Prior Edits"}; 

    //send the request using jQuery $.ajax
    $.ajax({
      url: tmpUrl,
      dataType: "json",
      type: "GET",
      success: function(data) {
        //console.log(visLayers);
        var j = 0;
        var tmpText = "";
        data.features.forEach(function(tmpFeat) {
          var tmpID = tmpFeat.id.split(".")[0];
          if(tmpID != "") {
            addInfo(tmpID, tmpFeat.properties[infoIDField[tmpID]]);

            //***Add catchment info to div and display
            if(tmpID == "ebtjv_catchments_current") {
              d3.select("#catchInfoTable").select("tbody").selectAll("tr").remove();
              var tmpCatch = d3.keys(catchInfo);
              var tmpEdit = d3.keys(catchEdit);
              var tmpMap = tmpCatch.concat(tmpEdit);
              d3.select("#catchInfoTable").select("tbody").selectAll("tr")
                .data(tmpMap)
                .enter()
                  .append("tr")
                  .attr("class", function(d) { if(tmpEdit.indexOf(d) > -1) { return "editTR"; } })
                  .html(function(d) { 
                    if(tmpCatch.indexOf(d) > -1) {
                      return '<td>' + catchInfo[d] + '</td><td>' + tmpFeat.properties[d] + '</td>'; 
                    }
                    else {
                      if(d == "latest_sample" || d == "edit_date") {
                        if(tmpFeat.properties[d] == null) {
                          var tmpDate = "";
                        }
                        else {
                          var tmpDate = tmpFeat.properties[d].slice(5,7) + "/" + tmpFeat.properties[d].slice(8,10) + "/" + tmpFeat.properties[d].slice(0,4);
                        }
                        return '<td>' + catchEdit[d] + '</td><td>' + tmpDate + '</td>';
                      }
                      else {
                        if(tmpFeat.properties[d] == null) {
                          var tmpProp = "";
                        }
                        else {
                          var tmpProp = tmpFeat.properties[d];
                        }
                        return '<td>' + catchEdit[d] + '</td><td>' + tmpProp + '</td>';                      
                      }
                    }
                  });

              if(d3.select("#catchDiv").style("opacity") == 0) {
                toolWindowToggle("catch");
              }

              //***Add geoJSON
              if(editFeat != null) {
                map.removeLayer(editFeat);
              }
              editFeat = L.geoJSON(tmpFeat, { style: polyLayer });
              map.addLayer(editFeat);

              //***Add feature id to manual edit form if selected and visible
              if(d3.select("#updateDiv").style("opacity") == 1 && d3.select("#methodSel").property("value") == "Manual Edit") {
                d3.select("#manualFeat").property("value", tmpFeat.properties.featureid);
              }

              //***Class cofirm table TR as zoomed if they match the featureid
              d3.select("#confirmTbody").selectAll("tr").each(function() {
                d3.select(this).classed("zoomed", function() {
                  if(d3.select(this).select("td").text() == tmpFeat.properties.featureid) { return true; } else { return false; }
                });
              });
            }
          }
          else if(tmpID == "") {
            if(typeof tmpFeat.properties.PALETTE_INDEX !== "undefined") {
              var tmpObj = "PALETTE_INDEX";
            }
            else if(typeof tmpFeat.properties.GRAY_INDEX !== "undefined") {
              var tmpObj = "GRAY_INDEX";
            }
            else {
              var tmpObj = "NULL";
            }
            addInfo(visLayers[j], Math.round(tmpFeat.properties[tmpObj]));
            j += 1;
          }
          else {
            addInfo(tmpID, "");
          }
        });
        d3.select("#infoP").text(tmpText);
        if(d3.select("#infoDiv").style("opacity") == 0) { toolWindowToggle("info"); }
        resizePanels();

        function addInfo(tmpId, tmpInfo) {
          if(tmpText == "") {
            tmpText = infoObj[tmpId] + ": " + tmpInfo;
          }
          else {
            tmpText += "\n" + infoObj[tmpId] + ": " + tmpInfo;
          }
        }
      }
    });
  }

  $("#layerToggleDiv0").click();

  //if(localStorage.getItem('disableTut') != "true") {
  //  startIntro();
  //}


  //***Start with login displayed
  $("#loginIcon").click();
  tmpLoad = false;
}

function changePill(tmpID) {
  d3.select("#helpMenu").selectAll("a").classed("active", false);
  d3.select(tmpID).select("a").classed("active", true);
  d3.selectAll(".helpDivs").style("display", "none");
  d3.select("#help-" + tmpID.id).style("display", "inline-block");
  //if(d3.select("#help-videos").style("display") != "inline-block") {
    //stopVideos();
  //}
}



//*******Show crossings attribute in tooltip
function showIt(tmpID) {
  tooltip.text(tmpID);
  tooltip.style("visibility", "visible");
  tooltip.property("title", tmpID);
}
  


//******Make sure tooltip is in window bounds
function resizeTooltip() {
  var mapRect = document.getElementById("map").getBoundingClientRect();
  var tmpWindows = ["d3Tooltip"];
        
  tmpWindows.forEach(function(win) {
    var winRect = document.getElementById(win).getBoundingClientRect();
    if(winRect.bottom > mapRect.bottom) {
      d3.select("#" + win).style("top", mapRect.height - winRect.height + "px");
    }
    if(winRect.right > mapRect.right) {
      d3.select("#" + win).style("left", mapRect.width - winRect.width + "px");
    }
  });
}



//******Adjust div position to ensure that it isn't overflowing window
function resizePanels() {
  var bodyRect = document.body.getBoundingClientRect();
  var tmpWindows = ["infoDiv", "updateDiv", "locateDiv", "legendDiv", "downloadDiv", "catchDiv", "confirmDiv"];
        
  tmpWindows.forEach(function(win) {
    var winRect = document.getElementById(win).getBoundingClientRect();
    if(winRect.bottom > bodyRect.bottom) {
      d3.select("#" + win).style("top", bodyRect.height - winRect.height + "px");
    }
    if(winRect.right > bodyRect.right) {
      d3.select("#" + win).style("left", bodyRect.width - winRect.width + "px");
    }
  });
  d3.select("#legendImgDiv").style("min-width", "0px").style("width", "auto");
  var legRect = document.getElementById("legendImgDiv").getBoundingClientRect();
  d3.select("#legendImgDiv").style("min-width", legRect.width + "px");
}



//******Manually edit catchment
function manualEdit(tmpForm) {
  if(accessToken == "") { 
    alert("You must be logged in to make edits"); 
    return; 
  }

  var tmpFeat = tmpForm.manualFeat.value;
  var tmpCode = tmpForm.manualCode.value;
  var tmpDate = new Date(tmpForm.manualSampDate.value);
  var tmpYear = tmpDate.getFullYear();
  tmpDate = tmpForm.manualSampDate.value;
  if(tmpForm.manualReason.value == "old") {  //existing reason
    var tmpReason = tmpForm.manualReasonSel.value;
  }
  else {  //new reason
    var tmpReason = tmpForm.manualReasonText.value;
  }
  var tmpExtend = tmpForm.manualExtend.value;

  //***Confirm user has admin priveleges for state where catchment is located
  if(adStates != null) {
    if(adStates.indexOf("All") == -1) {
      socket.emit("check_admin", {"feat": tmpFeat, "code": tmpCode, "sampDate": tmpDate, "sampYear": tmpYear, "reason": tmpReason, "extend": tmpExtend, "user": curUser, "token": accessToken, "curLine": 0, "totLines": 0, "adStates": adStates, "method": "manual"});
    }
    else {
      socket.emit("edit", [{"feat": tmpFeat, "code": tmpCode, "sampDate": tmpDate, "sampYear": tmpYear, "reason": tmpReason, "extend": tmpExtend, "user": curUser, "token": accessToken, "curLine": 0, "totLines": 0, "adStates": adStates, "method": "manual"}]);
    }
  }
  else {
    alert("Your account does not have permission to edit catchments");
  }
/*
  d3.select("#progBar")
    .attr("aria-valuenow", 0)
    .style("width", "0%")
    .text("0%");
  d3.select("#progBarDiv").style("display", "none");
*/
}




//******Edit catchments using Excel or CSV file
function importEdit(tmpForm) {
  if(accessToken == "") { 
    alert("You must be logged in to make edits"); 
    return; 
  }

  if(adStates == null) {
    alert("Your account does not have permission to edit catchments");
    return; 
  }

  d3.select("#map").style("cursor", "progress");

  var tmpLocate = tmpForm.codeLocID.value;
  var tmpClassify = tmpForm.codeClassify.value;
  var tmpExtend = tmpForm.codeExtend.value;
  if(tmpLocate == "coordinates") {
    //console.log(tmpForm.codeLatSel.index);
    var tmpMapLat = tmpForm.codeLatSel.value;
    var tmpMapLong = tmpForm.codeLongSel.value;
  }
  else {
    var tmpFeat = tmpForm.codeFeatSel.value;
  }
  if(tmpClassify == "ebtjv_code") {
    var tmpCode = tmpForm.codeCodeSel.value;
  }
  else {
    var tmpBkt = tmpForm.codeBktSel.value;
    var tmpBnt = tmpForm.codeBntSel.value;
    var tmpRbt = tmpForm.codeRbtSel.value;
    var tmpBktStocked = tmpForm.codeBktStockedSel.value;
  }    
  var tmpDate = tmpForm.codeDateSel.value;
  var tmpReason = tmpForm.codeReasonSel.value;

  //***Convert raw species presence if necessary
  if(tmpClassify == "raw_data") {
    var tmpCode = "EBTJV Code";
    var allLines = fileImport.split(/\r?\n/);
    const tmpFields = allLines[0].split(",");
    //***Remove empty lines
    allLinesClean = allLines.filter(function(tmpLine) { return tmpLine != ""; });
    newFileImport = "";

    allLinesClean.forEach(function(tmpLine, i) {
      var lineArray = tmpLine.split(",");
      if(i == 0) {
        tmpFields.push("EBTJV Code");
        lineArray.push("EBTJV Code");
      }
      else {
        if(d3.select("#codeBktStockedUse").property("checked") == true) {
          [tmpBkt, tmpBnt, tmpRbt, tmpBktStocked].forEach(function(spp) {
            if(lineArray[tmpFields.indexOf(spp)].toUpperCase() == "TRUE") { 
              lineArray[tmpFields.indexOf(spp)] = 1; 
            }
            else if(lineArray[tmpFields.indexOf(spp)].toUpperCase() == "FALSE") { 
              lineArray[tmpFields.indexOf(spp)] = 0; 
            }
          });

          if(lineArray[tmpFields.indexOf(tmpBkt)] > 0 && lineArray[tmpFields.indexOf(tmpBnt)] > 0 && lineArray[tmpFields.indexOf(tmpRbt)] > 0 && lineArray[tmpFields.indexOf(tmpBktStocked)] < 1) {
            lineArray.push("1.4");
          }
          else if(lineArray[tmpFields.indexOf(tmpBkt)] > 0 && lineArray[tmpFields.indexOf(tmpRbt)] > 0 && lineArray[tmpFields.indexOf(tmpBktStocked)] < 1) {
            lineArray.push("1.3");
          }
          else if(lineArray[tmpFields.indexOf(tmpBkt)] > 0 && lineArray[tmpFields.indexOf(tmpBnt)] > 0 && lineArray[tmpFields.indexOf(tmpBktStocked)] < 1) {
            lineArray.push("1.2");
          }
          else if(lineArray[tmpFields.indexOf(tmpBkt)] > 0 && lineArray[tmpFields.indexOf(tmpBktStocked)] < 1) {
            lineArray.push("1.1");
          }
          else if(lineArray[tmpFields.indexOf(tmpBnt)] > 0 && lineArray[tmpFields.indexOf(tmpRbt)] > 0 && lineArray[tmpFields.indexOf(tmpBktStocked)] < 1) {
            lineArray.push("0.4");
          }
          else if(lineArray[tmpFields.indexOf(tmpRbt)] > 0 && lineArray[tmpFields.indexOf(tmpBktStocked)] < 1) {
            lineArray.push("0.3");
          }
          else if(lineArray[tmpFields.indexOf(tmpBnt)] > 0 && lineArray[tmpFields.indexOf(tmpBktStocked)] < 1) {
            lineArray.push("0.2");
          }
          else if(lineArray[tmpFields.indexOf(tmpBktStocked)] > 0) {
            lineArray.push("0.5");
          }
          else {
            lineArray.push("0");
          }
        }
        //***No stocked brook trout field provided
        else {
          [tmpBkt, tmpBnt, tmpRbt].forEach(function(spp) {
            if(lineArray[tmpFields.indexOf(spp)].toUpperCase() == "TRUE") { 
              lineArray[tmpFields.indexOf(spp)] = 1; 
            }
            else if(lineArray[tmpFields.indexOf(spp)].toUpperCase() == "FALSE") { 
              lineArray[tmpFields.indexOf(spp)] = 0; 
            }
          });

          if(lineArray[tmpFields.indexOf(tmpBkt)] > 0 && lineArray[tmpFields.indexOf(tmpBnt)] > 0 && lineArray[tmpFields.indexOf(tmpRbt)] > 0) {
            lineArray.push("1.4");
          }
          else if(lineArray[tmpFields.indexOf(tmpBkt)] > 0 && lineArray[tmpFields.indexOf(tmpRbt)] > 0) {
            lineArray.push("1.3");
          }
          else if(lineArray[tmpFields.indexOf(tmpBkt)] > 0 && lineArray[tmpFields.indexOf(tmpBnt)] > 0) {
            lineArray.push("1.2");
          }
          else if(lineArray[tmpFields.indexOf(tmpBkt)] > 0) {
            lineArray.push("1.1");
          }
          else if(lineArray[tmpFields.indexOf(tmpBnt)] > 0 && lineArray[tmpFields.indexOf(tmpRbt)] > 0) {
            lineArray.push("0.4");
          }
          else if(lineArray[tmpFields.indexOf(tmpRbt)] > 0) {
            lineArray.push("0.3");
          }
          else if(lineArray[tmpFields.indexOf(tmpBnt)] > 0) {
            lineArray.push("0.2");
          }
          else {
            lineArray.push("0");
          }
        }
      }
      newFileImport += lineArray.join(",") + "\n";
    });
    fileImport = newFileImport;
  }

  toolWindowToggle("update");

  if(tmpLocate == "coordinates") {
    var allLines = fileImport.split(/\r?\n/);
    const tmpFields = allLines[0].split(",");
    allLines.splice(0,1);
    //***Remove empty lines
    allLinesClean = allLines.filter(function(tmpLine) { return tmpLine != ""; });

    var tmpPoints = [];
    allLinesClean.forEach(function(tmpLine, i) {
      var lineArray = tmpLine.split(",");
      tmpPoints.push({"lat": lineArray[tmpFields.indexOf(tmpMapLat)], "long": lineArray[tmpFields.indexOf(tmpMapLong)]});
    });

    socket.emit("get_featureid", {"coords": tmpPoints, "user": curUser});
  }
  else {
    var tmpData = {"tmpLocate": tmpLocate, "tmpClassify": tmpClassify, "tmpExtend": tmpExtend, "tmpFeat": tmpFeat, "tmpCode": tmpCode, "tmpDate": tmpDate, "tmpReason": tmpReason};
    selEdits(tmpData);
  }


/*
  d3.select("#progBar")
    .attr("aria-valuenow", 0)
    .style("width", "0%")
    .text("0%");
  d3.select("#progBarDiv").style("display", "none");
*/
}



//******Select edits
function selEdits(tmpData) {
  var allLines = fileImport.split(/\r?\n/);
  const tmpFields = allLines[0].split(",");
  allLines.splice(0,1);
  //***Remove empty lines
  allLinesClean = allLines.filter(function(tmpLine) { return tmpLine != ""; });

  var lineCnt = allLinesClean.length - 1;
  var featArray = [];
  allLinesClean.forEach(function(tmpLine, i) {
    var lineArray = tmpLine.split(",");
    featArray.push(lineArray[tmpFields.indexOf(tmpData.tmpFeat)]);
  });

  socket.emit("get_codes", {"tmpData": tmpData, "tmpFeats": featArray});
}





//******Make the selected edits
function doEdits(tmpData) {
  var allLines = fileImport.split(/\r?\n/);
  const tmpFields = allLines[0].split(",");
  allLines.splice(0,1);
  //***Remove empty lines
  allLinesClean = allLines.filter(function(tmpLine) { return tmpLine != ""; });

  var lineCnt = allLinesClean.length - 1;
  allLinesClean.forEach(function(tmpLine, i) {
    var lineArray = tmpLine.split(",");
    var newDate = new Date(lineArray[tmpFields.indexOf(tmpData.tmpDate)]);
    var tmpYear = newDate.getFullYear();

    //console.log({"feat": lineArray[tmpFields.indexOf(tmpData.tmpFeat)], "code": lineArray[tmpFields.indexOf(tmpData.tmpCode)], "sampDate": lineArray[tmpFields.indexOf(tmpData.tmpDate)], "sampYear": tmpYear, "reason": lineArray[tmpFields.indexOf(tmpData.tmpReason)], "extend": tmpData.tmpExtend, "user": curUser, "token": accessToken, "curLine": i, "totLines": lineCnt, "adStates": adStates});
    socket.emit("edit", {"feat": lineArray[tmpFields.indexOf(tmpData.tmpFeat)], "code": lineArray[tmpFields.indexOf(tmpData.tmpCode)], "sampDate": lineArray[tmpFields.indexOf(tmpData.tmpDate)], "sampYear": tmpYear, "reason": lineArray[tmpFields.indexOf(tmpData.tmpReason)], "extend": tmpData.tmpExtend, "user": curUser, "token": accessToken, "curLine": i, "totLines": lineCnt, "adStates": adStates});
  });
}







//******Store whether the tutorial should be disabled on startup
function setTut(tmpChk) {
  localStorage.setItem('disableTut', tmpChk.checked);
}


//******Tutorial
function startIntro() {
  if(localStorage.getItem('disableTut') == "true") {
    var tmpCheck = " checked";
  }
  else {
    var tmpCheck = "";
  }

  var intro = introJs();
  intro.setOptions({
    steps: [
      //0
      { intro: '<b>Welcome to the <span style="font-family:nebulous;color:orangered;font-weight:bold;">EBTJV Catchment Updater</span></b><img src="images/ebtjv_icon.png" style="height:50px;display:block;margin:auto;"></img>This app enables brook trout resource managers to interactively modify and update Eastern Brook Trout Joint Venture catchment classification.<br><hr><div style="text-align:center;"><input type="checkbox" id="disTutChk" onchange="setTut(this)" style="position:relative;top:2.5px;" ' + tmpCheck + '></input><label style="font-size:12px;font-weight:bold;margin-left:5px;">Check to stop tutorial from running on page load</label></div>' },
      //1
      { element: document.querySelector("#launchIntro"), intro: "To access this guide at any time simply click on the 'Tutorial' link." },
      //2
      { element: document.querySelector("#baselayerSelect"), intro: "Use this dropdown menu  to change the basemap displayed on the map." },
      //3
      { element: document.querySelector("#overlaySelect"), intro: "Use this dropdown menu  to add raster and pologyon overlay layers. Here the HUC 8 polygon layer has been added." },
      //4
      { element: document.querySelector("#panelTools"), intro: 'These icons are used to show/hide tool windows and assist with manuevering around the map:<ul><li><span class="fa fa-th-list intro-fa"></span> Show/hide map legend window</li><li><span class="fa fa-info intro-fa"></span> Show/hide feature identification window</li><li><span class="fa fa-pencil-square intro-fa"></span> Show/hide Catchment Updater window</li><li><span class="fa fa-table intro-fa"></span> Show/hide Recent Edits window</li><li><span class="fa fa-search intro-fa"></span> Show/hide map location search window</li><li><span class="fa fa-globe intro-fa"></span> Zoom to full-extent of the map</li></ul>' },
      //5
      { intro: 'Thank you for touring the <span style="font-family:nebulous;color:orangered;font-weight:bold;">EBTJV Catchment Updater</span>!<img src="images/ebtjv_icon.png" style="height:50px;display:block;margin:auto;"></img>Questions or comments can be directed to <a href="mailto:jason_coombs@fws.gov?subject=EBTJV Catchment Updater" target="_blank">Jason Coombs</a>.' },
/*
      //5
      { element: document.querySelector("#legendDiv"), intro: "The legend window provides the user with:<ul><li>A legend key for each layer</li><li>A slider to change the opacity of the layer (here it is shown at 50%)</li><li>The ability to change the layer order on the map by dragging and dropping</li></ul>" },
      //6
      { element: document.querySelector("#infoDiv"), intro: "When the map is clicked, the identify window lists feature names and values for all displayed raster and polygon overlay layers." },
      //7
      { element: document.querySelector("#updateDiv"), intro: "The Catchment Updater window enables the user to:<ul><li>Select areas to conduct analyses</li><li>Specify criteria for locating potential planting sites</li></ul>Instructions for performing an analysis can be found by clicking the 'About' link at the top of the page." },
      //8
      { element: document.querySelector("#resultsDiv"), intro: 'The results window shows completed runs and enables the user to:<ul><li><span class="fa fa-info-circle intro-fa"></span> View the area selection and criteria used for the analysis</li><li><span class="fa fa-check-square intro-fa"></span> Turn the layer on/off</li><li><span class="fa fa-eye intro-fa"></span> Adjust the layer\'s opacity</li><li><span class="fa fa-search-plus intro-fa"></span> Zoom to the layer on the map</li><li><span class="fa fa-download intro-fa"></span> Download the layer</li><li><span class="fa fa-times-circle intro-fa"></span> Permanently remove the layer</li><ul>', position: "bottom" },
      //9
      { element: document.querySelector("#printControl"), intro: "The print icon enables the user to save an image of the screen to a PDF file." },
      //10
      { element: document.querySelector("#showDetails"), intro: "The 'About' link opens a window providing information about the tool, and details and download links for the raster and polygon layers used by the tool." },
*/
    ],
    tooltipPosition: 'auto',
    positionPrecedence: ['left', 'right', 'bottom', 'top'],
    showStepNumbers: false,
    hidePrev: true,
    hideNext: true,
    scrollToElement: true,
    disableInteraction: true,
  });



  intro.onchange(function() { 
    switch (this._currentStep) {
      case 0:
        revertIntro();
        break;
      case 1:
        revertIntro();
        d3.select("#launchIntro").style("color","navy");
        break;
      case 2:
        revertIntro();
        d3.select("#baselayerListDropdown").style("display", "inline-block");
        break;
      case 3:
        revertIntro();
        $("#layerToggleDiv4").click();
        d3.select("#overlayListDropdown").style("display", "inline-block");
        break;
      case 4:
        revertIntro();
        d3.select("#panelTools").selectAll("span").style("color", "navy");
        break;
/*
      case 5:
        revertIntro();
        $("#layerToggleDiv9").click();
        d3.select("#legendDiv").style("opacity", 1).style("display", "block");
        d3.selectAll(".legendTitle").each(function() { $(this).click(); });
        d3.select("#wbdhu8_miLegendSlider").select("span").style("left", "50%");
        huc8.setOpacity(0.5);
        break;        
      case 6:
        revertIntro();
        $("#layerToggleDiv9").click();
        d3.select("#infoP").text("HUC-8: Ontonagon");
        d3.select("#infoDiv").style("opacity", 1).style("display", "block");
        break;
      case 7:
        revertIntro();
        d3.select("#updateDiv").style("opacity", 1).style("display", "block");
        break;
      case 8:
        revertIntro();
        var tmpSecs = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds();
        var cs_id = "HUC-12-" + tmpSecs;
        d3.select("#rpccrDiv")
          .append("div")
          .attr("id", cs_id)
          .html('<p class="rpccrP">' + cs_id
            + '<span class="fa fa-info-circle" data-toggle="tooltip" data-container="body" data-placement="auto" data-html="true" title="<ul><li>Layer: HUC-12</li><li>Areas:<ul><li>Copper Creek</li></ul></li><li>Criteria:<ul><li>Tree Canopy <= 50</li></ul></li></ul>"></span>'
            + '<span id="chk_' + cs_id + '" value="0" class="fa fa-check-square" title="Click to hide layer"></span>'
            + '<span id="eye_' + cs_id + '" value="0" data-opa="100" class="fa fa-eye" title="Click to change layer opacity | Current: 100%"></span>'
            + '<span id="zoom_' + cs_id + '" class="fa fa-search-plus" title="Click to zoom to layer"></span>'
            + '<a class="rpccrA" href="zips/intro_example.zip" target="_blank">'
              + '<span id="zip_' + cs_id + '" class="fa fa-download" title="Click to download layer"></span>'
            + '</a>'
            + '<span id="remove_' + cs_id + '" value="0" data-div="' + cs_id + '" class="critRemove fa fa-times-circle" title="Click to permanently remove results layer"></span>'
          + '</p>');
        map.addLayer(huc12);
        map.addLayer(intro_example);
        map.fitBounds([[46.557404531,-89.961141089],[46.652063889,-89.857069204]]);
        d3.select("#updateDiv").style("opacity", 1).style("display", "block").classed("intro_vis", true);
        d3.select("#resultsDiv").style("display", "block");
        break;
      case 9: 
        revertIntro();
        d3.select("#printControl").style("color", "navy");
        break;
      case 10:
        revertIntro();
        d3.select("#showDetails").style("color","navy");
        d3.select("#helpDiv").classed("show", true).style("display", "block");
        break;
      case 11:
        revertIntro();
        break;
*/
    }
  });

  intro.onbeforechange(function() { 
    switch (this._currentStep) {
      case 0:
        break;
    }  
  });


  intro.onafterchange(function() { 
    switch (this._currentStep) {
      case 0:
        break;
    }  
  });



  intro.oncomplete(function() { 
    //localStorage.setItem('doneTour', 'yeah!'); 
    revertIntro();
  });

  intro.onexit(function() {
    revertIntro();
  });            


  intro.start();



  function revertIntro() {
    //0
    map.fitBounds([[35,-85],[47,-67]]);
    d3.select("#locateDiv").style("opacity", "").style("display", "");
    //1
    d3.select("#launchIntro").style("color", "");
    //2
    d3.select("#baselayerListDropdown").style("display", "");
    //3
    d3.select("#overlayListDropdown").style("display", "");
    if(d3.select("#layerToggleDiv4").select("span").style("visibility") == "visible") { $("#layerToggleDiv4").click(); };
    //4
    d3.select("#panelTools").selectAll("span").style("color", "");
/*    //5
    d3.select("#legendDiv").style("opacity", "").style("display", "");
    huc8.setOpacity(1);
    //6
    d3.select("#infoP").text("");
    d3.select("#infoDiv").style("opacity", "").style("display", "");
    //7
    d3.select("#updateDiv").style("opacity", "").style("display", "");
    //8
    d3.select("#resultsDiv").style("display", "");
    d3.select("#rpccrDiv").select("div").remove();
    d3.select("#updateDiv").style("opacity", "").style("display", "").classed("intro_vis", false);
    map.removeLayer(intro_example);
    map.removeLayer(huc12);
    //9
    d3.select("#printControl").style("color", "");
    //10
    d3.select("#showDetails").style("color","");
    d3.select("#helpDiv").classed("show", false).style("display", "none");
    //11
*/
  }
}


//******Login to account
function login(tmpForm) {
  var tmpData = {};
  if(typeof(tmpForm) != 'undefined') {
    tmpData.email = tmpForm.email_log.value;
    tmpData.password = tmpForm.password_log.value;
    socket.emit("login", tmpData);
  }
}

//******Register for an account
function register(tmpForm) {
  socket.emit("check_email", d3.select("#email_reg").property("value"));
  if(emailExists == true) { 
    alert("The email has already been registered");
  }
  else {
    var tmpData = {};
    tmpData.fname = tmpForm.fname.value;
    tmpData.lname = tmpForm.lname.value;
    tmpData.org = tmpForm.org.value;
    tmpData.email = tmpForm.email.value;
    tmpData.password = tmpForm.password.value;
    socket.emit("register", tmpData);
    $("#registerClose").click();
    $('#loginModal').modal('hide')
  }
}

//******Variable to hold access token
var accessToken = "";
var curUser = "";
var adStates = "";

//******
var emailExists = false;

//***Catchment selection layer style
function polyLayer(feature) {
  return {
    fillColor: "white",
    fillOpacity: 0.01,
    color: "cyan",
    weight: map.getZoom()/3
  };
}

//***Variable to hold selected feature
var editFeat = null;


//***Make CSV file from confirmTable and add it to download A element
function getConfirmCSV() {
  var tmpCSV = "";
  d3.select("#confirmTable").selectAll("tr").each(function() { 
    if(d3.select(this).classed("filtered") == false) {
      if(tmpCSV == "") {
        d3.select(this).selectAll("th").each(function(d,i) { 
          if(i == 0) { 
            tmpCSV += this.innerHTML; 
          } 
          else if(i == 2) { 
            tmpCSV += ", New Code"; 
          } 
          else if(i == 4) {
            tmpCSV += ", Note";
          }
          else if(i < 7) { 
            tmpCSV += "," + this.innerHTML; 
          } 
        });
        tmpCSV += "\n";
      }
      else {
        d3.select(this).selectAll("td").each(function(d,i) { 
          if(i == 0) { 
            tmpCSV += this.innerHTML; 
          } 
          else if(i == 2) {
            tmpCSV += ", " + d3.select(this).select("input").property("value");
          }
          else if(i == 4) {
            var tmpTitle = d3.select(this).select("span").attr("data-original-title");
            if(tmpTitle != null) { tmpTitle.replace("Add comment for record",""); }
            tmpCSV += ',' + tmpTitle;
          }
          else if(i == 5) {
            var tmpTitle = "";
            if(this.innerHTML != "") { 
              tmpTitle = d3.select(this).select("span").attr("data-original-title");
              if(tmpTitle != null) { 
                tmpTitle = tmpTitle.replace("<p>","").replace("</p>","");
              }
              else {
                tmpTitle = "";
              }
            }
            tmpCSV += "," + tmpTitle;
          }
          else if(i == 6) {
            if(d3.select(this).select("span").classed("fa-check-square") == true) {
              tmpCSV += ", Yes";
            }
            else {
              tmpCSV += ", No";
            }
          }
          else if(i < 7) { 
            tmpCSV += "," + this.innerHTML; 
          } 
        });
        tmpCSV += "\n";
      }
    } 
  });

  d3.select("#confirmDownloadA").attr("href", "data:attachment/csv," + encodeURIComponent(tmpCSV));
}


//******Required callback function for Google maps API
function googleLoaded() {
  console.log("Google maps loaded!");
}