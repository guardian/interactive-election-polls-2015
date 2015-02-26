define([
    'd3'
], function(
    d3
) {
   'use strict';

    function DayByDay(data,options) {
        
		var current_status=0;

		updateData();
        
        var max=d3.max(data.map(function(d){
            return d3.max(d.polls,function(v){
                return v.value;
            })
        }));
            
        var MAX=Math.ceil(max/10)*10;

		var xscale=d3.scale.linear().domain([0,MAX]).range([0,1]);

		var canvas,ctx;

		var pollsters=getPollsters(data);
		addPollsters();
		addAxis();
		update();

        if(isCanvasSupported) {
            var bgImage=generateBackground();
            applyBackground(bgImage);    
        }
		
		
		var to=null;
		window.addEventListener('resize', function(event){
			if(to) {
				clearTimeout(to);
				to=null;
			}
			to=setTimeout(function(){
				resize();	
			},100)
			
		});
		
		var tooltips=new Tooltips("#pollsTable");

		function Tooltips(container) {

            var self=this;

			var tooltipRow=d3.select(container)
				.append("div")
				.attr("id","dbdTooltips");

			var tooltips=tooltipRow.selectAll("div.tooltip")
					.data(options.parties.concat(["others"]))
					.enter()
					.append("div")
						.attr("class","tooltip")

			var tooltip=tooltips.append("div");
			tooltip.append("span")
						.attr("class","party")
						.text(function(d){
							return d;
						})
			tooltip.append("span")
						.attr("class","perc");

			this.set=function(polls,index) {
                

				tooltipRow
					.style("top",(index*46+5)+"px")

				var prev_x=0;
				tooltips
					.sort(function(a,b){
						return polls[a]-polls[b]
					})
					.style("left",function(d){
						return d3.format("p")(xscale(polls[d]));
					})
					.style("top",function(d,i){
                        if(canvas.width/xscale.domain()[1]<10) {
                            return 30*(i%2)+"px";    
                        }
						return 30+"px";
					})
					.classed("hidden",function(d,i){
						var poll=polls.polls.filter(function(p){
							return p.party==d;
						})[0]

						return i%2<1 && poll.overlap_total>1;
					})
					.attr("rel",function(d){

					})
					.select("span.perc")
					.text(function(d){
						return polls[d];//+"%";
					})
			}
		}

		d3.select(options.container+" a#showMorePolls")
			.on("click",function(){
				d3.event.preventDefault();

				current_status= !current_status;


                var elem = window.parent.document.getElementById('daybydayIFrame'); // the id of your iframe of course
                if(elem) {
                    elem.style.height = !current_status?'370px':'4600px';    
                }
                

				d3.select(this)
					.text(current_status?"show less":"show more")
				showMore();
			})

		function backingScale(context) {
			if ('devicePixelRatio' in window) {
				if (window.devicePixelRatio > 1) {
					return window.devicePixelRatio;
				}
			}
			return 1;
		}
        function getWidth(win) {
            if(win) {
                return window.innerWidth;
            }
            var axis_node=document.getElementById("xaxis");
            return axis_node.clientWidth || axis_node.offsetWidth;
        }
        function isCanvasSupported(){
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        }
		function generateBackground() {
			var ticks=d3.range(0,MAX,1);

			if(!canvas) {
				canvas=document.createElement("canvas");
				
				var scaleFactor = backingScale(ctx);

				if (scaleFactor > 1) {
				    canvas.width = canvas.width * scaleFactor;
				    canvas.height = canvas.height * scaleFactor;
				    
				}
				ctx=canvas.getContext("2d");
			}
			
			canvas.width=getWidth();
			
			canvas.height=20;
			ctx.strokeStyle="#ddd";
			ctx.lineWidth=1;

			function line(x1,y1,x2,y2) {
				x1=Math.round(x1)+0.5;
				x2=Math.round(x2)+0.5;

				ctx.beginPath();
				ctx.moveTo(x1,y1)
				ctx.lineTo(x2,y2);
				ctx.stroke();
			}

			ticks.forEach(function(tick){
				var x=Math.round(xscale(tick)*(canvas.width))+(!tick?1:0);
				line(x,0,x,canvas.height)
			})
			line(xscale(ticks[ticks.length-1]+1)*(canvas.width)-1,0,xscale(ticks[ticks.length-1]+1)*(canvas.width)-1,canvas.height)

			return canvas.toDataURL();
		}

		function addAxis() {
			var xaxis=d3.select(options.container+" div#pollsTable")
							.append("div")
							.attr("class","xaxis")
								.append("div")
								.attr("id","xaxis")

			
			xaxis.append("div")
					.attr("class","label min")
						.append("span")
							.text(d3.format("p")(xscale.range()[0]))
			
			xaxis.append("div")
					.attr("class","label max")
						.append("span")
							.text(d3.format("p")(xscale.domain()[1]/100))

            d3.select(options.container+" div#pollsTable div.xaxis")
                    .append("span")
                        .attr("class","label change")
                        .text("change from 2010")
		}
		function update(){

			var table=d3.select(options.container+" div#pollsTable"),
				polls=table   				
						.selectAll("div.poll")
						.data(data);

			polls.exit().remove();



			var new_polls=polls.enter()
							.append("div")
								.attr("class","poll")
								.classed("hidden",function(d,i){
									return i>=options.show;
								})
								/*.classed("none",function(d,i){
									return i>=options.show;
								})*/
								.on("mouseover",function(d){
									//console.log.log(d)
									
									var index=0;
									table.selectAll("div.poll:not(.hidden)")
											.each(function(p,i){
												if(p.pollster==d.pollster && p.date==d.date) {
													index=i;
												}
											})

									tooltips.set(d,index);

								})



			var title=new_polls.append("div")
						.attr("class","title")
			title.append("span")
					.attr("class","date")
					.text(function(d){
                        if(getWidth(1)<480) {
                            return d3.time.format("%e %b")(d.timestamp2);    
                        }
						return d3.time.format("%e %B")(d.timestamp2);
					})
			title.append("span")
					.html(function(d){
						return " "+(options.termDic[d.pollster] || d.pollster)
					})

			var projections=new_polls.append("div")
						.attr("class","projection")
						
			var parties=projections.selectAll("div.party")
							.data(function(d){
								var results={};
								d.polls.forEach(function(p){
									if(!results[p.value]) {
										results[p.value]=0;
									}
									results[p.value]++;
									p.overlap=results[p.value]
								})
								
								d.polls.forEach(function(p){
									p.overlap_total=results[p.value]
								})
								return d.polls;
							})
							.enter()
							.append("div")
								.attr("class","party")
								.style("left",function(d){
									return d3.format("p")(xscale(d.value));
								})
								.append("span")
									.attr("class",function(d){
    									return "marker "+d.party+" overlap"+(d.overlap+""+d.overlap_total);
    								})
    								.attr("rel",function(d){
    									return d.overlap;
    								})

            var sharesOfVotes={
                con:36.0,
                lab:29.0
            }

            var diffs=new_polls.append("div")
                        .attr("class","diffs")

            diffs.selectAll("div.diff")
                    .data(function(d){
                        var parties=["con","lab"];
                        return parties.map(function(p){
                            return {
                                party:p,
                                value:d[p]
                            }
                        })
                    })
                    .enter()
                        .append("div")
                            .attr("class",function(d){
                                return "diff "+d.party;
                            })
                            .text(function(d){

                                return d3.format("+")(d.value-sharesOfVotes[d.party])+"% "+options.termDic[d.party];
                            })

				

		}
		function resize() {
            if(isCanvasSupported) {
    			var bgImage=generateBackground();
    			applyBackground(bgImage);
            }
            updateTitles();
		}
		function applyBackground(bgImage){
			var polls=d3.selectAll(options.container+" div.poll")
    				.select(".projection")
    				.style("background-image","url("+bgImage+")");	
		}
		function showMore() {
			
			var polls=d3.selectAll(options.container+" div.poll")
							.classed("hidden",function(d,i){
								if(current_status) {
									return !d.status;
								}
								return i>=options.show || !d.status;
							})
							/*.classed("none",function(d,i){
								if(current_status) {
									return 0;
								}
								return i>=options.show;
							})*/
		}
		
		function hideShowPolls() {
			var i=0;
			d3.selectAll(options.container+" div.poll")
				.classed("hidden",function(d){
					var status=pollsters.filter(function(p){
						return p.pollster==d.pollster
					});
					
					if(status[0].status && i>=options.show && !current_status) {
						return 1;
					}
					if(status[0].status) {
						i++;
					}
					d.status=status[0].status;
					return !status[0].status;
				})
		}
		function addPollsters() {
			d3.select(options.container+" ul#pollstersFilter")
						.selectAll("li.pollster")
						.data(pollsters)
						.enter()
						.append("li")
							.attr("class","pollster")
							.append("a")
								.attr("href","#")
								.attr("title",function(d){
									return d.pollster;
								})
                                .attr("class","button button--small button--tag button--secondary")
								.classed("selected",function(d){
    								return d.status;
    							})
    							.html(function(d){
    								return options.termDic[d.pollster] || d.pollster
    							})
    							.on("click",function(d){
    								d3.event.preventDefault();
    								d.status = !d.status;
    								d3.select(this).classed("selected",d.status)
    								hideShowPolls();
    							})
		}

		function getPollsters(data) {

			var pollsters=arrayUnique(data.map(function(d){
				return d.pollster;
			}));
			//console.log(pollsters)

			return pollsters.map(function(d){
				return {
					pollster:d,
					status:1
				}
			});

		}
        function updateTitles() {

            var table=d3.select(options.container+" div#pollsTable"),
                polls=table                 
                        .selectAll("div.poll");

            var title=polls.select(".title")
                        
            title.select("span")
                    .text(function(d){
                        //console.log.log("!!!!!!",getWidth(1))
                        if(getWidth(1)<480) {
                            return d3.time.format("%e %b")(d.timestamp2);    
                        }
                        return d3.time.format("%e %B")(d.timestamp2);
                    })
        }
		function updateData() {
			var format=d3.time.format("%d/%m/%Y")

			data.forEach(function(d){
				//console.log.log("aaaa",d)
				d.timestamp2=format.parse(d.date);
                
                d.status=true;

				d.polls=options.parties.map(function(p){
					var obj={
						party:p,
						value:d[p]?d[p]:0
					};
					
					return obj;
				})

				d.others=100-d3.sum(d.polls,function(p){
					return p.value;
				});
				d.polls.push({
					party:"others",
					value:d.others
				});
					
			})

			data.sort(function(a,b){
				return (+b.timestamp2) - (+a.timestamp2);
			})
		}

		function arrayUnique(array){
			var u = {}, a = [];
			for(var i = 0, l = array.length; i < l; ++i){
				if(u.hasOwnProperty(array[i])) {
					continue;
				}
				a.push(array[i]);
				u[array[i]] = 1;
			}
			return a;
		}

	}

    return DayByDay;

});