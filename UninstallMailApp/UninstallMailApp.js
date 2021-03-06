// Upload just build task to VSTS...
// Upload extension VSTS...
// tfx extension create --manifest-globs .\vss-extension.json
// Upload to https://marketplace.visualstudio.com/manage/
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
// toolrunner help
// https://github.com/Microsoft/vsts-task-lib/blob/be60205671545ebef47d3a40569519da9b4d34b0/node/docs/vsts-task-lib.md
var q = require('q');
var tl = require('vsts-task-lib/task');
var fs = require('fs');
var xml2js = require('xml2js');
var ews = require('./lib/ews-soap/exchangeClient');
function run() {
    return __awaiter(this, void 0, q.Promise, function* () {
        try {
            var ewsConnectedServiceName = tl.getInput('ewsConnectedServiceName', true);
            var appManifestXmlPath = tl.getPathInput('appManifestXmlPath', true, true);
            // let appManifestXmlPath = "C:\\Work\\TFS\\VSTS Office Manifest Uploader\\InstallMailApp\\SampleManifest.xml";
            fs.readFile(appManifestXmlPath, 'utf8', function (err, data) {
                if (err) {
                    throw err;
                }
                var parser = new xml2js.Parser({
                    "explicitArray": false,
                    "explicitRoot": false,
                    "attrkey": "@"
                });
                parser.parseString(data, function (err, result) {
                    var appId = result["Id"];
                    tl.debug("app id:" + appId);
                    var serverUrl = tl.getEndpointUrl(ewsConnectedServiceName, true);
                    var ewsAuth = tl.getEndpointAuthorization(ewsConnectedServiceName, true);
                    var userName = ewsAuth['parameters']['username'];
                    var password = ewsAuth['parameters']['password'];
                    tl.debug("Initializing EWS client");
                    var client = new ews.EWSClient();
                    client.initialize({ url: serverUrl, username: userName, password: password }, function (err) {
                        if (err) {
                            throw err;
                        }
                        tl.debug("Calling UninstallApp SOAP request");
                        client.uninstallApp(appId, function (err) {
                            if (err) {
                                throw err;
                            }
                            else {
                                tl.debug("Success.");
                                tl.setResult(tl.TaskResult.Succeeded, "Successfully installed the app");
                            }
                        });
                    });
                });
            });
        }
        catch (err) {
            // handle failures in one place
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
