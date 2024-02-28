const {classTimeStreams} = require('./classes.js');

const fs = require('fs');
const express = require("express");
const cors = require('cors')
var configData = JSON.parse(fs.readFileSync('./aws-exports.json'));

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json())
                                                 

// AWS Variables
var AWS = require('aws-sdk');
AWS.config.update({region: configData.aws_region});
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var ts = new classTimeStreams();

//retries = { 'max_attempts': 10,'mode': 'standard'}
    
// Security Variables
const jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');
var request = require('request');
var pems;
var issCognitoIdp = "https://cognito-idp." + configData.aws_region + ".amazonaws.com/" + configData.aws_cognito_user_pool_id;



// Startup - Download PEMs Keys
gatherPemKeys(issCognitoIdp);



//--################################################################################################################
//--------------------------------------------  SECURITY 
//--################################################################################################################

//-- Gather PEMs keys from Cognito
function gatherPemKeys(iss)
{

    if (!pems) {
        //Download the JWKs and save it as PEM
        return new Promise((resolve, reject) => {
                    request({
                       url: iss + '/.well-known/jwks.json',
                       json: true
                     }, function (error, response, body) {
                         
                        if (!error && response.statusCode === 200) {
                            pems = {};
                            var keys = body['keys'];
                            for(var i = 0; i < keys.length; i++) {
                                //Convert each key to PEM
                                var key_id = keys[i].kid;
                                var modulus = keys[i].n;
                                var exponent = keys[i].e;
                                var key_type = keys[i].kty;
                                var jwk = { kty: key_type, n: modulus, e: exponent};
                                var pem = jwkToPem(jwk);
                                pems[key_id] = pem;
                            }
                        } else {
                            //Unable to download JWKs, fail the call
                            console.log("error");
                        }
                        
                        resolve(body);
                        
                    });
        });
        
        } 
    
    
}


//-- Validate Cognito Token
function verifyTokenCognito(token) {

   try {
        //Fail if the token is not jwt
        var decodedJwt = jwt.decode(token, {complete: true});
        if (!decodedJwt) {
            console.log("Not a valid JWT token");
            return {isValid : false, session_id: ""};
        }
        
        
        if (decodedJwt.payload.iss != issCognitoIdp) {
            console.log("invalid issuer");
            return {isValid : false, session_id: ""};
        }
        
        //Reject the jwt if it's not an 'Access Token'
        if (decodedJwt.payload.token_use != 'access') {
            console.log("Not an access token");
            return {isValid : false, session_id: ""};
        }
    
        //Get the kid from the token and retrieve corresponding PEM
        var kid = decodedJwt.header.kid;
        var pem = pems[kid];
        if (!pem) {
            console.log('Invalid access token');
            return {isValid : false, session_id: ""};
        }

        const decoded = jwt.verify(token, pem, { issuer: issCognitoIdp });
        return {isValid : true, session_id: ""};
    }
    catch (ex) { 
        console.log("Unauthorized Token");
        return {isValid : false, session_id: ""};
    }
    
};






//--######################## API SECTION ###########################

//--++ API : GENERAL : Get Importer Process
app.get("/api/aws/metric/analyzer/clw/get/imports/", async (req, res) => {

    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);

    if (cognitoToken.isValid === false)
        return res.status(511).send({ data: [], message : "Token is invalid"});
 
    const params = req.query;
    
    try {

            const paramsList = {
                  
                  FilterExpression: "user_id = :user_id",
                  ExpressionAttributeValues: {
                    ":user_id": {S: params.userId}
                  },
                  //ProjectionExpression: "Season, Episode, Title, Subtitle",
                  TableName: params.tableName,
            };

            
            ddb.scan(paramsList, function(err, data) {
                  if (err) {
                        console.log(err);
                        res.status(401).send({ items : []});
                  } else {
                        var items = [];
                        data.Items.forEach(function (element, index, array) {
                            items.push({ 
                                        "user_id" : element.user_id.S,
                                        "resource_id" : element.resource_id.S,
                                        "exp_id" : element.exp_id.S,
                                        "imp_id" : element.imp_id.S,
                                        "resource_type" : element.resource_type.S,
                                        "resource_name" : element.resource_name.S,
                                        "region" : element.region.S,
                                        "interval" : element.interval.S,
                                        "period" : element.period.S,
                                        "start_date" : element.start_date.S,
                                        "end_date" : element.end_date.S,
                                        "metadata" : element.metadata.S,
                            });
                        });
                        res.status(200).send({ items : items })
                  }
            });
            
            

    }
    catch (err) {
        console.log(err);
        res.status(401).send("API Failed");
    }
    
});


