
############################|-       Import Section     -|####################################

import json
import os
import subprocess
import time

from datetime import date, datetime, timedelta
import boto3
from botocore.exceptions import ClientError
import pandas as pd
import uuid


#from typing import Any, Dict, Union, cast, Optional



############################|-
############################|-       Class : classFile     -|####################################
############################|-


class classFile():
    
    def __init__(self):
        # store the event
        pass
        
    def write_all(self,params):
        file_object = open(params["file_name"], params["open_mode"])
        file_object.write(params["content"])
        file_object.close()
        
    
    def write_json(self,params):
        file_object = open(params["file_name"], params["open_mode"])
        json.dump(
                    params["content"],
                    file_object,
                )
        file_object.close()
    
    
    def create_folder(self,path):
        if not os.path.exists(path):
            os.mkdir(path)
        else:
            pass

    def read_all(self, params):
        file = open(params['file_name'])
        content = file.read()
        file.close()
        return content
    
    def clean_directory(self,directory):
        # Clean-up output folder
        subprocess.call(
            ["rm", "-rf", directory],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
        )
        
    def compress_directory(self,directory, archive_uid):
        archive_file = archive_uid + ".tar.gz"
        print("Creating archive file : " + archive_file)
        subprocess.call(
                        [
                            "tar",
                            "-zcvf",
                            f"./{archive_file}",
                            directory,
                        ],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.STDOUT,
        )
        
        return archive_file

        


############################|-
############################|-       Class : classCloudwatchExporter     -|####################################
############################|-


