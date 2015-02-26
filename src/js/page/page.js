define([
    'd3'
], function(
    d3
) {
   'use strict';

    function render(data, updated) {
        //console.log(data);
        //Feb 16 2015 16:32 GMT

        d3.select("#lastUpdate time")
            .text(d3.time.format("%b %d %Y %H:%m")(new Date(updated))+" GMT")

        data.forEach(function(d){
            d3.select("#title_"+d.component).text(d["title"])
            d3.select("#par_"+d.component).text(d["gloss"])    
        })

    }

    return {
        render: render
    };
});
