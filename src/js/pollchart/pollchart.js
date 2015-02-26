//TODO:
// 1. load avg data from sheets
// 3. fix tooltip on resize
// 4. add voronoi for circle picking 
// 5. space for overlapped circles
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
                  YouGov: "YouGov", Populus: "Populus",/* Ashcroft: "Ashcroft",*/ "Lord Ashcroft": "Ashcroft", 
                  Opinium: "Opinium", ComResP: "ComRes", ComResO: "ComRes Online", 
                  TNS: "TNS BMRB", ICM: "ICM", Ipsos: "Ipsos-MORI", Survation: "Survation" };
  
  var data, dataset,
      svgParty, svgPolls, svgDates, svgRects,
      dateList; 

  // Date format:
  var dateStr, dateEnd, //TODO: fix left padding; 7/5 election date
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

    
    /* Window */
    setChartSize();
    

    /* Data */
    var dataAvg, dataEnd, avgList;
    data = rawData.sheets["vi-continuous-series"];
    dataAvg = rawData.sheets["Con_Adj Log"];
    dataEnd = rawData.sheets["Constituency_adjustments"];
    // Parse date
    data = data.map(function(d) {
      // + convert a Date object to time in milliseconds
      d.timestamp = +parseDate(d.date); 
      return d;  
    }).filter(function(d) {
      return d.timestamp >= (+parseDate(dateStr)); 
    });
    dataAvg = dataAvg.map(function(d) {
      d.timestamp = +parseDate(d.date);
      return d;
    });
    dataEnd[0].timestamp = Date.now();
    // Compose data 
    avgList = dataAvg.concat(dataEnd);
    dateList = polldata.extractDataByKey(data, "timestamp");
    dataset = polldata.composeDataByParty(data, dataAvg, dateList);
    

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
          //console.log(d);
          yMax = (d.viMax > d.vi) ? y(d.viMax) : y(d.vi) - 10;
          return [x(d.date), yMax].join(","); 
        }).join(" ");
        ptMin = d.values.map(function(d) { 
          yMin = (d.viMin < d.vi) ? y(d.viMin) : y(d.vi) + 10;
          return [x(d.date), yMin].join(","); 
        }).reverse().join(" ");
        //TODO: area for detection
        // ...

        points = [ptMax, ptMin];
        return points;
      });
    }
    function onPolygon() {
      var ele;
      ga.on("mouseover", function(d) { 
        ele = document.querySelector(".party-polls." + d.party);
        ele.classList.add("op-1-polls");
        this.parentNode.classList.add("op-1-path"); 
      })
      .on("mouseout", function() { 
        ele.classList.remove("op-1-polls");
        this.parentNode.classList.remove("op-1-path"); 
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
        for (var i=0; i<nl.length; i++) { nl[i].classList.remove("op-0"); }
      })
      .on("mouseout", function(d) {
        for (var i=0; i<nl.length; i++) { nl[i].classList.add("op-0"); }
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
          for (var i=0; i<nl.length; i++) { nl[i].classList.add("op-0"); } 
        }
        // add hightlight
        nl = document.querySelectorAll("." + curCN + ".op-0");
        for (var i=0; i<nl.length; i++) { nl[i].classList.remove("op-0"); }
        preCN = curCN;
      });
      
      hr.on("panend", function(e) {
        // remove last highlight 
        for (var i=0; i<nl.length; i++) { nl[i].classList.add("op-0"); }
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
        xPosEnd = x(parseDate(dateEnd)),
        yShift = 60,
        date = new Date(d.date),
        dateText = date.getDate() + " " + formatMonth(date);

        //drawLine(svg, xPos, yPos - 8, xPos, yPos - 120, "tp-line");
        //drawCircle(svg, xPos, yPos, 5, "tp-circle");

        ele = document.querySelector("#pollchartTooltip");
        ele.classList.remove('d-n');

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

        //TODO: bottom if too height access the iframe
        eleList = ele.children;
        eleList[0].textContent = termDic[d.pollster];                 //pollster
        eleList[1].textContent = dateText;                            //date
        eleList[2].textContent = termDic[d.party] + " " + d.vi + "%"; //party and vi
        eleList[2].classList.add(d.party);

        // 2. highlight paths
        this.parentNode.classList.add("op-1-pathpolls");
        d3.select("." + d.party).classed("op-1-path", true);
      })
      .on("mouseout", function(d) {
        // 1. Remove tooltip
        //svg.select(".tp-line").remove();
        //svg.select(".tp-circle").remove();

        ele.classList.add('d-n');
        eleList[2].classList.remove(d.party);

        // 2. Remove highlight
        this.parentNode.classList.remove("op-1-pathpolls");
        d3.select("." + d.party).classed("op-1-path", false);
      });
    }

    var posYShiftText = {con:20, grn:20, lab:-10, ukip:-10, ldem:-10};
    function addTextAvg(svgObj, className, key) {
      gtAvg = svgObj.append("text")
      //TODO: make sure data order
      .datum(function(d) { return {key: d[key], value: d.values[d.values.length - 1], party: d.party}; })
      .attr("class", className);
    } 
    function drawTextAvg() {
      gtAvg.attr("text-anchor", "left")
      .attr("x", function(d){ return x(d.value.date) + 8; })
      .attr("y", function(d){ return y(d.value.vi) + 6 + posYShiftText[d.party] / 4; })
      .text(function(d) { 
        var num = (d.value.vi).toFixed(1); 
        return d.party === "lab" ? num + "%" : num; 
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
      .attr("y", function(d){ return y(d.vi) + posYShiftText[d.party]; })
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
      gcDate = addCircles(svgDates, "op-0", "date"); 
      drawCircles(gcDate, 3.5);
      addTextVi(svgDates, "op-0");
      drawTextVi();
      addRects(svgRects);
      drawRects();
      onRects();

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
      drawCircles(gcDate, 3.5);
      drawTextVi();
      drawRects();
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

    function resize() {
      setChartSize();
      drawSVG();
    }

    drawSVGInit();
    d3.select(window).on('resize', resize); 
    /* ************/
  }

  /* Window size update and redraw 
  /* ******/
  function setChartSize() {
    // Dimensions of the chart
    var w = window,
        d = document,
        h = d.documentElement, //html
        p = d.querySelector("#pollchart"),
        s = d.querySelector("#pollchart svg"),
        w = p.clientWidth || h.clientWidth || w.innerWidth,
        h = h.clientHeight || w.innerHeight,
        h = (h > 480) ? 480 : (h - 80),
        str;

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
      var today = new Date(),
          month = today.getMonth() + 1;

      dateStr = "24/11/2014"; 
      dateEnd = (today.getDate() + 20) + "/" + month + "/" + today.getFullYear();
      xAxisTextFormat = formatMon;
    } else {
      dateStr = "20/11/2014";  
      dateEnd = "12/05/2015";
      xAxisTextFormat = formatMonth;
    }

    // Scale the range of the data
    x.domain([parseDate(dateStr), parseDate(dateEnd)]);
    y.domain([coord.x, coord.y]); 

    str = +parseDate(dateStr);
    dayUnit = x(str + dayConst) - x(str);

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