class classCloudwatchExporter():
    
    # constructor
    def __init__(self, params):
        self.session = boto3.Session(region_name=params["region"])
        self.cw_client = self.session.client("cloudwatch")
        self.pi_client = self.session.client("pi")
        self.file = classFile()
        self.output_path = "output/"
        self.file.create_folder(self.output_path)
        
        
    def format_dimension(self, dimensions: list ) -> list:
        dimension_result = []
        for dimension in dimensions:
            dimension_result.append({"Name": dimension['name'], "Value": f"{dimension['value']}"})
        return dimension_result
    

    def dataframe_name(self, dimensions: dict) -> str:
        name = ""
        for dimension in dimensions:
            name = name +  dimension["Value"] + "."
        return name[:-1]
        
    
    def format_metric_query(  
        self, 
        namespace : str,
        metrics: dict,  
        dimension: dict,
        periods: list = [60, 300],  
    ) -> dict:
        metric_data_query = []
        for period in periods:
            for metric in metrics:
                metric_data_query.append(
                    {
                        "Id": metric["metric_name"].lower(),
                        "MetricStat": {
                            "Metric": {
                                "Namespace": namespace,
                                "MetricName": metric["metric_name"],
                                "Dimensions": dimension,
                            },
                            "Period": period,
                            "Stat": metric["stat"],
                        },
                        "Label": metric["metric_name"],
                        "ReturnData": True,
                    }
                )
        return metric_data_query
    
    
    def get_metric_data(  
        self, 
        namespace : str,
        metrics: dict,  
        dimension: dict,
        period: int,
        interval : int,
        metadata : dict,
    ) -> dict:  
        try:
            start_date, end_date = self.get_start_end_date(period)
            results = {}
            metric_data_query = self.format_metric_query(namespace,metrics, dimension, [period])
            response = self.cw_client.get_metric_data(
                MetricDataQueries=metric_data_query,
                StartTime=start_date,
                EndTime=end_date
            )
    
            for metric in response["MetricDataResults"]:
                results[metric["Label"]] = {"Timestamps": [], "Values": []}
                results[metric["Label"]]["Values"] += metric["Values"]
                results[metric["Label"]]["Timestamps"] += metric["Timestamps"]
            while "NextToken" in response:
                response = self.cw_client.get_metric_data(
                    MetricDataQueries=metric_data_query,
                    StartTime=start_date,
                    EndTime=end_date,
                    NextToken=response["NextToken"],
                )
                for metric in response["MetricDataResults"]:
                    results[metric["Label"]]["Values"] += metric["Values"]
                    results[metric["Label"]]["Timestamps"] += metric["Timestamps"]
    
            time_series_pd = []
            for res in results:
                time_series_pd.append(
                    pd.Series(
                        results[res]["Values"],
                        name=res,
                        dtype="float64",
                        index=results[res]["Timestamps"],
                    )
                )
    
            result = pd.concat([i for i in time_series_pd], axis=1)
            
            if result.empty:
                return_value = {
                    "name": self.dataframe_name(dimension), 
                    "dimensions" : dimension, 
                    "metadata": metadata, 
                    "df": None, 
                    "is_null": True
                }
            else:
                # result.index = pd.to_datetime(result.index)
                # https://github.com/pandas-dev/pandas/issues/39537
                result.index = pd.to_datetime(result.index).tz_convert("UTC")
                result = result.fillna(0)
                return_value = {
                    "name": self.dataframe_name(dimension),
                    "dimensions" : dimension,
                    "metadata": metadata,
                    "df": result.to_json(orient="table"),
                    "is_null": False
                }
            return return_value
            
        except self.cw_client.exceptions.InvalidParameterValueException as e:
            print(e)
            print(metrics)
            pass
        except self.cw_client.exceptions.InternalServiceFault as e:
            print(e)
            print(metrics)
            pass
        
        except Exception as error:
            print("An exception occurred:", error)
            pass
        
    
    def get_pi_metrics(self, resource_id, start_date, end_date):
        response = self.pi_client.get_resource_metrics(
                                                    ServiceType='RDS',
                                                    Identifier=resource_id,
                                                    MetricQueries=[
                                                        {
                                                            'Metric': 'db.load.avg',
                                                            'GroupBy': {
                                                                'Group': 'db.wait_event'
                                                            }
                                                        },
                                                    ],
                                                    StartTime=datetime(2024, 1, 22),
                                                    EndTime=datetime(2024, 1, 24),
                                                    PeriodInSeconds=60
        )
        return(response)
    
    
    def get_start_end_date(self, interval: int) -> str:
        end_date = datetime.now() - timedelta(minutes=15)
        time_delta = timedelta(days=interval)
        start_date = end_date - time_delta
        return start_date.isoformat(), end_date.isoformat()
        
    
    def replace_template_parameters(self, parameters, template) -> str:
        for parameter in parameters:
            template = template.replace(parameter['name'], parameter['value'])
        return template
    
    
    def get_metrics(self, template, properties ):
        metric_list = json.loads(template)
        for metric in metric_list['metrics']:
            result = self.get_metric_data(
                            metric['namespace'], 
                            metric['metrics'], 
                            metric['dimensions'], 
                            metric['period'], 
                            metric['interval'],
                            { "properties" :  properties }
            )
            self.file.write_json({ "file_name" : self.output_path + self.get_uid(12) + ".mt", "open_mode" : "w", "content" : result })
            
    def get_uid(self,length):
        return str(uuid.uuid4())[:length]
        
    
    


############################|-
############################|-       Class : classDynamoDB     -|####################################
############################|-

