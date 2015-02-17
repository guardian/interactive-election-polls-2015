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

    function render(el) {
        console.log(test);

        el.innerHTML = 'POLLCHART';

    }

    return {
        render: render
    };
});
