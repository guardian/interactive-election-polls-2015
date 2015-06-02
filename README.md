# interactive-election2015-polls 
- [The Guardian poll projection](http://www.theguardian.com/politics/ng-interactive/2015/feb/27/guardian-poll-projection)
- [The Guardian poll projection - interactive sankey](http://interactive.guim.co.uk/2015/may/sankey-main/index.html)

## Getting started
If you haven't already installed [nodejs](http://nodejs.org/download/),
[grunt-cli](http://gruntjs.com/getting-started) and [bower](http://bower.io/)
then go do that first.

Next, install all the dependency packages and start the app:
```bash
> npm install
> bower install
> grunt
```

You can now view the example project running at http://localhost:9000/

## Installing additional libraries
If you need to use any additional libraries such as D3 or jquery then use:

`bower install d3 --save`

That will update the `bower.json` dependency file and allow requirejs to bundle
the library into the main js.

You can then require the library directly into your code via the define function:

```javascript
define(['d3', function(d3) {
  var chart = d3.box();
});
```

