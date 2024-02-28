// AWS Config Variables
const fs = require('fs');
var configData = JSON.parse(fs.readFileSync('./aws-exports.json'));


// AWS Variables
var AWS = require('aws-sdk');
AWS.config.update({region: configData.aws_region});

//var tsClient = new AWS.ElastiCache();
const { TimestreamQueryClient, QueryCommand } = require("@aws-sdk/client-timestream-query"); // CommonJS import

//import {CancelQueryCommand, QueryCommand} = require("@aws-sdk/client-timestream-query"); 


class classTimeStreams {

        constructor(object) { 
                 
                 this.queryClient = new TimestreamQueryClient({
                        region: "us-east-1"
                 });
 
          }
        
        /* --- ORIGINAL V3
        async executeQuery(object){

                
                var records = [];
                const params = new QueryCommand({
                        QueryString: object.query,
                        //MaxRows : 200
                    });
        
        
                const getAllRows = async (queryClient, query, nextToken) => {
                    
                
                    if (nextToken) {
                        params.input.NextToken = nextToken
                    }
                
                    await queryClient.send(params).then(
                            async (response) => {
                                records = records.concat(this.parseQueryResult(response));
                                if (response.NextToken) {
                                    await getAllRows(queryClient, query, response.NextToken);
                                }
                            },
                            (err) => {
                                console.error("Error while querying:", err);
                            });
                }
                
                await getAllRows(this.queryClient, object.query, null);
                return records; 
        
        }
        */
        
        async executeQuery(object){

                
                var records = [];
                const params = new QueryCommand({
                        QueryString: object.query,
                        //MaxRows : 200
                    });
        
        
                const getAllRows = async (queryClient, query, nextToken) => {
                    
                
                    if (nextToken) {
                        params.input.NextToken = nextToken
                    }
                
                    await queryClient.send(params).then(
                            async (response) => {
                                records = records.concat(this.parseQueryResult(response));
                                if (response.NextToken) {
                                    await getAllRows(queryClient, query, response.NextToken);
                                }
                            },
                            (err) => {
                                console.error("Error while querying:", err);
                            });
                }
                
                await getAllRows(this.queryClient, object.query, null);
                return records; 
        
        }
        
        
        parseQueryResult(response) {
            const columnInfo = response.ColumnInfo;
            const rows = response.Rows;
            
            var results = [];
            rows.forEach(row => {
                results.push(this.parseRow(columnInfo, row));
            });
            return results;
        }
        
        
        parseRow(columnInfo, row) {
            const data = row.Data;
            var rowOutput = {};
        
            var i;
            for ( i = 0; i < data.length; i++ ) {
                let info = columnInfo[i];
                let datum = data[i];
                rowOutput = {...rowOutput, ...this.parseDatum(info, datum)};
            }
        
            return rowOutput;
        }
        
        parseDatum(info, datum) {
            if (datum.NullValue != null && datum.NullValue === true) {
                return { [info.Name] : null } ;
            }
        
            const columnType = info.Type;
        
            // If the column is of TimeSeries Type
            if (columnType.TimeSeriesMeasureValueColumnInfo != null) {
                return this.parseTimeSeries(info, datum);
            }
            // If the column is of Array Type
            else if (columnType.ArrayColumnInfo != null) {
                const arrayValues = datum.ArrayValue;
                return `${info.Name} : ${this.parseArray(info.Type.ArrayColumnInfo, arrayValues)}`;
            }
            // If the column is of Row Type
            else if (columnType.RowColumnInfo != null) {
                const rowColumnInfo = info.Type.RowColumnInfo;
                const rowValues = datum.RowValue;
                return this.parseRow(rowColumnInfo, rowValues);
            }
            // If the column is of Scalar Type
            else {
                return this.parseScalarType(info, datum);
            }
        }
        
        parseTimeSeries(info, datum) {
            const timeSeriesOutput = [];
            datum.TimeSeriesValue.forEach(function (dataPoint) {
                timeSeriesOutput.push(`{time : "${dataPoint.Time}", value=${this.parseDatum(info.Type.TimeSeriesMeasureValueColumnInfo, dataPoint.Value)}}`)
            });
        
            return `[${timeSeriesOutput.join(", ")}]`
        }
        
        parseScalarType(info, datum) {
            return {[info.Name] : datum.ScalarValue };
        }
        
        parseArray(arrayColumnInfo, arrayValues) {
            const arrayOutput = [];
            arrayValues.forEach(function (datum) {
                arrayOutput.push(this.parseDatum(arrayColumnInfo, datum));
            });
            return `[${arrayOutput.join(", ")}]`
        }

        
        

        
}

module.exports = {classTimeStreams};



                