class classDynamoDB():
    
    # constructor
    def __init__(self, params):
        self.tables = []
        self.region = params["region"]
        self.period = params["period"]
        self.interval = params["interval"]
        self.indexes = [] 
        self.client = boto3.Session().client("dynamodb",region_name=self.region)
        self.file = classFile()
        self.clw = classCloudwatchExporter({ "region" : self.region})
        self.output_path = "output/"
        self.object_class = "dynamodb"
        self.export_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        for table in params["tables"]:
            self.tables.append({ "name" : table, "uid" : self.clw.get_uid(24) })    
        
        
    def gather_metadata(self,table,uid):
        result = self.client.describe_table(TableName=table)
        for index in result['Table']['GlobalSecondaryIndexes']:
            self.indexes.append({ "table_name" : table, "index_name" : index["IndexName"], "uid" : uid })
        return result
        
    
    def export_metrics(self):
        print("--#| Exporting metrics")
        self.file.clean_directory(self.output_path)
        self.file.create_folder(self.output_path)
        
        # Export Information
        start_date, end_date = self.clw.get_start_end_date(int(self.interval))
        export_parameters = { 
                            "exportId" : self.export_id, 
                            "exportClass" : self.object_class,
                            "objects" : self.tables,
                            "region" : self.region,
                            "interval" : self.interval, 
                            "period" : self.period, 
                            "startDate" : start_date, 
                            "endDate" : end_date
        }
        
        # Gather Metadata
        metadata = []
        for table in self.tables:
            metadata.append(
                                {
                                "resourceType" : self.object_class, 
                                "resourceName" : table['name'], 
                                "resourceId" : table['uid'], 
                                "resourceDefinition" : self.gather_metadata(table['name'],table['uid']) 
                                }
            )
        self.file.write_all({ "file_name" : self.output_path + "metadata.json", "open_mode" : "w", "content" : json.dumps({ "exportParameters" : export_parameters, "metadata" : metadata}, indent=4, default=self.default) })
        
        
        # Gather Metrics - Tables
        table_template = self.file.read_all({"file_name" : 'templates/dynamodb.table.json' })
        for table in self.tables:
            print("Processing Object : Table : ",table['name'] )
            template = self.clw.replace_template_parameters(
                                                            [
                                                                { "name" :  "<table_name>", "value" : table['name'] },
                                                                { "name" :  "<period>", "value" : self.period },
                                                                { "name" :  "<interval>", "value" : self.interval },
                                                            ],
                                                            table_template
            )
            properties = [
                            { "Name" : "ObjectType", "Value" : "DynamoDBTable" }, 
                            { "Name" : "LevelType", "Value" : "table"  },
                            { "Name" : "Uid", "Value" : table['uid']  },
                            { "Name" : "GlobalSecondaryIndexName", "Value" : 'base'  },
                            
            ]
            self.clw.get_metrics(template, properties)
            
        
        # Gather Metrics - Indexes
        index_template = self.file.read_all({"file_name" : 'templates/dynamodb.index.json' })
        for index in self.indexes:
            print("Processing Object : Index : ",index['table_name'], ".",  index['index_name'])
            template = self.clw.replace_template_parameters(
                                                            [
                                                                    { "name" :  "<table_name>", "value" : index['table_name'] }, 
                                                                    { "name" :  "<index_name>", "value" : index['index_name'] },
                                                                    { "name" :  "<period>", "value" : self.period },
                                                                    { "name" :  "<interval>", "value" : self.interval },
                                                            ],
                                                            index_template
                                                            )
            properties = [
                            { "Name" : "ObjectType", "Value" : "DynamoDBIndex" }, 
                            { "Name" : "LevelType", "Value" : "gsi"  },
                            { "Name" : "Uid", "Value" : table['uid']  }
            ]
            self.clw.get_metrics(template,properties)
            
        
        archive_file_id = self.file.compress_directory(self.output_path, self.export_id + "." + self.object_class)
        return archive_file_id
        
        
    def default(self,o):
        if isinstance(o, (date, datetime)):
            return o.isoformat()
        



    
############################|-
############################|-       Class : classEC2     -|####################################
############################|-

class classEC2():
    
    # constructor
    def __init__(self, params):
        self.client = boto3.client('ec2', region_name=params["region"])
        
        
    
    def gather_instance_type(self,instance_type):
        result = self.client.describe_instance_types(InstanceTypes=[instance_type])
        return result





############################|-
############################|-       Class : classRDS     -|####################################
############################|-

