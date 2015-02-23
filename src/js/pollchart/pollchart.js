define([
    'd3',
    'underscore',
    'pollchart/test'
], function(
    d3,
    underscore,
    test
) {
   'use strict';

    function render(el, data) {
        //console.log(data);
        el.innerHTML = 'POLLCHART';
    }

    return {
        render: render
    };
});
