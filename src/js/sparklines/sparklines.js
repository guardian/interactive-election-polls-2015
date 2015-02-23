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
									.attr("rel",options.index)
									.classed("border-left",function(d,i){
				                        return options.index==3;
				                    })

		var WIDTH=chartContainer.node().clientWidth || chartContainer.node().offsetWidth;
		//WIDTH=WIDTH/options.n;
		var HEIGHT=Math.max(WIDTH*(9/16),140);

		var margins={
			top:10,
			bottom:20,
			left:20,
			right:50+(options.seatsText?20:0)
		}

		var padding={
			top:20,
			bottom:0,
			left:0,
			right:0
		}
		var timeSelector;
		var extents;
		var to; //timeout

		var delta=options.delta || 2;

		window.addEventListener('resize', function(event){
	        if(to) {
	            clearTimeout(to);
	            to=null;
	        }
	        to=setTimeout(function(){
	            resize();   
	        },100)
	        
	    });

	    function resize() {
	        //WIDTH=d3.select(options.container).node().clientWidth || d3.select(options.container).node().offsetWidth,//window.innerWidth,
	        WIDTH=chartContainer.node().clientWidth || chartContainer.node().offsetWidth;
			//WIDTH=WIDTH/options.n;
	        svg.attr("width",WIDTH)
	        update();
	    }

		function updateData() {
			extents={
				date:d3.extent(data,function(d){
					return d.date;
				}),
				y:[
					d3.min(data.map(function(d){
						return d3.min(options.fields.map(function(f){
							return d[f]
						}));
					})),
					Math.max(325,d3.max(data.map(function(d){
						return d3.max(options.fields.map(function(f){
							return d[f]
						}));
					}))
					)
				]
			}

			if(options.extents) {
				extents.y=options.extents;

			}

			extents.y[0]-=delta;
			extents.y[1]+=delta;

			//console.log(extents);
		}

		updateData();

		var seatsDiff=chartContainer
					.append("div")
						.attr("class","seats-change");

		var svg=chartContainer
					.append("svg")
						.attr("width",WIDTH)
						.attr("height",HEIGHT);
		
		var electionDay=new Date(2015,4,7);
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
							.data(options.fields.map(function(d){
								return {
									party:d,
									values:data.map(function(p){
										return {
											party:d,
											date:p.date,
											value:p[d]
										}
									})
								}
							}))
							.enter()
							.append("g")
								.attr("class",function(d){
									return "linechart";
								})
								.attr("rel",function(d){
									return d.party;
								})
								.attr("transform",function(d){
									if(d.party=="cLeft") {
										return "translate("+(xscale.range()[1]*2)+",0)";
									}
									return "translate(0,0)";
								})
		
		
		
		var line = d3.svg.line()
					    .x(function(d) { return xscale(d.date); })
					    .y(function(d) { return yscale(d.value); })
		
		if(options.interpolate) {
			line.interpolate(options.interpolate)
		}

		var area = d3.svg.area()
						.x(function(d) { return xscale(d.date); })
						.y0(HEIGHT-(margins.bottom+margins.top))
					    .y1(function(d) { return yscale(d.value); })

		linechart
				.append("path")
				.attr("class",function(d){
					return "line "+d.party;
				})
		
		
		var day=linechart.selectAll("g.day")
					.data(function(d){
						return d.values;
					})
					.enter()
						.append("g")
							.attr("class","day")
							.classed("first",function(d,i){
								return +d.date == (+xscale.domain()[0])
							})
							.classed("last",function(d,i){
								return +d.date == (+xscale.domain()[1])
							})
							.classed("right-aligned",function(d){
								return +d.date > +(d3.mean(xscale.domain()))
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
						})


		label
				.append("text")
					.attr("class",function(d){
						return "label "+d.party;
					})
					.attr("x",8)
					.attr("y",4)
					.text(function(d){
						return (d.values[d.values.length-1].value)+(options.seatsText?" seats":"");
					})
		label
				.append("circle")
					.attr("class",function(d){
						return "label "+d.party;
					})
					.attr("cx",0)
					.attr("cy",0)
					.attr("r",4)

		seatsDiff
				.append("span")
				.text("Change since last week");
		seatsDiff
				.append("span")
					.attr("class",function(){
						return "seats-diff-n"
					})
					.html(function(){
						var last=data[data.length-1][options.fields[0]],
							before_last=data[data.length-7][options.fields[0]];
						return d3.format("+")(last-before_last)+" <i>seats</i>";
					})

		day
				.append("circle")
					.attr("class",function(d){
						return d.party;
					})
					.attr("cx",0)
					.attr("cy",function(d){
						return 0;//yscale(d.values[d.values.length-1].value)
					})
					.attr("r",3)

		day.append("line")
					.attr("class",function(d){
						return "dropline "+d.party;
					})
					.attr("x1",0)
					.attr("y1",3)
					.attr("x2",0)
					.attr("y2",function(d){
						return yscale.range()[0]-yscale(d.value)-5
					})

		day.append("text")
					.attr("class",function(d){
						return "dropline";
					})
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
					})
		day.append("text")
					.attr("class",function(d){
						return "dropline";
					})
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
						return d3.time.format("%d/%b")(d.date);
					})


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
				.attr("height",HEIGHT)
		

		/*linechart
				.append("line")
					.attr("class",function(d){
						return "dropline last "+d.party;
					})
					.attr("x1",function(d){
						return xscale(extents.date[1]);
					})
					.attr("y1",function(d){
						return yscale(d.values[d.values.length-1].value)
					})
					.attr("x2",function(d){
						return xscale(extents.date[1]);
					})
					.attr("y2",function(d){
						return yscale(extents.y[0]);//yscale(d.values[d.values.length-1].value)
					})*/

		/*linechart
				.append("line")
					.attr("class",function(d){
						return "dropline first "+d.party;
					})
					.attr("x1",function(d){
						return xscale(extents.date[0]);
					})
					.attr("y1",function(d){
						return yscale(d.values[0].value)
					})
					.attr("x2",function(d){
						return xscale(extents.date[0]);
					})
					.attr("y2",function(d){
						return yscale(extents.y[0]);//yscale(d.values[d.values.length-1].value)
					})*/
		this.highlight=function(d) {
			if(!d) {
				chartContainer.classed("hover",false)
				day.classed("hover",false)
				return;
			}
			chartContainer.classed("hover",true)
			day.classed("hover",function(p){
				return +d.date == +p.date;
			})

		}

		function update() {
			xscale.range([0,(WIDTH-(margins.left+margins.right+padding.left+padding.right))]);

			linechart
				.select("path")
				.attr("d",function(d){
					return line(d.values)
				})
			linechart
				.select("g.label")
					.attr("transform",function(d){
						var x=xscale(extents.date[1]),
							y=yscale(d.values[d.values.length-1].value)
						return "translate("+x+","+y+")"
					})
			seatsDiff
				.style("left",function(){
					return (xscale.range()[1]+margins.left+padding.left+5)+"px"
				})

			day.attr("transform",function(d){
				var x=xscale(d.date),
					y=yscale(d.value);
				return "translate("+x+","+y+")"
			})
			bar_width=xscale.range()[1]/(data.length-1);
			day
				.append("rect")
					.attr("class","ix")
					.attr("x",-bar_width/2)
					.attr("width",bar_width)

			/*linechart
				.select("line.dropline.last")
					.attr("x1",function(d){
						return xscale(extents.date[1]);
					})
					.attr("x2",function(d){
						return xscale(extents.date[1]);
					})*/

			/*linechart
				.append("line.dropline.first")
					.attr("x1",function(d){
						return xscale(extents.date[0]);
					})
					.attr("x2",function(d){
						return xscale(extents.date[0]);
					})*/

			axes.select(".x.axis").call(xAxis)

		}
		

		xAxis = d3.svg.axis().scale(xscale).tickValues(function(){
			var last=xscale.domain()[1],
				last_week = new Date(last.getTime());
			last_week.setDate(last_week.getDate() - 7);
			return [
				last,extents.date[1],extents.date[0]
			]
		});

		var yAxis = d3.svg.axis().scale(yscale).orient("left").tickValues(yscale.ticks()
						.filter(function(d){
							return (Math.round(d) - d) === 0;
						}));

		var xtickFormat=function(value){

			////console.log("!!!!!!!!!!!",value)
			
			return d3.time.format("%d/%b")(value)

			var d=d3.time.format("%d")(value),
				m=d3.time.format("%b")(value);

			if(+d===1) {
				return d3.time.format("%b")(value);
			}
			return d3.time.format("%d")(value)
		}
		var ytickFormat=function(d,i){
			var title="";
			return d3.format("s")(d)+title;
		}
		
		xAxis.tickFormat(xtickFormat);
		yAxis.tickFormat(ytickFormat);

		var xaxis=axes.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate("+padding.left+",0)")
	      .call(xAxis)
	    
	    update()


	    linechart.selectAll("g.circle")				
			.on("click",function(d){
				selectTick(d.date);
				options.callback(d);
			})
		function selectTick(time) {

			linechart
				.selectAll("g.circle")
				.classed("selected",function(t){
					return time.getTime()==t.date.getTime();
				});

			svg.select(".x.axis")
				.selectAll(".tick")
					.classed("selected",function(t){
						return time.getTime()==t.getTime();
					});

			timeSelector.select(time);
		}
		//selectTick(xscale.ticks()[xscale.ticks().length-1]);
	}

	return Sparkline;

});