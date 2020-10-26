function load_page() {
  d3.select("body")
    .append("div")
    .attr("class", "header")
    .style("padding", "3px 0px 3px 15px")
    .style("height", "40px")
    .html('<a href="https:ebtjv.ecosheds.org"><img id="titleImg" src="../images/ebtjv_icon.png"></img></a><span class="brand">EBTJV Catchment Updater</span> ');

  d3.select("body")
    .append("div")
    .style("margin-top", "100px")
    .style("text-align", "center")
    .html('<h2 style="color:blue;font-weight:bold;">Account Validation</h2>');

  d3.select("body")
    .append("div")
    .attr("id", "valDiv")
    .style("text-align", "center");

  var queryString = window.location.search;
  var urlParams = new URLSearchParams(queryString);
  var id = urlParams.get("id");

  socket.emit("validate", id);
}