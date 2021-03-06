let path = require("path");
let xml2js = require("xml2js");
let soap = require("soap");
let enumerable = require("linq");

export class EWSClient {
    private client: any = null;

    public initialize(settings, callback) {
        let endpoint = settings.url + "/EWS/Exchange.asmx";
        let url = path.join(__dirname, "Services.wsdl");

        soap.createClient(url, {}, (err, client) => {
            if (err) {
                return callback(err);
            }
            if (!client) {
                return callback(new Error("Could not create client"));
            }

            this.client = client;

            if (settings.token) {
                this.client.setSecurity(new soap.BearerSecurity(settings.token));
            }
            else {
                this.client.setSecurity(new soap.BasicAuthSecurity(settings.username, settings.password));
            }

            return callback(null);
        }, endpoint);
    }

    public installApp(manifest, callback) {
        if (!this.client) {
            return callback(new Error("Call initialize()"));
        }

        let soapRequest =
            "<tns:InstallApp xmlns:tns='http://schemas.microsoft.com/exchange/services/2006/messages'>" +
            "<tns:Manifest>" + manifest + "</tns:Manifest>" +
            "</tns:InstallApp>";

        this.client.InstallApp(soapRequest, (err, result, body) => {
            if (err) {
                if (result.statusCode && (result.statusCode == 401 || result.statusCode == 403))
                {
                    return callback("Unauthorized!");
                }
                return callback(err);
            }

            let parser = new xml2js.Parser(
                {
                    "explicitArray": false,
                    "explicitRoot": false,
                    "attrkey": "@"
                });

            parser.parseString(body, (err, result) => {
                let responseCode = result["s:Body"]["InstallAppResponse"]["ResponseCode"];

                if (responseCode !== "NoError") {
					try{
						let message = enumerable.from(result["s:Body"]["InstallAppResponse"]["MessageXml"]["t:Value"])
										.where(function(i){return i["@"]["Name"] === "InnerErrorMessageText";})
										.select(function(i){return i["_"];}).first();
					}catch(e){
						let message = "";
					}
					finally{		
						return callback(new Error(responseCode + ": " + JSON.stringify(message)));
					}
                }

                callback(null);
            });
        });
    };

    public uninstallApp(id, callback) {
        if (!this.client) {
            return callback(new Error("Call initialize()"));
        }

        let soapRequest =
            "<m:UninstallApp xmlns:m='http://schemas.microsoft.com/exchange/services/2006/messages'>" +
            "<m:ID>" + id + "</m:ID>" +
            "</m:UninstallApp>";

        this.client.UninstallApp(soapRequest, (err, result, body) => {
            if (err) {
                if (result.statusCode && (result.statusCode == 401 || result.statusCode == 403))
                {
                    return callback("Unauthorized!");
                }

                return callback(err);
            }

            let parser = new xml2js.Parser(
                {
                    "explicitArray": false,
                    "explicitRoot": false,
                    "attrkey": "@"
                });

            parser.parseString(body, (err, result) => {
                let responseCode = result["s:Body"]["UninstallAppResponse"]["ResponseCode"]

                if (responseCode !== "NoError") {
                    return callback(new Error(responseCode));
                }

                callback(null);
            });
        });
    };
}