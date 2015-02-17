define([
    'chart/chart',
    'pollchart/pollchart',
    'text!templates/appTemplate.html'
], function(
    chartView,
    pollChart,
    templateHTML
) {
   'use strict';

    function init(el, context, config, mediator) {
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);
        console.log(pollChart);
        console.log(templateHTML);
        el.innerHTML = templateHTML;



        chartView.render(el.querySelector('#chart'));
        pollChart.render(el.querySelector('#pollchart'));
    }

    return {
        init: init
    };
});
