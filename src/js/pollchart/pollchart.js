define([
  'd3',
  'hammer.js',
  'pollchart/polldata.js'
], function(
  d3,
  Hammer,
  polldata
) {
  'use strict';
  
  // Data:
  var dayUnit,
      dayConst = 86400000,
      termDic = { con: "Con", lab: "Lab", ukip: "UKIP", ldem: "LD", grn: "Green", 
                  YouGov: "YouGov", Populus: "Populus", "Lord Ashcroft": "Ashcroft", 
                  Opinium: "Opinium", ComResP: "ComRes", ComResO: "ComRes Online", 
                  TNS: "TNS BMRB", ICM: "ICM", Ipsos: "Ipsos-MORI", Survation: "Survation" };
  
  var data, dataAvg, dataset,
      svgParty, svgPolls, svgDates, svgRects,
      dateList; 

  // Date format:
  var dateStrX, dateEndX, // dates for axes drawing      
      dateFormat = "%d/%m/%Y",
      xAxisTextFormat,
      formatMon = d3.time.format("%b"),
      formatMonth = d3.time.format("%B"),
      formatPercent = d3.format(".0%");
  // Parse the date / time
  var parseDate = d3.time.format(dateFormat).parse;
  
  // Window size and chart's coordinate system:
  var width, height,
      margin = {top: 30, right:0, bottom: 30, left: 0},
      xAxis, yAxis, x, y,
      coord = {x: 0, y: 40};


  function render(el, rawData) {
    /* SVG */
    // x, y axes; circle, path, area (polygon as range), text
    var gx, gy ,gp, ga, gr,
        gtAvg, gtVi, gcPoll, gcDate;
    
    // Add the svg
    var svg = d3.select("#pollchart")
        .append("svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define the line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.vi); });

    
    /* Data */
    var dataAvgEnd;

    data = rawData.sheets['vi-continuous-series'];
    dataAvg = rawData.sheets['Con_Adj Log'];
    dataAvgEnd = rawData.sheets['Constituency_adjustments'];

    // Parse date
    data = data.map(function(d) {
      // + convert a Date object to time in milliseconds
      d.timestamp = +parseDate(d.date); 
      return d;  
    }).filter(function(d) {
      // only use daya since the beginning of Dec.
      return d.timestamp >= (+parseDate("01/12/2014")); 
    });
    
    // dataAvgEnd[0].date indicates when the script last ran
    // dataAvgEnd[0].currentdate is the date in reality
    dataAvgEnd[0].date = dataAvgEnd[0].currentdate;
    // Append the last avg to dataAvg if it's not yet there
    if (dataAvg[dataAvg.length-1].date !== dataAvgEnd.date) { 
      dataAvg = dataAvg.concat(dataAvgEnd); 
    }
    dataAvg = dataAvg.map(function(d) {
      d.timestamp = +parseDate(d.date);
      return d;
    });
    
    // Compose data 
    // extract dates from both polls (data) and avg (dataAvg) datasets 
    dateList = polldata.extractDataByKey(data.concat(dataAvg), "timestamp");
    dataset = polldata.composeDataByParty(data, dataAvg, dateList);
    //console.log(dateList); 
    //console.log(dataAvg);
    //console.log(dataset.pollster); 
    
    /* Window */
    setChartSize();
    

    /* D3: Drawing
    /* ******/
    function addCoordinate () {
      gx = svg.append("g").attr("class", "x axis ff-ss fz-12");
      gy = svg.append("g").attr("class", "y axis ff-ss fz-12");
    }
    function drawCoordinate() {
      // x axis
      gx.attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .attr("x", -2)
      .style("text-anchor", "start");
      // y axis
      gy.call(yAxis);
      gy.selectAll("g")
      .filter(function(d) { return d; })
      .classed("sc-ddd", true);
      gy.selectAll("text")
      .attr("x", 0)
      .attr("dy", -3);
    }

    // avg path
    function addPathWithLines(svgObj, className){
      gp = svgObj.append("path")
      .attr("class", className); 
    }
    function drawPathWithLines(){
      gp.attr("d", function(d) { return line(d.values); });
    }

    //TODO: change to use muti-line voronoi
    function addPolygons(svgObj, className) {
      ga = svgObj.append("polygon")
      .attr("class", className);
    } 
    function drawPolygons() {
      ga.attr("points", function(d) { 
        var points,
        yMax, yMin, ptMax, ptMin;

        // area for avg line and all vi dots
        ptMax = d.values.map(function(d) {
          yMax = (d.viMax > d.vi) ? y(d.viMax) : y(d.vi) - 10;
          return [x(d.date), yMax].join(","); 
        }).join(" ");
        ptMin = d.values.map(function(d) { 
          yMin = (d.viMin < d.vi) ? y(d.viMin) : y(d.vi) + 10;
          return [x(d.date), yMin].join(","); 
        }).reverse().join(" ");

        points = [ptMax, ptMin];
        return points;
      });
    }
    function onPolygon() {
      var ele;
      ga.on("mouseover", function(d) { 
        ele = document.querySelector(".party-polls." + d.party);
        d3.select(ele).classed("op-1-polls", true);
        d3.select(this.parentNode).classed("op-1-path", true); 
      }).on("mouseout", function() { 
        d3.select(ele).classed("op-1-polls", false);
        d3.select(this.parentNode).classed("op-1-path", false); 
      });
    }

    function addRects(svgObj) {
      gr = svgObj.append("rect")
      .attr("class", function(d) { return "t" + d; });
    }
    function drawRects() {
      gr.attr("x", function(d) { return x(d) - (x(d) - x(d - dayConst)) / 2; })
      .attr("y", 0)
      .attr("width", function(d) { return (x(d) - x(d - dayConst)); })
      .attr("height", height); 
    }
    function onRects() {
      var nl; //node list
      gr.on("mouseover", function(d) {
        nl = document.querySelectorAll(".t" + d + ".op-0");
        for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", false); }
        //var n = document.createTextNode(' '); 
        //document.body.appendChild(n); 
        //document.body.removeChild(n);
      })
      .on("mouseout", function() {
        for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", true); }
      });

      // pan evnt using hammerjs
      var el = document.querySelector(".dates"),
          op = { preventDefault: true },
          hr = new Hammer(el, op),
          preCN = null, // CN, classname
          curCN,
          strCN,
          numCN;

      hr.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL });
      
      hr.on("panstart", function(e) {
        strCN = e.target.className.baseVal;
        var s = strCN.slice(1);
        numCN = parseInt(s);
      });
      
      hr.on("panmove", function(e) {
        var d = Math.round(e.deltaX / dayUnit);
        curCN = "t" + (numCN + dayConst * d);
        // if pan position has not change
        if (preCN === curCN ) { return; } 
        // remove highlight if any 
        if (preCN !== null) {
          for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", true); } 
        }
        // add hightlight
        nl = document.querySelectorAll("." + curCN + ".op-0");
        for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", false); }
        preCN = curCN;
      });
      
      hr.on("panend", function() {
        // remove last highlight 
        for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", true); }
      });
    }
     
    /*function addCircle(svgObj, className) {
      svgObj.append("circle")
        .attr("class", className);
    }
    function drawCircle(className, cx, cy, r) {
      svgObj.select("className")
        .attr("class", className)
        .attr("cx", cx) 
        .attr("cy", cy)
        .attr("r", r);
    }*/

    function addCircles(svgObj, className, key) {
      var g = svgObj.selectAll("circle")
        .data(function(d) { return d.values; })
        .enter().append("circle")
        //.attr("class", className);
        .attr("class", function(d) { return "t" + d[key] + " " + className; });
      return g;
    }

    function drawCircles(gc, r) {
      gc.attr("cx", function(d) { return x(d.date) /*+ Math.random()*10*/; })
      .attr("cy", function(d) { return y(d.vi); })
      .attr("r", r);
    }

    function onCirclePoll(gc) {
      var ele, eleList;
      //addCircle()

      gc.on("mouseover", function(d) {
        // 1. Add tooltip
        var xPos = parseFloat(d3.select(this).attr("cx")),
        yPos = parseFloat(d3.select(this).attr("cy")),
        xPosEnd = x(dateEndX),
        yShift = 60,
        date = new Date(d.date),
        dateText = date.getDate() + " " + formatMonth(date);

        //drawLine(svg, xPos, yPos - 8, xPos, yPos - 120, "tp-line");
        //drawCircle(svg, xPos, yPos, 5, "tp-circle");

        ele = document.querySelector("#pollchartTooltip");
        d3.select(ele).classed('d-n', false);

        // top or bottom  
        ele.style.top = ((yPos - yShift) < (-15)) ? ((yPos + yShift) + "px") : ((yPos - yShift) + "px");
        if (xPos < (xPosEnd - 100)) {
          // align right
          ele.style.left = (xPos - 5) + "px";
          ele.style.right = "auto";
        } else {
          // align left
          ele.style.left = "auto";
          ele.style.right = (xPosEnd - xPos - 10) + "px";
        }

        eleList = ele.children;
        eleList[0].textContent = termDic[d.pollster];                 //pollster
        eleList[1].textContent = dateText;                            //date
        eleList[2].textContent = termDic[d.party] + " " + d.vi + "%"; //party and vi
        d3.select(eleList[2]).classed(d.party, true);

        // 2. highlight paths
        d3.select(this.parentNode).classed("op-1-pathpolls", true);
        d3.select("." + d.party).classed("op-1-path", true);
      })
      .on("mouseout", function(d) {
        // 1. Remove tooltip
        //svg.select(".tp-line").remove();
        //svg.select(".tp-circle").remove();

        d3.select(ele).classed('d-n', true);
        d3.select(eleList[2]).classed(d.party, false);

        // 2. Remove highlight
        d3.select(this.parentNode).classed("op-1-pathpolls", false);
        d3.select("." + d.party).classed("op-1-path", false);
      });
    }

    var posYShiftText = {con:20, grn:20, lab:-10, ukip:-10, ldem:-10};
    function addTextAvg(svgObj, className, key) {
      gtAvg = svgObj.append("text")
      //TODO: make sure data order
      .datum(function(d) { 
        return {key: d[key], value: d.values[d.values.length - 1], party: d.party}; 
      })
      .attr("class", className);
    } 
    function drawTextAvg() {
      gtAvg.attr("text-anchor", "left")
      .attr("x", function(d){ return x(d.value.date) + 8; })
      .attr("y", function(d){ 
        if (d.party === "con" || d.party === "lab") {
          if (dataAvgEnd[0].con > dataAvgEnd[0].lab) {
            posYShiftText.con = -10;
            posYShiftText.lab = 20;
        }}
        return y(d.value.vi) + 6 + posYShiftText[d.party] / 3; 
      })
      .text(function(d) { 
        var flag = "lab",
            num = d.value.vi;//Math.round(d.value.vi * 10) / 10; 
        if (d.party === "con" || d.party === "lab") {
          if (dataAvgEnd[0].con > dataAvgEnd[0].lab) {
            flag = "con";
        }}
        return d.party === flag ? num + "%" : num; 
      });
    }
    
    function addTextVi(svgObj, className) {
      gtVi = svgObj.selectAll("text")
      .data(function(d) { return d.values; })
      .enter().append("text")
      .attr("class", function(d) { return "t" + d.date + " ff-ss fz-12 " + className; });
    }
    function drawTextVi() {
      gtVi.attr("x", function(d){ return x(d.date) - 3; })
      .attr("y", function(d){ 
        return y(d.vi) + posYShiftText[d.party]; 
      })
      .text(function(d) { return d.vi; });
    }

    function drawSVGInit(){
      // 1. Draw coordinate
      addCoordinate();
      drawCoordinate();

      svgRects = svg.append("g")
        .attr("class", "dates op-0")
        .selectAll("rect")
        .data(dateList)
        .enter();

      svgParty = svg.selectAll("party")
        .data(dataset.date)
        .enter().append("g")            
        .attr("class", function(d) { return "party " + d.party; });

      svgDates = svg.selectAll("party-dates")
        .data(dataset.date)
        .enter().append("g")            
        .attr("class", function(d) { return "party-dates " + d.party; });

      svgPolls = svg.selectAll("party-polls")
        .data(dataset.pollster)
        .enter().append("g")
        .attr("class", function(d) { return "party-polls " + d.party; })
        .selectAll("g")
        .data(function(d) { return d.pollster; })
        .enter().append("g")
        .attr("class", function(d, index) { return "pollster p" + index;} );
      
      // 2. Draw over time view
      addRects(svgRects);
      drawRects();
      onRects();
      gcDate = addCircles(svgDates, "op-0", "date"); 
      drawCircles(gcDate, 3.5);
      addTextVi(svgDates, "op-0");
      drawTextVi();

      // 3. Draw area, path (with lines) - avarage, text
      addTextAvg(svgParty, "ff-ss fz-14", "party");
      drawTextAvg();

      addPathWithLines(svgParty, "path-avg");
      drawPathWithLines();
      addPolygons(svgParty, "polygon-range");
      drawPolygons(svgParty);
      onPolygon(); 

      // 4. Draw path (with lines) - individuals, text
      //drawPathWithLines(svgPolls, "path-polls");
      //drawText(svgPollster, "pollster");

      // 5. Draw circle - vi
      gcPoll = addCircles(svgPolls, "circle-poll");
      drawCircles(gcPoll, 3);
      onCirclePoll(gcPoll);
    }

    function drawSVG() {
      drawCoordinate();  
      drawRects();
      drawCircles(gcDate, 3.5);
      drawTextVi();
      drawTextAvg();
      drawPathWithLines();
      drawPolygons();
      drawCircles(gcPoll, 3);

      /*/TODO: remove hotfix
      var ele;
      svg.select(".tp-circle").remove();
      ele = document.querySelector("#pollchartTooltip");
      console.log(ele);
      ele.style.top = "-100px";
      ele.style.left = "-100px";
      ele.style.rifht = "auto";
      eleList = ele.children;
      eleList[2].className = "";
      */
    }

    var to = null;
    function resize() {
      if (to) {
        clearTimeout(to);
        to = null;
      }
      to = setTimeout(function() {
        setChartSize();
        drawSVG();
      }, 100);
    }

    drawSVGInit();
    d3.select(window).on('resize', resize); 
    /* ************/
  }

  /* Window size update and redraw 
  /* ******/
  function setChartSize() {
    // Dimensions of the chart
    var d = document,
        h = d.documentElement, //html
        p = d.querySelector("#pollchart"),
        s = d.querySelector("#pollchart svg"),
        w = p.clientWidth || h.clientWidth || window.innerWidth,
        h = h.clientHeight || window.innerHeight,
        h = (h > 480) ? 480 : (h - 80);

    width = w - margin.left - margin.right;
    height = h - margin.top - margin.bottom;
    s.setAttribute("height", h);

    // Ranges of the charts
    x = d3.time.scale().range([0, width]);
    y = d3.scale.linear().range([height, 0]);

    // Define the axes
    xAxis = d3.svg.axis().scale(x).orient("bottom")
            .ticks(d3.time.month),  
    yAxis = d3.svg.axis().scale(y).orient("right")
            .ticks(5).tickSize(width)
            .tickFormat(function(d) {
              return d === 40 ? formatPercent(d / 100) : d ;
            });

    // for mobile
    if (width < (660 - 10)) {
      var today = dataAvg[dataAvg.length-1].date;
      dateStrX = (+parseDate("24/11/2014"));
      dateEndX = (+parseDate(today)) + 20*dayConst;      
      xAxisTextFormat = formatMon;
    } else {
      dateStrX = (+parseDate("20/11/2014"));  
      dateEndX = (+parseDate("12/05/2015")); //election date is 07/05/2015
      xAxisTextFormat = formatMonth;
    }

    // Calculate dayUnit
    dayUnit = x(dateStrX + dayConst) - x(dateStrX);
    
    // Scale the range of the data
    x.domain([dateStrX, dateEndX]);
    y.domain([coord.x, coord.y]); 

    // xAxis format
    xAxis.tickFormat(xAxisTextFormat);

    // resize the chart
    d3.select("#pollChart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
  } 
  /* ************/

  return {
    render: render
  };
});
