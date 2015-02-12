define([
    'json!data/sampleData.json',
    'iframe-messenger'
], function(
    sampleData,
    iframeMessenger
) {
   'use strict';

    function init(el, context, config, mediator) {
        // DEBUG: What we get given on boot
        console.log(el, context, config, mediator);

        // Load local JSON data
        console.log(sampleData);

        // Enable iframe resizing on the GU site
        iframeMessenger.enableAutoResize();
    }

    return {
        init: init
    };
});
