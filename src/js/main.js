define([
  'd3',
  'underscore',
  'chart/chart',
  'pollchart/pollchart',
  'text!templates/appTemplate.html'
], function(
  d3,
  underscore,
  chartView,
  pollChart,
  templateHTML
) {
  'use strict';

  function init(el, context, config, mediator) {
    // DEBUG: What we get given on boot
    //console.log(el, context, config, mediator);
    
    el.innerHTML = templateHTML;
    stickElementOnScroll();
    
    loadData(function(data){
      //chartView.render(el.querySelector('#chart'), data);
      pollChart.render(el.querySelector('#pollchart') ,data);
    })
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
  
  /* load json date */
  function loadData(callback) {
    var jsonSrc = "http://interactive.guim.co.uk/spreadsheetdata/1YilVzArect3kcE1rzJvYivXkfs1oL0MLCrvC9GjPF6E.json";
    d3.json(jsonSrc, function(err, data) {
      callback(data);
    });
  }

  return {
    init: init
  };
});