class classRDS():
    
    # constructor
    def __init__(self, params):
        # parameters assigment
        self.instances = params["instances"]
        self.period = params["period"]
        self.interval = params["interval"]
        # objects initialization
        self.client = boto3.Session().client("rds",region_name=params["region"])
        self.file = classFile()
        self.clw = classCloudwatchExporter({ "region" : params["region"]})
        self.ec2 = classEC2({ "region" : params["region"]})
        self.output_path = "output/"
        self.object_class = "rds"
        self.export_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
    
    def gather_metadata(self,instance):
        info = self.client.describe_db_instances(DBInstanceIdentifier=instance)
        instance_type = self.ec2.gather_instance_type(info['DBInstances'][0]['DBInstanceClass'].replace("db.",""))
        result = {**info, **instance_type}
        return result
        
    
    def gather_cloudwatch_metrics(self, template, object_name, object_type):
        data = json.loads(template)
        metadata = { "properties" :  [{ "Name" : "InstanceName", "Value" : object_name }, { "Name" : "ObjectType", "Value" : object_type }] }
        uid = 1
        for metric in data['metrics']:
            result = self.clw.get_metric_data(
                            metric['namespace'], 
                            metric['metrics'], 
                            metric['dimensions'], 
                            metric['period'], 
                            metric['interval'],
                            metadata
            )
            self.file.write_json({ "file_name" : self.output_path + object_name + "." + str(uid) + ".metric", "open_mode" : "w", "content" : result })
            uid = uid + 1
    
        
    def export_metrics(self):
        
        print("--#| Exporting metrics")
        # Clean-up output folder
        subprocess.call(
            ["rm", "-rf", "output"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT,
        )

        self.file.create_folder(self.output_path)
        
        # Gather Metadata
        resources = []
        template = self.file.read_all({"file_name" : 'templates/rds.json' })
        start_date, end_date = self.clw.get_start_end_date(int(self.interval))
        export_parameters = { "ExportParameters" : { "interval" : self.interval, "period" : self.period, "startDate" : start_date, "endDate" : end_date  } }
        
        for instance in self.instances:
            print("Processing Object : " + self.object_class + "."+ instance)
            instance_info = self.gather_metadata(instance)
            resources.append({ "exportId" : self.export_id, "resourceType" : "rds" , "resourceName" : instance , "resourceList" : instance, "metadata" : { **instance_info, **export_parameters } })
            self.gather_cloudwatch_metrics(((template.replace("<instance>",instance)).replace("<period>",self.period)).replace("<interval>",self.interval), instance, "rds" )
            
            metric_pi = self.clw.get_pi_metrics('db-IOZIWKJAZOLRUJIUKBPWJDCGEI',start_date,end_date)
            self.file.write_all({ "file_name" : self.output_path + "metric-pi.json", "open_mode" : "w", "content" : json.dumps(metric_pi, indent=4, default=self.default) })
            
        self.file.write_all({ "file_name" : self.output_path + "resources.json", "open_mode" : "w", "content" : json.dumps(resources, indent=4, default=self.default) })
        self.file.write_all({ "file_name" : self.output_path + "template.json", "open_mode" : "w", "content" : json.dumps(template, indent=4, default=self.default) })
        
        # Create archive file
        archive_file = self.export_id + "." + self.object_class + ".tar.gz"
        print("Creating archive file : " + archive_file)
        subprocess.call(
                        [
                            "tar",
                            "-zcvf",
                            f"./{archive_file}",
                            "output/",
                        ],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.STDOUT,
        )
        
        return archive_file
        
        
    def default(self,o):
        if isinstance(o, (date, datetime)):
            return o.isoformat()
        


      
   

############################|-
############################|-       Class : classImporter     -|####################################
############################|-


class classImporter():

    #-----| Constructor
    def __init__(self, params):
        # store the event
        self.user_id = params["user_id"]
        self.region = params["region"]
        self.database_ts = params["database_ts"]
        self.table_ts = params["table_ts"]
        self.table_ddb = params["table_ddb"]
        self.client_ts = boto3.Session(region_name=self.region).client("timestream-write")
        self.client_ddb = boto3.Session().client("dynamodb",region_name= "us-east-1")
        self.import_id = datetime.now().strftime("%Y%m%d%H%M%S")
        self.file = classFile()
        self.output_path = "output/"
        self.file.create_folder(self.output_path)
        


    
    #-----| Prepare Record
    def prepare_record(self,measure_name, measure_value, measure_time):
        datetime_object = datetime.strptime(measure_time,"%Y-%m-%dT%H:%M:%S.%fZ" )
        record = {
                "MeasureName": measure_name,
                "MeasureValue":str(measure_value),
                "Time": str(calendar.timegm(datetime_object.timetuple()) * 1000),
        }
        return record



    #-----| Writer Records
    def write_records(self, records, common_attributes):
        try:
            result = self.client_ts.write_records(DatabaseName=self.database_ts,
                                                TableName=self.table_ts,
                                                CommonAttributes=common_attributes,
                                                Records=records)
            status = result['ResponseMetadata']['HTTPStatusCode']
            #print("Processed %d records. WriteRecords HTTPStatusCode: %s" %
            #      (len(records), status))
        except self.client_ts.exceptions.RejectedRecordsException as err:
          self._print_rejected_records_exceptions(err)
        except Exception as err:
          print("Error:", err)


    
    #-----| Write Execeptions 
    @staticmethod
    def _print_rejected_records_exceptions(err):
        print("RejectedRecords: ", err)
        for rr in err.response["RejectedRecords"]:
          print("Rejected Index " + str(rr["RecordIndex"]) + ": " + rr["Reason"])
          if "ExistingVersion" in rr:
            print("Rejected record existing version: ", rr["ExistingVersion"])
        
        
    
    
    
    #-----| Importer File
    def import_file(self,file):
        try:
            print("Importing file :" + file)
            content = (self.file.read_all({"file_name" : file }))
            json_content = json.loads(content)
            
            if (json_content['is_null'] == False):
                
                dimensions = [{ "Name" : "ImporterId", "Value" : self.import_id }] + json_content['dimensions'] + json_content['metadata']['properties']
                common_attributes = {
                    'Dimensions': dimensions,
                    'MeasureValueType': 'DOUBLE'
                }
                df = json.loads(json_content['df'])
                records = []
                
                for data in df['data']:
                    for field in df['schema']['fields']:
                        if ( field['name'] != "index"):
                            records.append(self.prepare_record(field['name'], data[field['name']], data['index'] ))
                            if len(records) == 100:
                                self.write_records(records, common_attributes)
                                records = []
      
        except Exception as err:
            print("Error:", err)
    
    
    
    #-----| Extract File
    def extract_archive(self,archive_file):
        
         # Create archive file
        print("Extracting archive file : " + archive_file)
        subprocess.call(
                        [
                            "tar",
                            "xvfz",
                             archive_file,
                        ],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.STDOUT,
        )
        files = os.listdir("output")
        return files
    
    
    #-----| Write Metadata
    def write_metadata(self,user_id,metadata):
        try:
            records = metadata["metadata"]
            header = metadata["exportParameters"]
          
            for record in records:
                item = { 
                            'user_id': {}, 
                            'resource_id': {}, 
                            'exp_id': {}, 
                            'imp_id': {}, 
                            'resource_type': {}, 
                            'resource_name': {}, 
                            'region': {},
                            'interval': {}, 
                            'period': {}, 
                            'start_date': {},
                            'end_date': {}, 
                            'metadata': {} 
                }
                item["user_id"]["S"] = user_id
                item["resource_id"]["S"] = record["resourceId"]
                item["exp_id"]["S"] = header["exportId"]
                item["imp_id"]["S"] = self.import_id
                item["resource_type"]["S"] = record["resourceType"]
                item["resource_name"]["S"] = record["resourceName"]
                item["region"]["S"] = header["region"]
                item["interval"]["S"] = header["interval"]
                item["period"]["S"] = header["period"]
                item["start_date"]["S"] = header["startDate"]
                item["end_date"]["S"] = header["endDate"]
                item["metadata"]["S"] = json.dumps(record["resourceDefinition"])
                response = self.client_ddb.put_item(TableName = self.table_ddb, Item=item)
                
                
        except ClientError as e:
                print(f'{e.response["Error"]["Code"]}: {e.response["Error"]["Message"]}')
        

    #-----| Import Process
    def import_metrics(self,archive_file):
        print("--#| Importing metrics")
        
        files = self.extract_archive(archive_file)
        self.import_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        metadata = json.loads((self.file.read_all({"file_name" : self.output_path + "metadata.json" })))
        self.write_metadata(self.user_id, metadata)
        
        for file in files:
            if ( file != "metadata.json" and file != "template.json"):
                self.import_file(self.output_path + file)
            
        