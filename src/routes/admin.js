/* jshint node: true */
var logger = require("../logger/logger");
var express = require('express');
var pkg = require('../package');
var config = require('../config.json');
var router = express.Router();
var clearDb = require('../db/clearDb');
var userHelper = require('../services/userHelper.js');
var statHelper = require('../services/statHelper.js');

var wrap = require('co-express');

var mongoose = require('../config/db.js').mongoose;
var sysDefault = mongoose.model('SystemDefaults', require('../models/systemDefaults'));
var userHelper = require('../services/userHelper');
var messageHelper = require('../services/messageHelper');
var userMessage = mongoose.model('UserMessage', require('../models/userMessage'));
var systemMessage = mongoose.model('SystemMessage', require('../models/systemMessage'));

module.exports = function(app, passport) {
    app.get('/admin',
        function(req, res, next) {
            if (userHelper.auth(req, res, app.locals.site, true)) {
                req = userHelper.processUser(req);
                res.render('admin/admin', { site: app.locals.site, user: req.user, req: req });
            }
        }
    );

    /* istanbul ignore next */
    app.get('/admin/resetdb',
        function(req, res, next) {
            if (userHelper.auth(req, res, app.locals.site, true)) {
                req = userHelper.processUser(req);
                logger.warn("started db reset");
                /*clearDb.go();*/
                require('../db/seedDb');
                req.flash('warn', 'database reset');
                res.redirect(req.session.returnTo || '/');
            }
        }
    );

    app.get('/admin/system-defaults',
        function(req, res, next) {
            /* istanbul ignore next */
            if (userHelper.auth(req, res, app.locals.site, true)) {
                req = userHelper.processUser(req);
                res.render('admin/system-defaults', { site: app.locals.site, user: req.user, req: req });
            }
        }
    );

    app.post('/admin/system-defaults',
        function(req, res, next) {
            /* istanbul ignore next */
            if (userHelper.auth(req, res, app.locals.site, true)) {
                req = userHelper.processUser(req);
                //update system defaults and then re-render the page

                sysDefault.findOne({}).exec(function(err, defaults) { //there should only be one set of defaults
                    if (err) throw err; //TODO: FIX

                    /* istanbul ignore next */
                    if (req.body && defaults) {
                        if (req.body.defaultTheme) {
                            defaults.DefaultTheme = req.body.defaultTheme;
                        }
                        if (req.body.title) {
                            defaults.Title = req.body.title;
                        }
                        if (req.body.defaultProfilePictureURL) {
                            defaults.DefaultProfilePictureURL = req.body.defaultProfilePictureURL;
                        }
                        if (req.body.defaultBookPictureURL) {
                            defaults.DefaultBookPictureURL = req.body.defaultBookPictureURL;
                        }
                        if (req.body.defaultBrandingText) {
                            defaults.DefaultBrandingText = req.body.defaultBrandingText;
                        }

                        app.locals.site.defaults = defaults;
                        defaults.save();
                        req.flash('warn', 'updated system defaults.');
                        res.render('admin/system-defaults', { site: app.locals.site, user: req.user, req: req });
                    }
                });
            }
        }
    );

    app.get('/admin/system-information',
        function(req, res, next) {
            if (userHelper.auth(req, res, app.locals.site, true)) {
                //use socket.io
                //TODO: get mongo info
                //TODO: get node server info https://nodejs.org/en/docs/guides/simple-profiling/

                /*statHelper.vmstat();*/

                var info = require('simple-node-info');
                req = userHelper.processUser(req);
                var sysinfo = info.getStat();
                res.render('admin/sys-info', { site: app.locals.site, user: req.user, sysinfo: sysinfo, socketvar: 'load averages', jquery: true, socket: true, req: req });
            }
        }
    );

    app.get('/admin/system-message',
        function(req, res, next) {
            if (userHelper.auth(req, res, app.locals.site, true)) {
                req = userHelper.processUser(req);
                res.render('admin/system-message', { site: app.locals.site, user: req.user, req: req });
            }
        }
    );


    app.post('/admin/system-message', function(req, res, next) {
        if (userHelper.auth(req, res, app.locals.site)) {
            req.user.isMain = true;
            req = userHelper.processUser(req);


            var iSystemMessage = new systemMessage({
                message: req.body.message,
                date: new Date(),
                priority: req.body.priority,
                adminId: req.user._id
            });
            iSystemMessage.save();

            logger.warn("created system message");

            req.flash('success', "created system message");
            res.redirect(req.session.returnTo || '/');
        }
    });
};
