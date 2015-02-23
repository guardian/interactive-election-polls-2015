define([
    'd3',
    'seatscharts/PollsOfPolls',
    'sparklines/sparklines'
], function(
    d3,
    PollsOfPolls,
    Sparkline
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
    
    

    function render(el,data) {
        //console.log(data);
        //el.innerHTML = 'POLLCHART';
        console.log(data);

        var projections=new PollsOfPolls(data.sheets["RESULT"],{
            container:el,
            order:["con","libdem","ukip","others","pc","green","snp","lab"],
            height:140,
            top:0,
            margins:{
                left:0,
                top:30,
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
        projections.addCoalitions("#coalitionsChart");

        // SPARKLINES
        var format=d3.time.format("%d/%m/%Y")
        data.sheets["Log Seats"]=data.sheets["Log Seats"].filter(function(d){
            return typeof d.logdate == "string"
        })
        
        var parties=["con","libdem","ukip","snp","lab"]
        
        
        
        function setExtents() {
            var all_extents=[];

            parties.forEach(function(party){
                var extent=d3.extent(data.sheets["Log Seats"],function(d){
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
        }
        
        setExtents();

        var sparklines=[],
            i=0;
        parties.forEach(function(party){
            sparklines.push(
                new Sparkline(data.sheets["Log Seats"].map(function(d){
                    //console.log(d.logdate)
                    //console.log(d3.time.format("%d/%m/%Y").parse(d.logdate))
                    d.date=format.parse(d.logdate);
                    return d;
                }),{
                    container:"#seatsCharts",
                    n:Math.max(parties.length,4),
                    index:i,
                    fields:[party],
                    interpolate:"step-after",
                    extents:d3.extent(data.sheets["Log Seats"],function(d){
                        return d[party]
                    }),
                    mouseOverCallback:function(d){
                        //console.log(d);
                        sparklines.forEach(function(c){
                            c.highlight(d);
                        })
                    },
                    mouseOutCallback:function(d){
                        //console.log(d);
                        sparklines.forEach(function(c){
                            c.highlight();
                        })
                    }
                })
            );
            i++;
        })
    }

    function renderMainFlow(el,data) {

        var flowChart=new PollsOfPolls(data.sheets["RESULT"],{
            container:el,
            order:["con","libdem","ukip","others","pc","green","snp","lab"],
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
    function renderFlows(el,data) {

    }


    return {
        render: render,
        renderMainFlow: renderMainFlow,
        renderFlows: renderFlows
    };
});
