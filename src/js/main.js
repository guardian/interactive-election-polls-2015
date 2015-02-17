define([
    'chart/chart',
    'text!templates/appTemplate.html'
], function(
    chartView,
    templateHTML
) {
   'use strict';

    function init(el, context, config, mediator) {
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);
        console.log(templateHTML);
        el.innerHTML = templateHTML;



        chartView.render(el.querySelector('#chart'));
    }

    return {
        init: init
    };
});
