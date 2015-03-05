define([
    'd3'
], function(
    d3
) {
   'use strict';

    function PollsOfPolls(data,options) {
        ////console.log("PollsOfPolls")
        var termDic = { 
                con: "Con", lab: "Lab", ukip: "UKIP", ldem: "LD", libdem: "LD", grn: "Green", green: "Green", others:"Others",snp:"SNP",
                YouGov: "YouGov", Populus: "Populus", "Lord Ashcroft": "Ashcroft", Opinium: "Opinium", 
                ComRes: "ComRes", ComResO: "ComRes Online", TNS: "TNS BMRB", ICM: "ICM", Ipsos: "Ipsos-MORI", Survation: "Survation" 
            };

        //////////console.log(data);

        function generateData(data) {

            ////console.log(data)

            var churning={};
            data.forEach(function(d){
                d.projection=d.projection.toLowerCase(),
                d.winner2010=d.winner2010.toLowerCase();
                d.unfiltered_projection=d.unfiltered_projection.toLowerCase();

                if(!churning[d.projection]) {
                    churning[d.projection]={
                        from:{},
                        to:{},
                        total:0,
                        all:0,
                        unfiltered_all:0
                    };
                }
                if(!churning[d.winner2010]) {
                    churning[d.winner2010]={
                        from:{},
                        to:{},
                        total:0,
                        all:0,
                        unfiltered_all:0
                    };
                }

                if(!churning[d.unfiltered_projection]) {
                    churning[d.unfiltered_projection]={
                        from:{},
                        to:{},
                        total:0,
                        all:0,
                        unfiltered_all:0
                    };
                }

                if(!churning[d.projection].from[d.winner2010]) {
                    churning[d.projection].from[d.winner2010]=0;
                }

                if(!churning[d.winner2010].to[d.projection]) {
                    churning[d.winner2010].to[d.projection]=0;
                }
                churning[d.projection].from[d.winner2010]++;
                churning[d.winner2010].to[d.projection]++;
                churning[d.projection].total+=(d.projection!=d.winner2010)?1:0;
                //////console.log(churning)
                //churning[d.projection].total.from+=(d.projection!=d.winner2010)?1:0;
                //churning[d.winner2010].total.from+=(d.projection!=d.winner2010)?1:0;
                churning[d.projection].all+=1;
                churning[d.unfiltered_projection].unfiltered_all+=1;

            });
            
            return churning;
        }
        data=generateData(data);
        
        var self=this;

        var WIDTH=d3.select(options.container).node().clientWidth || d3.select(options.container).node().offsetWidth,//window.innerWidth,
            HEIGHT=options.height || 600;

        var margins=options.margins || {
                                            left:0,
                                            top:0,
                                            right:0,
                                            bottom:0
                                        }
        
        options.top=(typeof options.top != 'undefined')?options.top:(80+50);

        var padding={
            left:0,
            top:0,
            right:0,
            bottom:0
        };

        var bar={
            height:80,
            distance:40,
            detail_height:5,
            detail_distance:20
        };
        var tooltip=d3.select(options.container)
                        .select("div#tooltip");

        var svg=d3.select(options.container)
                    .append("svg")
                    .attr("width",WIDTH)
                    .attr("height",HEIGHT);

        var defs=svg.append("defs");

        options.order.forEach(function(d){
            options.order.forEach(function(t){
                var gradient=defs.append("linearGradient")
                        .attr({
                            id:"grad_"+d+"2"+t,
                            x1:"0%",
                            y1:"0%",
                            x2:"0%",
                            y2:"100%"
                        });
                gradient.append("stop")
                            .attr({
                                offset:"0%",
                                "class":d
                            })
                gradient.append("stop")
                            .attr({
                                offset:"100%",
                                "class":t
                            })
            })
            var gradient2gray=defs.append("linearGradient")
                    .attr({
                        id:"grad2gray_"+d,
                        x1:"0%",
                        y1:"0%",
                        x2:"0%",
                        y2:"100%"
                    });
            gradient2gray.append("stop")
                        .attr({
                            offset:"0%",
                            "class":d
                        })
            gradient2gray.append("stop")
                        .attr({
                            offset:"100%",
                            "class":"gray"
                        })
            
        });

        var to=null;
        window.addEventListener('resize', function(event){
            if(to) {
                clearTimeout(to);
                to=null;
            }
            to=setTimeout(function(){
                resize();   
            },250)
            
        });

        var xpadding=0;
        var xscale=d3.scale.linear().domain([0,650]);
        xscale.range([0,WIDTH-(margins.left+margins.right+padding.left+padding.right)]);

        function triangle(h,bottom) {
            
            if(bottom) {
                return "M0,0l0,"+(h);
                return "M0,0l"+(h/2)+","+(h)+"l"+(-h)+",0z";
            }
            return "M0,0l0,"+(-h);
            return "M0,0l"+(h/2)+","+(-h)+"l"+(-h)+",0z";
        }
        if(typeof options.triangle!='undefined' && options.triangle) {
            var triangle_h=20,
            majority=svg.append("g")
                        .attr("class","majority")
                        .attr("transform","translate("+(xscale(325)+(margins.left+padding.left))+","+(margins.top+padding.top)+")")
            
            

            //////console.log(xscale(325),xscale(277),xscale(26),xscale(3),xscale(21),xscale(1))

            majority.append("path")
                            .attr("d",triangle(triangle_h))
                            
            if(options.additionalTriangle) {
                majority.append("path")
                    .attr("id","addTriangle")
                    .attr("d",triangle(triangle_h,options.additionalTriangle.orientation))
                    .attr("transform","translate("+0+","+(options.additionalTriangle.verticalPosition)+")")
            }
            
            if(options.majorityText) {
                var txt=majority.append("text")
                            .attr("x",0)
                            .attr("y",-(triangle_h+4));
                txt.append("tspan")
                            .attr("class","bold")
                            .text("326 seats")
                txt.append("tspan")
                            .text(" for a majority")    
            }
            
        }



        var values=getBars3(data,"from");


        var current; //current bars
        var change; //flows
        var balanceSheet; //balanceSheet
        var all_flows=svg.append("g")
                        .attr("id","all_flows");
        //projection
        var polls=new SeatsChart(values,{
            party_field:"from",
            title:options.notitle?null:["...could change hands in the ","2015 Guardian projection"],
            top:options.top,
            flowHeight:options.top,
            bar:{
                height:80
            },
            textOrientation:1,
            filter:options.filter,
            showValues:options.showValues,
            labelAlign:options.labelAlign
        });

        function resize() {
            //WIDTH=1300,//window.innerWidth;//d3.select(options.container).node().clientWidth || d3.select(options.container).node().offsetWidth,//window.innerWidth,
            WIDTH=d3.select(options.container).node().clientWidth || d3.select(options.container).node().offsetWidth;


            svg.attr("width",WIDTH)
            
            update();
        }
        function update(){
            
            xscale.range([0,WIDTH-(margins.left+margins.right+padding.left+padding.right)]);
            
            

            if(typeof options.triangle!='undefined' && options.triangle) {
                majority.attr("transform","translate("+(xscale(325)+(margins.left+padding.left))+","+(margins.top+padding.top)+")")
            }
            if(polls) {
                polls.resize(getBars3(data,"from"));    
            }
            if(current) {
                current.resize(getBars3(data,"to"));    
            }
            if(change) {
                change.resize(getBars3(data,"to"),getBars3(data,"from"))    
            }
            
            if(balanceSheet) {
                balanceSheet.resize();
            }
        }

        this.showOnlyGains=function() {
            polls.showDifferent(1);
            current.showDifferent(1);
        }

        function getBars4(data,field) {
            var values=[];
            d3.entries(data).forEach(function(d){
                //////////console.log(d)
                d3.entries(d.value[field]).forEach(function(s){
                    values.push({
                        from:d.key,
                        to:s.key,
                        qty:s.value
                    })
                })
            });
            var prev_x=0,
                prev_x_real=0;
            values.sort(function(a,b){
                    if(options.order.indexOf(a.from) == options.order.indexOf(b.from)) {
                        return options.order.indexOf(a.to) - options.order.indexOf(b.to);
                    }
                    return options.order.indexOf(a.from) - options.order.indexOf(b.from);
                }).forEach(function(d){
                    
                    d.x_real=prev_x_real;
                    prev_x_real+=d.qty;
                    
                    d.x=prev_x;
                    prev_x+=xscale(d.qty);

                    d.x=xscale(d.x_real)
                    
                })
            ////console.log("========>",values)
            return values;
        }

        function getBars3(data,field) {
            var values=[];
            d3.entries(data).forEach(function(d){
                //////////console.log(d)
                d3.entries(d.value[field]).forEach(function(s){
                    values.push({
                        from:d.key,
                        to:s.key,
                        qty:s.value
                    })
                })
            });
            var prev_x=0,
                prev_x_real=0;
            values.sort(function(a,b){
                    if(options.order.indexOf(a.from) == options.order.indexOf(b.from)) {
                        return options.order.indexOf(a.to) - options.order.indexOf(b.to);
                    }
                    return options.order.indexOf(a.from) - options.order.indexOf(b.from);
                }).forEach(function(d){
                    
                    d.x_real=prev_x_real;
                    prev_x_real+=d.qty;
                    
                    //d.x=prev_x;
                    //prev_x+=xscale(d.qty);

                    d.x=xscale(d.x_real)
                    
                })
            ////console.log("========>",values)
            return values;
        }



        function getBars(data,field) {
            var values=[];
            d3.entries(data).forEach(function(d){
                //////////console.log(d)
                d3.entries(d.value[field]).forEach(function(s){
                    values.push({
                        from:d.key,
                        to:s.key,
                        qty:s.value
                    })
                })
            });
            var same_from_to={};
            var prev_x=0,
                prev_x_real=0;
            values
            .forEach(function(d){
                if(d.from==d.to) {
                    same_from_to[d.from]=d;    
                }
            })
            values.sort(function(a,b){
                    if(options.order.indexOf(a.from) == options.order.indexOf(b.from)) {
                        return options.order.indexOf(a.to) - options.order.indexOf(b.to);
                    }
                    return options.order.indexOf(a.from) - options.order.indexOf(b.from);
                }).forEach(function(d){
                    
                    d.x_real=prev_x_real;
                    prev_x_real+=d.qty;
                    
                    d.x=prev_x;
                    prev_x+=xscale(d.qty);
                    
                    d.w=xscale(d.qty)
                    
                })
            
            var dx={};
            dx["snp"]=0;
            values.forEach(function(d){
                if(d.from=="snp") {
                    if(d.x>same_from_to["snp"].x) {
                        d.x-=same_from_to["snp"].w;
                        dx["snp"]=d.w;
                    }
                }
            })
            
            dx["ukip"]=0;
            values.forEach(function(d){
                if(d.from=="ukip") {
                    if(d.x>same_from_to["ukip"].x) {
                        d.x-=same_from_to["ukip"].w;
                        dx["ukip"]=d.w;
                    }
                }
            })
            same_from_to["snp"].x+=dx["snp"];
            same_from_to["ukip"].x+=dx["ukip"];
            
            return values;
        }

        this.addHistoricTrends=function(id) {
            var historicTrends=d3.select(options.container)
                            .append("div")
                            .attr("id",id)
                                .attr("class","polls-trends")
        }
        this.addCoalitions=function(id,coalitions_glosses,max) {
                    
                    //////console.log("CIAOOOOOOOO")
                    //////console.log(data)

                    

                    var glosses=coalitions_glosses.sort(function(a,b){
                        return a.order - b.order;
                    }).map(function(d){
                        var parties=d.parties.toLowerCase().split(",");
                        return {
                            parties:parties,
                            text:d.description,
                            total:d3.sum(parties,function(p){
                                //console.log(p,data)
                                return data[p]["unfiltered_all"]
                            }),
                            w:100/3
                        }
                    })
                    
                    var coalitions=d3.select(id || options.container)
                            .append("div")
                                .attr("id","coalitions");

                    var coalition=coalitions.selectAll("div")
                            .data(glosses.filter(function(d,i){
                                return max?i<max:1;
                            }))
                            .enter()
                            .append("div")
                                .attr("class",function(d,i){
                                    return "coalition n"+i;
                                })


                    var party=coalition.append("div")
                                .attr("class","coalition-balance")
                                .selectAll("div")
                                    .data(function(d){
                                        return d.parties.map(function(p){
                                            return {
                                                party:p,
                                                l:d.parties.length
                                            }
                                        })
                                    })
                                    .enter()
                                        .append("div");
                    party
                        .append("span")
                            .attr("class",function(d,i){
                                return "party bg-"+d.party;
                            })
                    party
                        .append("span")
                            .attr("class",function(d,i){
                                ////////console.log("!!!!!!!!!!!!!!!!!!!!",d.party,i)
                                return "party plus";
                            })
                            .text(function(d,i){
                                if(i<d.l-1) {
                                    return "+";
                                }
                                return "=";
                            })
                    coalition.select(".coalition-balance")
                        .append("span")
                            .text(function(d){
                                return d.total+" seats";
                            })


                    coalition.append("p")
                            .html(function(d){
                                return d.text;
                            })


                }

        this.addLastElections=function() {
            
            var values=getBars3(data,"to")
            
            current=new SeatsChart(values,{
                party_field:"to",
                title:options.notitle?null:["Which seats in the ","current parliament..."],
                top:0,
                flowHeight:options.top,
                bar:{
                    height:10,
                },
                titleAlign:"top",
                textOrientation:0,
                filter:options.filter,
                labelAlign:"top"
            });    
        }

        var details;
        this.addDetails=function() {
            details=new PollsDetails(data.seats,{
                top:options.top || 80+50,
                bar:{
                    height:80,
                    distance:70,
                    detail_height:5,
                    detail_distance:40
                }
            });    
        }


        this.addBalanceSheet=function(party) {

            balanceSheet=new BalanceSheet(party);
        }

        function BalanceSheet(party) {

            var balance=d3.select(options.container)
                .append("div")
                .attr("class","balance-sheet")
                .style({
                    width:xscale.range()[1]+"px",
                    "margin-left":(margins.left+padding.left)+"px"
                })
            balance
                    .append("div")
                        .attr("class","balance-equal balance-value")
                            .append("span")
                                .text("=");

            var balanceResult=balance
                        .append("div")
                            .attr("class","balance-result balance-value");
            balanceResult.append("span")
                            .attr("class","qty");
            balanceResult.append("span")
                            .attr("class","label");
            
            var values,to,from;

            this.resize=function(){
                updateData();
                update();
            }

            function updateData() {
                values=getBars3(data,"from");

                to=values.filter(function(d){
                    return d.from==party && d.from!=d.to;
                })
                to.forEach(function(d){
                    d.plus=1;
                })
                //////console.log("to",to)

                from=values.filter(function(d){
                    return d.to==party && d.from!=d.to;
                })
                from.forEach(function(d){
                    d.plus=0;
                })
                
                

            }

            function update() {

                
                var all=to.concat(from);

                var balanceValues=balance.selectAll("div.balance-value.seats")
                        .data(all.sort(function(a,b){
                            return a.x-b.x;
                        }));

                var newBalanceValues=balanceValues.enter()
                                        .append("div")
                                            .attr("class",function(d){
                                                return "balance-value seats "+(d.plus?d.to:d.from);
                                            });

                var label_width=40+2;
                balanceValues.data().forEach(function(d){
                    d.x_label=d.x+xscale(d.qty)/2//-label_width/2;
                    d.ox_label=d.x+xscale(d.qty)/2//-label_width/2;
                });
                var labels=balanceValues.data();
                function positionsLabels(){
                    var overlap=false;
                    
                    for(var i=0;i<labels.length;i++) {
                        if(i<labels.length-1) {
                            var l1=labels[i],
                                l2=labels[i+1];
                            var delta=((l1.x_label+label_width/2)-(l2.x_label-label_width/2));
                            
                            if(delta>=0) {
                                ////////console.log(delta)
                                overlap=true;
                                if(Math.abs(l1.x_label-l1.ox_label)<15)
                                    l1.x_label-=0.5;
                                l2.x_label+=0.5;
                            }    
                        }    
                    }
                    if(overlap) {
                        positionsLabels();
                    }
                }

                positionsLabels();

                //BALANCE RESULT
                var last_value=labels[labels.length-1],
                    balance_result_x=(last_value.x_label+label_width*2/3+label_width/2),
                    delta_x=Math.min(WIDTH-(balance_result_x+50),0);

                if(options.viewport) {
                    delta_x=Math.min((options.viewport.w+options.viewport.l)-(balance_result_x+60),0);
                    //console.log(WIDTH,options.viewport,delta_x)
                }
                
                balanceValues
                    .style("left",function(d){
                                return ((d.x_label||d.x)+delta_x)+"px"
                    })

                newBalanceValues
                    .append("span")
                                .attr("class","qty")
                                .text(function(d){
                                    //////console.log(party,d);
                                    return (d.plus?"+":"-")+d.qty;
                                })
                newBalanceValues.append("span")
                                .attr("class","label")
                                .html(function(d){
                                    if(d.plus) {
                                        return "from<br/>"+termDic[d.to];
                                    }
                                    return "to<br/>"+termDic[d.from];
                                })

                
                
                balance.select("div.balance-equal")
                            .style("left",function(d){
                                return ((last_value.x_label+label_width*2/3)+delta_x)+"px"
                            })

                

                balanceResult.select(".qty")
                                .text(function(d){
                                    var sum_from=d3.sum(from,function(d){
                                            return d.qty;
                                        }),
                                        sum_to=d3.sum(to,function(d){
                                            return d.qty;
                                        }),
                                        balance=sum_to-sum_from;
                                    return Math.abs(balance);
                                })
                balanceResult.select(".label")
                                .html(function(d){
                                    var sum_from=d3.sum(from,function(d){
                                            return d.qty;
                                        }),
                                        sum_to=d3.sum(to,function(d){
                                            return d.qty;
                                        }),
                                        balance=sum_to-sum_from;
                                    return "seats<br/>"+(balance>0?"gained":"lost")
                                })

                balanceResult
                    .style("left",function(){
                        //console.log("///////////",balance_result_x,delta_x,balance_result_x+delta_x)
                        return (balance_result_x+delta_x)+"px"
                    })
            }
            updateData();
            update();
        }


        this.addFlows=function() {
            
            var from_values=getBars3(data,"from"),
                to_values=getBars3(data,"to");
            

            
            change=new SeatsChangeProtoSankeySorrySankey2(to_values,from_values,{
                order:options.order,
                top:10,
                bottom:options.top || 80+50,
                marginTop:options.marginTop || 0,
                filter:options.filter
            })
            if(options.ix) {

                polls.addMouseEvents({
                    mouseOverCallback:function(d){
                        //////////console.log(d)
                        change.highlightFlows(d.from,"to")
                        polls.highlight(d.from)
                        current.highlight(d.from)
                    },
                    mouseOutCallback:function(d){
                        change.highlightFlows(null)
                        polls.highlight(null)
                        current.highlight(null)
                    }    
                })
                
                current.addMouseEvents({
                    mouseOverCallback:function(d){
                        change.highlightFlows(d.from,"from")
                        polls.highlight(d.from)
                        current.highlight(d.from)
                    },
                    mouseOutCallback:function(d){
                        change.highlightFlows(null)
                        polls.highlight(null)
                        current.highlight(null)
                    }
                });    
            }
            
            
        }
        function SeatsChangeProtoSankeySorrySankey2(data_from,data_to,options) {
          
            var tos={};
            data_to.forEach(function(d){
                if(d.to==d.from) {
                    tos[d.to]={
                        x:d.x,
                        x_real:d.x_real
                    }
                }
            })
            
            all_flows
                    .classed("filtered",(typeof options.filter != "undefined"))
                    .attr("transform","translate("+(margins.left+padding.left)+","+(margins.top+padding.top+options.top+options.marginTop)+")")
            
            this.resize=function(newData_from,newData_to) {
                data_from=newData_from;
                data_to=newData_to;

                var tos={};
                data_to.forEach(function(d){
                    if(d.to==d.from) {
                        tos[d.to]={
                            x:d.x,
                            x_real:d.x_real
                        }
                    }
                })

                update();
            }

            function update() {
                var flows=all_flows.selectAll("g.flow")
                            .data(data_from,function(d){
                                return "flow_"+d.from+"_"+d.to;
                            })
                
                flows.exit().remove();
                
                var new_flows=flows
                                .enter()
                                .append("g")
                                    .attr("class",function(d){
                                        return "flow "+d.from;
                                    })
                                    .classed("main-party",function(d){
                                        return (typeof options.filter != "undefined") && ((options.filter.indexOf(d.from)>-1)||(options.filter.indexOf(d.to)>-1))
                                    })
                                    .classed("same-party",function(d){
                                        return d.from==d.to;
                                    })
                                    .attr("rel",function(d){
                                        return d.from+"2"+d.to;
                                    })
                                    .attr("transform",function(d){
                                        return "translate(0,0)";
                                    })
                flows
                    .attr("transform",function(d){
                        //var x=xscale(d[options.fields.current+"_x"])
                        return "translate("+0+",0)";
                    })
                
                
                new_flows.append("path")

                flows.select("path")
                            .attr("d",function(d){
                                //////////console.log(d)
                                var to=data_to.filter(function(t){
                                    return d.from==t.to && d.to==t.from;
                                })[0]
                                //////////console.log(to)
                                var x1=d.x,
                                    x2=to.x,
                                    w=Math.max(xscale(d.qty),1),
                                    h=options.bottom-options.top;
                                w=(xscale(d.qty));
                                d.x2=x2;
                                
                                    
                                return  "M"+x1+",0L"+(x1+w)+",0"+
                                        "C "+(x1+w)+" "+h/2+","+(x2+w)+" "+h/2+","+(x2+w)+" "+h+
                                        "L"+(x2)+","+h+
                                        "C "+(x2)+" "+h/2+","+(x1)+" "+h/2+","+(x1)+" "+0
                                        "Z";
                            })
                            .attr("fill",function(c){
                                return "url(#grad_"+c.from+"2"+c.to+")"; 
                            })


            }
            update();
            this.highlightFlows=function(party,direction,party2) {
                
                //////////console.log(party,direction)
                
                all_flows.selectAll("g.flow")
                        .selectAll("path")
                            .classed("dehighlight",function(d){
                                
                                if(!party && !direction) {
                                    return false;
                                }
                                return d[direction]!=party;
                            })
                            .classed("highlight",function(d){
                                if(!party && !direction) {
                                    return false;
                                }
                                return d[direction]==party;
                            })
                            
                
            }
            
        }





        function SeatsChart(data,options) {
            //////////console.log(data)
            
            var nested_data = d3.nest()
                    .key(function(d) { return d["from"]; })
                    .rollup(function(leaves) { return {
                        leaves:leaves,
                        sum:d3.sum(leaves,function(d){
                            return d.qty;
                        })
                    }; })
                    .entries(data);
            //////////console.log("@@@@@@@@@@@@@@@@@@@@")
            //////////console.log(nested_data)
            //////////console.log("@@@@@@@@@@@@@@@@@@@@")

            var bar=options.bar;
            
            var bg=svg.append("g")
                        .attr("id","bg_"+options.party_field)
                        .attr("class","bg")
                        .attr("transform","translate("+(margins.left)+","+(margins.top+padding.top+options.top)+")")
            if(options.bg) {
                bg.append("rect")
                    .attr("x",0)
                    .attr("y",0)
                    .attr("width",WIDTH-(margins.right+margins.left))
                    .attr("height",bar.height)    
            }
            
            if(options.title) {
                var txt=bg.append("text")
                    .attr("x",0)
                    .attr("y",-2);
                txt
                    .selectAll("tspan")
                    .data(options.title)
                    .enter()
                    .append("tspan")
                        .classed("bold",function(d,i){
                            return i>0;
                        })
                        .text(function(d){
                            return d;
                        })
                    //.html(options.title)    
            }        
            
            
            var seats=svg.append("g")
                        .classed("filtered",(typeof options.filter != "undefined"))
                        .attr("transform","translate("+(margins.left+padding.left)+","+(margins.top+padding.top+options.top)+")")
            
            this.highlight=function(party,party2) {
                if(!party) {
                    seats.selectAll("g.bar").classed("hover",false).classed("dehover",false);    
                    return;
                }
                seats.selectAll("g.bar")
                        .classed("hover",function(d){

                            var max=d3.max(data.filter(function(b){
                                return b.from==d.from;
                            }));
                            //////////console.log("|||||||||||||||||||||||",d,max)
                            return d.x==max.x && party==d.from;
                        })
                        .classed("dehover",function(d){
                            return d.from!=party || d.to!=party2;
                        })

            }
            this.showDifferent=function(show) {

                seats.selectAll("g.bar")
                        .classed("same",function(d){
                            if(!show) {
                                return 0;
                            }
                            return d.from==d.to;
                        })
            }
            this.resize=function(newData) {
                data=newData;
                
                ////////console.log("NEW DATA",newData);

                nested_data = d3.nest()
                    .key(function(d) { return d["from"]; })
                    .rollup(function(leaves) { return {
                        leaves:leaves,
                        sum:d3.sum(leaves,function(d){
                            return d.qty;
                        })
                    }; })
                    .entries(data);
                update();
            }
            function update() {

                ////console.log(data)

                var bars=seats.selectAll("g.bar")
                            .data(data.sort(function(a,b){
                                return b.qty - a.qty;
                            }),function(d){
                                return d["from"]+"_"+d["to"];
                            })
                
                bars.exit().remove();
                var prev_x=0;
                var new_bars=bars
                                .enter()
                                .append("g")
                                    .attr("class",function(d){
                                        return "bar "+d["from"];
                                    })
                                    .classed("main-party",function(d){
                                        return (typeof options.filter != "undefined") && ((options.filter.indexOf(d.from)>-1)||(options.filter.indexOf(d.to)>-1))
                                    })
                                    .classed("same-party",function(d){
                                        return d.from==d.to;
                                    })
                                    .attr("rel",function(d){
                                        return d.to+"2"+d.from;
                                    })
                                    .attr("transform",function(d,i){
                                        return "translate("+(d.x)+","+0+")";
                                    })
                                    
                if(options.mouseOverCallback) {
                    new_bars.on("mouseover",options.mouseOverCallback);
                }
                if(options.mouseOutCallback) {
                    new_bars.on("mouseout",options.mouseOutCallback);
                }
                                    
                new_bars.append("rect")
                                .attr("x",0)
                                .attr("y",0)
                                .attr("width",0)
                                .attr("height",bar.height);

                new_bars.append("rect")
                                .attr("class","ix")
                                .attr("x",0)
                                .attr("y",-options.flowHeight/2)
                                .attr("width",0)
                                .attr("height",bar.height+options.flowHeight);
                
                new_bars.append("text")
                        .attr("y",function(d){
                            var sum=nested_data.filter(function(nd){
                                return nd.key==d.from;
                            })[0].values.sum;

                            if(options.labelAlign=="top") {
                                return -5;
                            }
                            if(options.labelAlign=="bottom") {
                                return bar.height+15;
                            }

                            if(sum<8) {
                                return bar.height+15;
                            }
                            return -5;
                            //options.textOrientation?bar.height+15:-5
                        })
                        .text(function(d){
                            return nested_data.filter(function(nd){
                                return nd.key==d.from;
                            })[0].values.sum
                        });
                
                bars
                    .attr("transform",function(d,i){
                        return "translate("+((d.x))+","+0+")";
                    })
                    .selectAll("rect")
                        .attr("width",function(d){
                            return Math.max(xscale(d.qty),1);
                        });

                bars.select("text")
                    .attr("x",function(d){
                        var x=xscale(nested_data.filter(function(nd){
                            return nd.key==d.from;
                        })[0].values.sum);

                        if(d.from=="lab" && options.title && options.labelAlign=="top") {
                            return x-40;
                        }

                        return x/2;
                    })

                
                bars
                    .classed("main-bar",function(d){
                        var max=d3.max(bars.data().filter(function(b){
                            return b.from==d.from;
                        }));
                        return d.x==max.x;
                    })
                    .classed("show-text",function(d){
                        var max=d3.max(bars.data().filter(function(b){
                            return b.from==d.from;
                        }));
                        return d.x==max.x && options.showValues;
                    })
                    .classed("left",function(d){
                        return d.x_real>325;
                    })
                    .classed("right",function(d){
                        return d.x_real<325;
                    })
                
            }
            update();
            
            this.addMouseEvents=function(evt) {
                
                if(evt.mouseOverCallback) {
                    seats.selectAll("g.bar")
                        .on("mouseover",evt.mouseOverCallback)
                        .on("touchstart",function(d){
                            d3.event.preventDefault();
                            evt.mouseOverCallback(d)   
                        });
                }
                
                if(evt.mouseOutCallback) {
                    seats.selectAll("g.bar")
                        .on("mouseout",evt.mouseOutCallback);
                }
                
            }
            
        }
        d3.selection.prototype.moveToFront = function() {
          return this.each(function(){
            this.parentNode.appendChild(this);
          });
        };
    }

    return PollsOfPolls;
});
