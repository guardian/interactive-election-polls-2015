define([
    'd3'
], function(
    d3
) {
   'use strict';

    function render(el, context, config, mediator) {
        console.log(d3)
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);

        el.innerHTML = 'CHART';

    }

    return {
        render: render
    };
});