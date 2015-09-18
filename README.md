# EdPanel UI #

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

In order to actually interact with the UI in a meaningful way, you'll need to have the server side API running, which means installing, building and deploying `ScholarScore` project.  Default admin credentials to use on the login page are `mroper/admin`.

### What is the folder structure? ###

Within `src/` is the client code, html, styles, etc.  The main entry point to the angular app is in `src/app/index.js`.  All the individual directives, route controllers, and static assets can be found within `src/app/components/` in their respective folders.  I've tried to create one JS file per angular directive, controller, factory, or service defined.  For controllers, I've colocated the controller js code in a folder with its realted html template and .scss style file.

All top level folders other than `src` are either managed by NPM, bower, or gulp with the exception of the `/gulp` folder, which contains gulp config files that are maintained by us, the humans.