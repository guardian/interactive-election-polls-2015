define([
    'd3'
], function(
    d3
) {
   'use strict';

    function render(data, latest, updated) {
        

        var format=d3.time.format("%d/%m/%Y"),
            datetime_format=d3.time.format("%d/%m/%Y %H:%M:%S")

        var today = new Date(),
            electionDay = new Date(2015,4,7),
            diff = d3.time.format("%j")(electionDay) - d3.time.format("%j")(today);

        var lastupdate_date=datetime_format.parse(latest.currentdate+" "+latest.currenttime);            
        d3.select("#lastUpdate time")
            .text(d3.time.format("%b %d %Y %H:%m")(lastupdate_date)+" "+(!lastupdate_date.getTimezoneOffset()?"GMT":"BST"))


        data.forEach(function(d){
            d3.select("#title_"+d.component).text(d["title"])
            d3.select("#par_"+d.component).text(d["gloss"])    
        })

        var polls=[
            {
                p:"LAB",
                v:latest.lab
            },
            {
                p:"CON",
                v:latest.con
            },
            {
                p:"SNP",
                v:latest.snp
            },
            {
                p:"LD",
                v:latest.libdem
            },
            {
                p:"Ukip",
                v:latest.ukip
            },
            {
                p:"Green",
                v:latest.green
            }
        ];

        var poll_str="";
        polls.sort(function(a,b){
            return b.v - a.v;
        }).forEach(function(d,i){
            poll_str+=d.p+" "+d.v+(i===0?" seats":"")+(i<polls.length-1?" | ":"")
        });

        var default_status=d3.select("a[name=default]");
        default_status
            .attr("data-status",function(){
                var days=diff+" days to #GE2015"
                return default_status.attr("data-status")+(" http://gu.com/p/464t6")+"\n"+poll_str+"\n"+days;
            })

    }

    return {
        render: render
    };
});
