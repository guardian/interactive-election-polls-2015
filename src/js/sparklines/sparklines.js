define([
    'd3'
], function(
    d3
) {
   'use strict';
   
	function Sparkline(data,options) {
		var self=this;
		var chartContainer=d3.select(options.container)
								.append("div")
									.attr("class","seats-chart")
									.attr("rel",options.index);
									//.classed("border-left",function(d,i){
				                    //    return options.index==2;
				                    //})

		var WIDTH=chartContainer.node().clientWidth || chartContainer.node().offsetWidth;
		//WIDTH=WIDTH/options.n;
		var HEIGHT=Math.max(WIDTH*(9/16),140);

		

		var margins={
			top:10,
			bottom:20,
			left:5,
			right:50+(options.seatsText?20:0)
		};

		var padding={
				top:20,
				bottom:0,
				left:0,
				right:0
			},
			timeSelector,
			extents,
			to; //timeout

		var delta=options.delta || 2;
		var linedata;

		updateData();

		window.addEventListener('resize', function(e){
	        if(to) {
	            clearTimeout(to);
	            to=null;
	        }
	        to=setTimeout(function(){
	            resize();   
	        },100);
	        
	    });

	    function resize() {
	        WIDTH=chartContainer.node().clientWidth || chartContainer.node().offsetWidth;
	        svg.attr("width",WIDTH);
	        update();
	    }

		function updateData() {
			
			extents={
				maxDate:d3.max(data,function(d){
					return d.date;
				})
			};

			var last=extents.maxDate,
				past_weeks = new Date(last.getTime());
			past_weeks.setDate(past_weeks.getDate() - 7*(options.weeks || 1));
			//console.log("------->",data.length)
			data=data.filter(function(d){
				return +d.date >= +past_weeks;
			})
			//console.log("------->",data.length)

			extents={
				date:d3.extent(data,function(d){
					return d.date;
				})
			};
			extents.y=[
					d3.min(data.map(function(d){
						return d3.min(options.fields.map(function(f){
							return d[f];
						}));
					})),
					Math.max(325,d3.max(data.map(function(d){
						return d3.max(options.fields.map(function(f){
							return d[f];
						}));
					}))
					)
			];

			if(options.extents) {
				extents.y=options.extents;
			}

			extents.y[0]-=delta;
			extents.y[1]+=delta;

			linedata=options.fields.map(function(d){
								return {
									party:d,
									values:data.map(function(p){
										return {
											party:d,
											date:p.date,
											value:p[d]
										};
									})
								};
							});
		}
		

		var seatsDiff=chartContainer
					.append("div")
						.attr("class","seats-change");

		var svg=chartContainer
					.append("svg")
						.attr("width",WIDTH)
						.attr("height",HEIGHT);

		var xscale=d3.time.scale().domain(extents.date).range([0,(WIDTH-(margins.left+margins.right+padding.left+padding.right))]);

		var yscale=d3.scale.linear()
						.domain(extents.y)
						.range([HEIGHT-(margins.bottom+margins.top+padding.top+padding.bottom),padding.bottom]).nice();

		var xAxis;
		var axes=svg.append("g")
					.attr("id","axes")
					.attr("transform","translate("+margins.left+","+(HEIGHT-margins.bottom)+")");

		var linecharts=svg.append("g")
						.attr("class","linecharts")
						.attr("transform","translate("+margins.left+","+margins.top+")");

		var linechart=linecharts.selectAll("g.linechart")
							.data(linedata)
							.enter()
							.append("g")
								.attr("class","linechart")
								.attr("rel",function(d){
									return d.party;
								})
								.attr("transform",function(d){
									if(d.party==="cLeft") {
										return "translate("+(xscale.range()[1]*2)+",0)";
									}
									return "translate(0,0)";
								});
		
		
		
		var line = d3.svg.line()
					    .x(function(d) { return xscale(d.date); })
					    .y(function(d) { return yscale(d.value); });
		
		if(options.interpolate) {
			line.interpolate(options.interpolate);
		}

		

		linechart
				.append("path")
				.attr("class",function(d){
					return "line "+d.party;
				});
		
		var touchstart=false;
		var day=linechart.selectAll("g.day")
					.data(function(d){
						return d.values;
					})
					.enter()
						.append("g")
							.attr("class","day")
							.classed("first",function(d){
								return +d.date === (+xscale.domain()[0]);
							})
							.classed("last",function(d){
								return +d.date === (+xscale.domain()[1]);
							})
							.classed("right-aligned",function(d){
								return +d.date === (+xscale.domain()[1]);
							})
							.on("mouseover",function(d){
								if(options.mouseOverCallback) {
									options.mouseOverCallback(d);
								}
							})
							.on("mouseout",function(d){
								if(options.mouseOutCallback) {
									options.mouseOutCallback(d);

								} else {
									self.highlight();
								}	
							})
							.on("touchstart", function(){
								d3.event.preventDefault();
								touchstart=true;
							})
							.on("touchend",function(){
								touchstart=false;
							})
							.on("touchmove",function(d){
								d3.event.preventDefault();
								if(touchstart) {
									var coord=d3.touches(linechart.node());
									console.log(Math.round(coord[0][0]))
									var d=xscale.invert(Math.round(coord[0][0])).setHours(0,0,0,0);
								    var poll=linedata[0].values.filter(function(p){
								    		return +d === (+p.date);
								    	})[0];
							    	if(typeof poll != 'undefined') {
							    		console.log(poll)
							    		if(options.mouseOverCallback) {
											options.mouseOverCallback(poll);
										}
							    	}
								}
							})

		var label=linechart
					.append("g")
						.attr("class","label")	
						.attr("class",function(d){
							return "label "+d.party;
						})
						.attr("transform",function(d){
							var x=xscale(extents.date[1]),
								y=yscale(d.values[d.values.length-1].value)
							return "translate("+x+","+y+")"
						});


		label
				.append("text")
					.attr("class",function(d){
						return "label "+d.party;
					})
					.attr("x",8)
					.attr("y",4)
					.text(function(d){
						return (d.values[d.values.length-1].value)+(options.seatsText?" seats":"");
					});
		label
				.append("circle")
					.attr("class",function(d){
						return "label "+d.party;
					})
					.attr("cx",0)
					.attr("cy",0)
					.attr("r",4);

		
		seatsDiff
				.append("span")
					.attr("class",function(){
						return "seats-diff-n"
					})
					.html(function(){
						var last=data[data.length-1][options.fields[0]],
							before_last=data[data.length-7][options.fields[0]];
						return d3.format("+")(last-before_last)+" <i>seats</i>";
					});
		seatsDiff
				.append("span")
				.attr("class",function(){
					return "seats-diff-day"
				})
				.html(function(){
					var before_last=data[data.length-7].date;
					if(WIDTH<160) {
						return "since "+d3.time.format("%a")(before_last)+"<br/>last week"	
					}
					return "since "+d3.time.format("%A")(before_last)+"<br/>last week"
				});

		day
				.append("circle")
					.attr("class",function(d){
						return d.party;
					})
					.attr("cx",0)
					.attr("cy",0)
					.attr("r",3);

		day.append("line")
					.attr("class",function(d){
						return "dropline "+d.party;
					})
					.attr("x1",0)
					.attr("y1",3)
					.attr("x2",0)
					.attr("y2",function(d){
						return yscale.range()[0]-yscale(d.value)-5
					});

		day.append("text")
					.attr("class","dropline")
					.attr("x",function(d){
						if (+d.date > +(d3.mean(xscale.domain()))) {
							return 2;
						}
						return -2;
					})
					.attr("y",function(d){
						return yscale.range()[0]-yscale(d.value)+10
					})
					.text(function(d){
						return d.value+" seats";
					});

		day.append("text")
					.attr("class","dropline")
					.attr("x",function(d){
						if (+d.date > +(d3.mean(xscale.domain()))) {
							return 2;
						}
						return -2;
					})
					.attr("y",function(d){
						return yscale.range()[0]-yscale(d.value)+25
					})
					.text(function(d){
						return d3.time.format("%b %d")(d.date);
					});


		var bar_width=xscale.range()[1]/(data.length-1);
		day
			.append("rect")
				.attr("class",function(d){
					return "ix "+d.party;
				})
				.attr("x",-bar_width/2)
				.attr("y",function(d){
					return -yscale(d.value)
				})
				.attr("width",bar_width)
				.attr("height",HEIGHT);
		
		this.highlight=function(d) {
			if(!d) {
				chartContainer.classed("hover",false)
				day.classed("hover",false)
				return;
			}
			chartContainer.classed("hover",true)
			day.classed("hover",function(p){
				return +d.date === +p.date;
			});

		}

		function update() {
			var w=(WIDTH-(margins.left+margins.right+padding.left+padding.right));
			xscale.range([0,w]);
			bar_width=xscale.range()[1]/(data.length-1);

			console.log("!!!!!!!!!!!",w)
			chartContainer.classed("show-first",(w>120))

			linechart
				.select("path")
				.attr("d",function(d){
					return line(d.values)
				});
			linechart
				.select("g.label")
					.attr("transform",function(d){
						var x=xscale(extents.date[1]),
							y=yscale(d.values[d.values.length-1].value)
						return "translate("+x+","+y+")"
					});
			seatsDiff
				.style("left",function(){
					return (xscale.range()[1]-100)+"px"
				})
				.select("span.seats-diff-day")
					.html(function(){
						var before_last=data[data.length-7].date;
						if(WIDTH<160) {
							return "since "+d3.time.format("%a")(before_last)+"<br/>last week"	
						}
						return "since "+d3.time.format("%A")(before_last)+"<br/>last week"
					});

			day.attr("transform",function(d){
				var x=xscale(d.date),
					y=yscale(d.value);
				return "translate("+x+","+y+")"
			});
			bar_width=xscale.range()[1]/(data.length-1);
			day
				.append("rect")
					.attr("class","ix")
					.attr("x",-bar_width/2)
					.attr("width",bar_width);

			axes.select(".x.axis").call(xAxis);

		}
		

		xAxis = d3.svg.axis().scale(xscale).tickValues(function(){
			var last=xscale.domain()[1],
				last_week = new Date(last.getTime());
			last_week.setDate(last_week.getDate() - 7);
			return [
				last,extents.date[1],extents.date[0]
			];
		});

		var yAxis = d3.svg.axis().scale(yscale).orient("left").tickValues(yscale.ticks()
						.filter(function(d){
							return (Math.round(d) - d) === 0;
						}));

		var xtickFormat=function(value){
			
			return d3.time.format("%d/%b")(value)

			var d=d3.time.format("%d")(value);

			if(+d===1) {
				return d3.time.format("%b")(value);
			}
			return d3.time.format("%d")(value);
		}
		var ytickFormat=function(d){
			var title="";
			return d3.format("s")(d)+title;
		}
		
		xAxis.tickFormat(xtickFormat);
		yAxis.tickFormat(ytickFormat);

		/*var xaxis=axes.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate("+padding.left+",0)")
	      .call(xAxis);*/
	    
	    update();


	    linechart.selectAll("g.circle")				
			.on("click",function(d){
				selectTick(d.date);
				options.callback(d);
			})
		function selectTick(time) {

			linechart
				.selectAll("g.circle")
				.classed("selected",function(t){
					return time.getTime()===t.date.getTime();
				});

			svg.select(".x.axis")
				.selectAll(".tick")
					.classed("selected",function(t){
						return time.getTime()===t.getTime();
					});

			timeSelector.select(time);
		}
	}

	return Sparkline;

});