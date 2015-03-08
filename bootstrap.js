"use strict";

/*
Adapted from NewsBlur Frame Options Defeater https://github.com/arantius/nbfod
*/

var {classes: Cc, interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

function FrameOptionsDefeater()
{
    this.allowedHosts = {};
    Services.obs.addObserver(this, 'xpcom-shutdown', true);
    this._registerHttpObservers();

    this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.xframeoptionsdefeater.");
    this.prefs.addObserver("", this, false);
    
    this.parseHosts();
}

FrameOptionsDefeater.prototype =
{

    QueryInterface: XPCOMUtils.generateQI(
        [Ci.nsIObserver, Ci.nsISupportsWeakReference, Ci.nsIWeakReference]),

    QueryReferent: function(iid) this.QueryInterface(iid),

    GetWeakReference: function() this,

    _registerHttpObservers: function _registerHttpObservers() {
        Services.obs.addObserver(this, 'http-on-examine-response', true);
        Services.obs.addObserver(this, 'http-on-examine-cached-response', true);
    },

    _unregisterHttpObservers: function _unregisterHttpObservers() {
        Services.obs.removeObserver(this, 'http-on-examine-response');
        Services.obs.removeObserver(this, 'http-on-examine-cached-response');
    },

    shutdown: function()
    {
        this._unregisterHttpObservers();
        Services.obs.removeObserver(this, 'xpcom-shutdown');
        this.prefs.removeObserver("", this);
    },

    observe: function observe(subject, topic, data)
    {
        switch(topic) {
        case 'xpcom-shutdown':
          this.shutdown();
          break;
        case 'http-on-examine-response':
        case 'http-on-examine-cached-response':
          this.observeResponse(subject, topic, data);
          break;
        case 'nsPref:changed':
          this.parseHosts();
          break;
        }
    },

    observeResponse: function observeResponse(channel, topic, data)
    {
        channel.QueryInterface(Ci.nsIHttpChannel);
        var location = channel.notificationCallbacks
            .getInterface(Ci.nsILoadContext)
            .associatedWindow
            .top
            .location;
        if (location.host in this.allowedHosts ) {
            channel.setResponseHeader(
                'X-Frame-Options', 'ALLOW-FROM ' + location.protocol + '//' + location.host, false);
        }
    },

    parseHosts: function()
    {
        // hosts are seperated by ',' or '\n'.
        var hosts = this.prefs.getCharPref("hosts").replace(/,/g, '\n').split('\n');
        this.allowedHosts = {};
        for ( var i = 0; i < hosts.length; i ++ ) {
           var host = hosts[i].trim();
           if (host != '') {
               this.allowedHosts[ host ] = 1;
           }
        }
    }
  
};

var frameOptionsDefeater = null;

function startup()
{
    frameOptionsDefeater = new FrameOptionsDefeater();
}

function shutdown()
{
    frameOptionsDefeater && frameOptionsDefeater.shutdown();
}

function install() {}

function uninstall() {}

