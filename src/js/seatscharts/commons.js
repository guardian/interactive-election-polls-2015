define([
    'd3',
    'seatscharts/PollsOfPolls',
    'sparklines/sparklines',
    'pollchart/daybyday'
], function(
    d3,
    PollsOfPolls,
    Sparkline,
    DayByDay
) {
   'use strict';

    var names={
            "con":"Conservative",
            "libdem":"Liberal Democrats",
            "ukip":"UKIP",
            "others":"Others",
            "pc":"PC",
            "green":"Green Party",
            "snp":"Scottish National",
            "lab":"Labour Party"
        };
    var ORDER=(["con","libdem","ukip","dup","others","pc","green","snp","lab"]).reverse();
    

    function render(el,data) {
        

        var projections=new PollsOfPolls(data.sheets["RESULT"],{
            container:el,
            order:ORDER,
            height:140,
            top:0,
            margins:{
                left:0,
                top:40,
                right:0,
                bottom:0
            },
            additionalTriangle:null,
            triangle:1,
            ix:true,
            names:names,
            notitle:true,
            showValues:true,
            majorityText:true
        })

        projections.addHistoricTrends("seatsCharts");
        projections.addCoalitions("#coalitionsChart",data.sheets["coalitions"]);

        // SPARKLINES
        var format=d3.time.format("%d/%m/%Y")
        data.sheets["Log Seats"]=data.sheets["Log Seats"].filter(function(d){
            return typeof d.logdate == "string"
        })
        
        var parties=["lab","snp","ukip","libdem","con"]
        
        function getExtents(data) {
            var all_extents=[];

            parties.forEach(function(party){
                var extent=d3.extent(data,function(d){
                    return d[party]
                })
                all_extents.push(
                        {
                            party:party,
                            extent:extent,
                            delta:extent[1]-extent[0]
                        }
                    );
            });
            
            var max_delta=d3.max(all_extents,function(d){
                return d.delta;
            });

            all_extents.forEach(function(d){
                d.new_extent=[];
                d.new_extent[0]=d.extent[0];
                d.new_extent[1]=d.extent[1]
                if(d.delta<max_delta) {
                    d.new_extent[0]-=(max_delta-d.delta)
                }
            })

            return all_extents
        }

        function cloneObj(obj) {
            return JSON.parse( JSON.stringify(obj));
        }
        var today=format.parse(data.sheets["RESULT"][0]["currentdate"]);
        //.new Date(new Date().setHours(0,0,0,0));
        var sparklinesData=data.sheets["Log Seats"].map(function(d){
                                  d.date=format.parse(d.logdate);
                                  return d;
                              })


        // IF IT IS NOT UPDATED TO TODAY: ADD DAYS WITH SAME VALUE TILL TODAY
        if(sparklinesData[sparklinesData.length-1].date<today) {
            
            var diff=d3.time.format("%j")(today) - d3.time.format("%j")(sparklinesData[sparklinesData.length-1].date);
            //console.log("MISSING DAYS",diff)

            d3.range(diff-1).forEach(function(d){
                
                console.log("add day",d,sparklinesData[sparklinesData.length-1])
                var new_day=cloneObj(sparklinesData[sparklinesData.length-1]);
                new_day.date=new Date(new_day.date);
                new_day.date.setDate(new_day.date.getDate()+1)
                console.log(new_day.date)
                sparklinesData.push(new_day);

            })
        }
        
        // IF THE LAST RECORDED IN THE LOG IS TODAY => REMOVE IT
        sparklinesData = sparklinesData.filter(function(d){
            return +d.date !=  (+today);
        })

        var dataLatest=(function(latest){
                            latest.logdate=format.parse(latest.date)

                            return latest;

                        }(data.sheets["RESULT"][0]));

        dataLatest.date=today;

        //console.log("OOOOO",dataLatest)

        // ADD THE VALUES FROM RESULT
        sparklinesData.push(dataLatest)

        //console.log(sparklinesData);

        

        var sparklines=[],
            i=0;
        parties.forEach(function(party){
            try {
                sparklines.push(
                    new Sparkline(sparklinesData,
                      {
                        container:"#seatsCharts",
                        n:Math.max(parties.length,4),
                        index:i,
                        fields:[party],
                        interpolate:"step-after",
                        extents:getExtents(sparklinesData).filter(function(d){
                            return d.party==party;
                        }).map(function(d){
                            return d.new_extent;
                        })[0],
                        weeks:4,
                        mouseOverCallback:function(d){
                            sparklines.forEach(function(c){
                                c.highlight(d);
                            })
                        },
                        mouseOutCallback:function(){
                            sparklines.forEach(function(c){
                                c.highlight();
                            })
                        }
                    })
                );
                i++;
            } catch(e){
                console.error("sparkline error");
            }
            
        })
    }

    function renderMainFlow(el,data) {

        var flowChart=new PollsOfPolls(data.sheets["RESULT"],{
            container:el,
            order:ORDER,
            height:280,
            top:150,
            margins:{
                left:0,
                top:30,
                right:0,
                bottom:0
            },
            additionalTriangle:{
                verticalPosition:150+80,
                orientation:1
            },
            triangle:1,
            ix:true,
            names:names,
            labelAlign:"bottom"
        })
        
        flowChart.addLastElections();
        flowChart.addFlows();

    }
    function renderFlows(data) {
        var parties=["con","lab","libdem","snp"];
        parties.forEach(function(party){
            var cons=new PollsOfPolls(data.sheets["RESULT"],{
                container:"#"+party+"Chart",
                order:ORDER,
                height:265,
                top:150,
                additionalTriangle:{
                    verticalPosition:150+80,
                    orientation:1
                },
                filter:[party],
                ix:false,
                names:names,
                notitle:true
            })
            cons.addLastElections();
            cons.addFlows();
            cons.addBalanceSheet(party);
        })
        
    }

    function renderDayByDay(el,data) {
        new DayByDay(data.sheets["vi-continuous-series"],{
            container:el,
            parties:["con","grn","lab","ldem","ukip"],
            termDic: { 
              con: "Con", lab: "Lab", ukip: "UKIP", ldem: "LD", grn: "Green", 
              YouGov: "YouGov", Populus: "Populus", "Lord Ashcroft": "Ashcroft", Opinium: "Opinium", 
              ComRes: "ComRes", ComResO: "ComRes Online", TNS: "TNS BMRB", ICM: "ICM", Ipsos: "Ipsos-MORI", Survation: "Survation" 
            },
            show:5
        })
    }


    return {
        render: render,
        renderMainFlow: renderMainFlow,
        renderFlows: renderFlows,
        renderDayByDay: renderDayByDay
    };
});
