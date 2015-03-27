# Student Dashboard #

Projects depends on Node (JS runtime), Bower (browser javascript dependency manager), and Gulp (node-based task editor for building, executing tests, and so on).  Project includes Karma test runner and Jasmine test framework.  The client side application is developed in AngularJS and the server component is a node-based application using the Express web app framework. Available gulp commands used to run the server, tests and so on include:

### Gulp tasks

* `gulp` or `gulp build` to build an optimized version of the application in `/dist`
* `gulp serve` to launch a browser sync server on the source files
* `gulp serve:dist` to launch a server on the optimized application
* `gulp wiredep` to fill bower dependencies in the `.html` file(s)
* `gulp test` to launch the unit tests with Karma
* `gulp test:auto` to launch the unit tests with Karma in watch mode
* `gulp protractor` to launch the e2e tests with Protractor
* `gulp protractor:dist` to launch the e2e tests with Protractor on the dist files


### How do I get set up? ###

* Install the [node runtime](http://nodejs.org/) & add to path
* Once node is installed and on the path, run `npm install -g bower gulp`
* Go to the root of the repo and run `npm install && bower install`
* Change directory to the root of the project and experiment with the gulp commands!