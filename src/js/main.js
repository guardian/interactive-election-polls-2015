define([
  'underscore',
  'chart/chart',
  'pollchart/pollchart',
  'text!templates/appTemplate.html'
], function(
  underscore,
  chartView,
  pollChart,
  templateHTML
) {
  'use strict';

  function init(el, context, config, mediator) {
    // DEBUG: What we get given on boot
    //console.log(el, context, config, mediator);
    //console.log(pollChart);
    //console.log(templateHTML);
    el.innerHTML = templateHTML;
    stickElementOnScroll();

    chartView.render(el.querySelector('#chart'));
    pollChart.render(el.querySelector('#pollchart'));
  }

  /* stick element (time and party labels) to top on scroll */
  function stickElementOnScroll() {
    var el = document.querySelector("#stickyRow"),
        offset = el.offsetTop;
    
    window.onscroll = _.throttle(stickIfNeeded, 100);
    
    function stickIfNeeded() {
      if (offset <= window.pageYOffset) {
        el.classList.add("l-stick");
      } else {
        el.classList.remove("l-stick");
      }
    }
  }

  return {
    init: init
  };
});