//--++ API : GENERAL :  Gather Import Details
app.get("/api/aws/metric/analyzer/clw/get/import/details/", async (req, res) => {

    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);

    if (cognitoToken.isValid === false)
        return res.status(511).send({ data: [], message : "Token is invalid"});
 
    const params = req.query;
    
    try {

            const paramsList = {
                  TableName: params.tableName,
                  Key: {
                    'user_id': {S: params.userId },'resource_id': {S: params.resourceId },
                  }
            };

            
            ddb.getItem(paramsList, function(err, data) {
                  if (err) {
                        console.log(err);
                        res.status(401).send({ item : {} });
                  } else {
                        
                        var item = {};
                        try {
                            item = { 
                                "userId" : data.Item.user_id.S,
                                "resourceId" : data.Item.resource_id.S,
                                "expId" : data.Item.exp_id.S,
                                "impId" : data.Item.imp_id.S,
                                "resourceType" : data.Item.resource_type.S,
                                "resourceName" : data.Item.resource_name.S,
                                "region" : data.Item.region.S,
                                "interval" : data.Item.interval.S,
                                "period" : data.Item.period.S,
                                "startDate" : data.Item.start_date.S,
                                "endDate" : data.Item.end_date.S,
                                "metadata" : JSON.parse(data.Item.metadata.S.replace(/'/g, '"')),
                             
                            };
                        }
                        catch (err) {
                            console.log(err);
                        }
                        res.status(200).send({ item : item })
                  }
            });

    }
    catch (err) {
        console.log(err);
        res.status(401).send("API Failed");
    }
    
});


//--++ API : GENERAL :  Gather Import Details
app.get("/api/aws/metric/analyzer/clw/get/metric/catalog/", async (req, res) => {

    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);

    if (cognitoToken.isValid === false)
        return res.status(511).send({ data: [], message : "Token is invalid"});
 
    const params = req.query;
    
    try {

            const paramsList = {
                  TableName: params.tableName,
                  Key: {
                    'id': {S: params.engine },
                  }
            };

            
            ddb.getItem(paramsList, function(err, data) {
                  if (err) {
                        console.log(err);
                        res.status(401).send({ item : {} });
                  } else {
                        
                        var item = {};
                        try {
                            item = { 
                                "metricList" : JSON.parse(data.Item.metricList.S), 
                            };
                        }
                        catch (err) {
                            console.log(err);
                        }
                        res.status(200).send({ item : item })
                  }
            });

    }
    catch (err) {
        console.log(err);
        res.status(401).send("API Failed");
    }
    
});

//--++ API : GENERAL :  Gather Metric Details
app.get("/api/aws/metric/analyzer/clw/get/metric/details/", async (req, res) => {

    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);

    if (cognitoToken.isValid === false)
        return res.status(511).send({ data: [], message : "Token is invalid"});
 
    const params = req.query;
    
    try {

            const paramsList = {
                  TableName: params.tableName,
                  Key: {
                    'service': {S: params.service },'metric': {S: params.metric },
                  }
            };
            
            
            ddb.getItem(paramsList, function(err, data) {
                  if (err) {
                        console.log(err);
                        res.status(401).send({ item : {} });
                  } else {
                        
                        var item = {};
                        try {
                            item = { 
                                "type" : data?.Item?.type?.S,
                                "ratio" : data?.Item?.ratio?.S,
                                "description" : data?.Item?.description?.S,
                                "advise" : data?.Item?.advise?.S,
                                "unit" : data?.Item?.unit?.S
                            };
                        }
                        catch (err) {
                            console.log(err);
                        }
                        res.status(200).send({ item : item })
                  }
            });

    }
    catch (err) {
        console.log(err);
        res.status(401).send("API Failed");
    }
    
});




//--++ API : TIMESTREAM :  Execute Query
app.get("/api/aws/metric/analyzer/timestream/execute/query/", async (req, res) => {

    // Token Validation
    var cognitoToken = verifyTokenCognito(req.headers['x-token-cognito']);

    if (cognitoToken.isValid === false)
        return res.status(511).send({ data: [], message : "Token is invalid"});
 
    const params = req.query;
    
    try {
            
            var records = await ts.executeQuery({ query : params.sqlQuery });
            
            res.status(200).send({ records : records });
    }
    catch (err) {
        console.log(err);
        res.status(401).send("API Failed");
    }
    
});










//--################################################################################################################
//--------------------------------------------  APP GENERAL
//--################################################################################################################



app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});


