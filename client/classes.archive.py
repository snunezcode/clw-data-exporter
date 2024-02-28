
############################|-       Import Section     -|####################################

import random
import json
import os
import logging
import subprocess
import time
import calendar

from datetime import date, datetime, timedelta
import boto3
from botocore.exceptions import ClientError
import pandas as pd


from typing import Any, Dict, Union, cast, Optional



############################|-       Init Section     -|####################################

logging.getLogger().setLevel(logging.INFO)
logger = logging.getLogger("region")
log = logging.StreamHandler()
logger.addHandler(log)


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
        


############################|-
############################|-       Class : classDynamoMetadata     -|####################################
############################|-


class classDynamoMetadata():
    
    def __init__(self):
        # store the event
        self.client = boto3.Session().client("dynamodb",region_name= "us-east-1")
        
    def write_metadata(self,params):
        try:
            
            resource_id = 1
            for resource in params["resources"]:
                item = { 'uid': {}, 'seq': {}, 'exp_id': {}, 'imp_id': {}, 'resource_type': {}, 'resource_name': {}, 'resource_list': {}, 'metadata': {} }
                item["uid"]["S"] = params["uid"]
                item["seq"]["S"] = params["importId"] + "-" + str(resource_id)
                item["exp_id"]["S"] = resource["exportId"]
                item["imp_id"]["S"] = params["importId"]
                item["resource_type"]["S"] = resource["resourceType"]
                item["resource_name"]["S"] = resource["resourceName"]
                item["resource_list"]["S"] = json.dumps(resource["resourceList"])
                item["metadata"]["S"] = json.dumps(resource["metadata"])
                resource_id = resource_id + 1
                response = self.client.put_item(TableName = "tblClwAnalyzer", Item=item)
            
            
        except ClientError as e:
            print(f'{e.response["Error"]["Code"]}: {e.response["Error"]["Message"]}')
        
    
        





############################|-       Class : classCloudwatchExporter     -|####################################


class classCloudwatchExporter():
    
    # constructor
    def __init__(self, params):
        # store the event
        self.session = boto3.Session(region_name=params["region"])
        self.cw_client = self.session.client("cloudwatch")
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
        
    
    def format_metric_query(  # pylint: disable=dangerous-default-value
        self, 
        namespace : str,
        metrics: dict,  # pylint: disable=redefined-outer-name
        dimension: dict,
        periods: list = [60, 300],  # pylint: disable=dangerous-default-value
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
    
    
    def get_metric_data(  # pylint: disable=too-many-arguments, inconsistent-return-statements
        self, 
        namespace : str,
        metrics: dict,  # pylint: disable=redefined-outer-name
        dimension: dict,
        period: int,
        interval : int,
        client: object,
        metadata : dict,
    ) -> dict:  # pylint: disable=too-many-arguments
        try:
            start_date, end_date = self.get_start_end_date(period)
            results = {}
            metric_data_query = self.format_metric_query(namespace,metrics, dimension, [period])
            response = client.get_metric_data(
                MetricDataQueries=metric_data_query,
                StartTime=start_date,
                EndTime=end_date
            )
    
            for metric in response["MetricDataResults"]:
                results[metric["Label"]] = {"Timestamps": [], "Values": []}
                results[metric["Label"]]["Values"] += metric["Values"]
                results[metric["Label"]]["Timestamps"] += metric["Timestamps"]
            while "NextToken" in response:
                response = client.get_metric_data(
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
            # result.index = pd.to_datetime(result.index)
            # https://github.com/pandas-dev/pandas/issues/39537
            result.index = pd.to_datetime(result.index).tz_convert("UTC")
            result = result.fillna(0)
    
            if result.empty:
                return_value = {
                    "name": self.dataframe_name(dimension), 
                    "dimensions" : dimension, 
                    "metadata": metadata, 
                    "df": None, 
                    "is_null": True
                }
            else:
                return_value = {
                    "name": self.dataframe_name(dimension),
                    "dimensions" : dimension,
                    "metadata": metadata,
                    "df": result.to_json(orient="table"),
                    "is_null": False
                }
            return return_value
            
        except client.exceptions.InvalidParameterValueException as e:
            print(e)
            # To Do
            pass
        except client.exceptions.InternalServiceFault as e:
            print(e)
            # To Do
            pass
    
    
    def get_metric_pi(self, resource_id, start_date, end_date):
        response = self.client_pi.get_resource_metrics(
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
        #base = {60: 15, 300: 63}
        #time_delta = timedelta(days=base[period])
        end_date = datetime.now() - timedelta(minutes=15)
        time_delta = timedelta(days=interval)
        start_date = end_date - time_delta
        return start_date.isoformat(), end_date.isoformat()
    
    '''
    def exporter(self,params : dict, metadata : dict, uid : int ) -> str:  # pylint: disable=unused-argument
        start_date, end_date = self.get_start_end_date(params['interval'])
        result = self.get_metric_data(
            params['namespace'], params['metrics'], params['dimensions'], start_date, end_date, params['period'], params['interval'], self.cw_client, metadata
        )
        self.file.write_json({ "file_name" : self.output_path + self.dataframe_name(params['dimensions']) + "-" + str(uid) + ".metric", "open_mode" : "w", "content" : result })
    ''' 
        



############################|-
############################|-       Class : classDynamoDB     -|####################################
############################|-

class classDynamoDB():
    
    # constructor
    def __init__(self, params):
        # store the event
        self.tables = params["tables"]
        self.indexes = [] 
        self.client = boto3.Session().client("dynamodb",region_name=params["region"])
        self.file = classFile()
        self.clw = classCloudwatchExporter({ "region" : params["region"]})
        self.output_path = "output/"
        self.object_class = "dynamodb"
        self.export_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        
    def gather_metadata(self,table):
        result = self.client.describe_table(TableName=table)
        
        for index in result['Table']['GlobalSecondaryIndexes']:
            self.indexes.append({ "table_name" : table, "index_name" : index["IndexName"] })
        
        return result
        
    
    def gather_cloudwatch_metrics(self, template, object_type):
        data = json.loads(template)
        metadata = { "properties" :  [{ "Name" : "ObjectType", "Value" : object_type }] }
        for metric in data['metrics']:
            self.clw.exporter(metric,metadata)
    
        
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
        metadata = []
        for table in self.tables:
            print("Processing Object : " + self.object_class + "."+ table)
            metadata.append(self.gather_metadata(table))
        
        self.file.write_all({ "file_name" : self.output_path + "metadata.json", "open_mode" : "w", "content" : json.dumps(metadata, indent=4, default=self.default) })
        
        # Gather Metrics
        for table in self.tables:
            template = (self.file.read_all({"file_name" : 'templates/dynamodb.table.json' })).replace("<table_name>",table)
            self.gather_cloudwatch_metrics(template,"dynamodb-table")
        
        for index in self.indexes:
            print("Processing Object : " + self.object_class + "."+ index['table_name'] + "." + index['index_name'])
            template = ((self.file.read_all({"file_name" : 'templates/dynamodb.index.json' })).replace("<table_name>",index['table_name'])).replace("<index_name>",index['index_name'])
            self.gather_cloudwatch_metrics(template,"dynamodb-index")
        
        
        
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
############################|-       Class : classEC2     -|####################################
############################|-

class classEC2():
    
    # constructor
    def __init__(self, params):
        # store the event
        self.client = boto3.client('ec2', region_name=params["region"])
        
        
    
    def gather_instance_type(self,instance_type):
        result = self.client.describe_instance_types(InstanceTypes=[instance_type])
        return result



############################|-
############################|-       Class : classElasticache     -|####################################
############################|-

class classElasticache():
    
    # constructor
    def __init__(self, params):
        # store the event
        self.clusters = params["clusters"]
        self.client = boto3.Session().client("elasticache",region_name=params["region"])
        self.file = classFile()
        self.clw = classCloudwatchExporter({ "region" : params["region"]})
        self.ec2 = classEC2({ "region" : params["region"]})
        self.output_path = "output/"
        self.object_class = "elasticache"
        self.export_id = datetime.now().strftime("%Y%m%d%H%M%S")
        self.period = params["period"]
        self.interval = params["interval"]
        
    
    def gather_metadata(self,cluster):
        rg = self.client.describe_replication_groups(
                                                        ReplicationGroupId=cluster,
                                                        MaxRecords=100,
        )
        
        instance_type = self.ec2.gather_instance_type(rg['ReplicationGroups'][0]['CacheNodeType'].replace("cache.",""))
        result = {**rg, **instance_type}
        return result
        
    
    def gather_cloudwatch_metrics(self, template, object_name, object_type):
        data = json.loads(template)
        metadata = { "properties" :  [{ "Name" : "ClusterName", "Value" : object_name }, { "Name" : "ObjectType", "Value" : object_type }] }
        uid = 1
        for metric in data['metrics']:
            self.clw.exporter(metric,metadata, uid)
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
        metadata = []
        resources = []
        template = self.file.read_all({"file_name" : 'templates/elasticache.json' })
        start_date, end_date = self.clw.get_start_end_date(int(self.interval))
        export_parameters = { "ExportParameters" : { "interval" : self.interval, "period" : self.period, "startDate" : start_date, "endDate" : end_date  } }
        print(start_date,end_date)
        for cluster in self.clusters:
            print("Processing Object : " + self.object_class + "."+ cluster)
            cluster_info = self.gather_metadata(cluster)
            cluster_info = { **cluster_info, **export_parameters }
            metadata.append(cluster_info)
            nodes = []
        
            for node in cluster_info['ReplicationGroups'][0]['NodeGroups']:
                nodes = nodes + node['NodeGroupMembers']
        
            node_list = []
            for node in nodes:
                print("Processing Object : " + self.object_class + "."+ cluster + '.' + node['CacheClusterId'] )
                
                self.gather_cloudwatch_metrics( (((template.replace("<cluster_id>",node['CacheClusterId'])).replace("<node_id>",node['CacheNodeId'])).replace("<period>",self.period)).replace("<interval>",self.interval), cluster, "elasticache" )
                node_list.append({ "CacheClusterId" : node['CacheClusterId'], "CacheNodeId" : node['CacheNodeId']  })
            
            resources.append({ "exportId" : self.export_id, "resourceType" : "elasticache" , "resourceName" : cluster , "resourceList" : node_list, "metadata" : cluster_info })
                
        
        self.file.write_all({ "file_name" : self.output_path + "metadata.json", "open_mode" : "w", "content" : json.dumps(metadata, indent=4, default=self.default) })
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
############################|-       Class : classRDS     -|####################################
############################|-

class classRDS():
    
    # constructor
    def __init__(self, params):
        # store the event
        self.instances = params["instances"]
        self.client = boto3.Session().client("rds",region_name=params["region"])
        self.client_pi = boto3.Session().client("pi",region_name=params["region"])
        self.file = classFile()
        self.clw = classCloudwatchExporter({ "region" : params["region"]})
        self.ec2 = classEC2({ "region" : params["region"]})
        self.output_path = "output/"
        self.object_class = "rds"
        self.export_id = datetime.now().strftime("%Y%m%d%H%M%S")
        self.period = params["period"]
        self.interval = params["interval"]
        
    
    def gather_metadata(self,instance):
        info = self.client.describe_db_instances(
                                                DBInstanceIdentifier=instance,
                                                MaxRecords=100,
        )
        
        instance_type = self.ec2.gather_instance_type(info['DBInstances'][0]['DBInstanceClass'].replace("db.",""))
        result = {**info, **instance_type}
        return result
        
    
    def gather_cloudwatch_metrics(self, template, object_name, object_type):
        data = json.loads(template)
        metadata = { "properties" :  [{ "Name" : "InstanceName", "Value" : object_name }, { "Name" : "ObjectType", "Value" : object_type }] }
        uid = 1
        for metric in data['metrics']:
            self.clw.exporter(metric,metadata, uid)
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
        metadata = []
        resources = []
        template = self.file.read_all({"file_name" : 'templates/rds.json' })
        start_date, end_date = self.clw.get_start_end_date(int(self.interval))
        
        metric_pi = self.gather_pi_metrics('db-IOZIWKJAZOLRUJIUKBPWJDCGEI',start_date,end_date)
        
        export_parameters = { "ExportParameters" : { "interval" : self.interval, "period" : self.period, "startDate" : start_date, "endDate" : end_date  } }
        
        for instance in self.instances:
            print("Processing Object : " + self.object_class + "."+ instance)
            instance_info = self.gather_metadata(instance)
            instance_info = { **instance_info, **export_parameters }
            metadata.append(instance_info)
            
            self.gather_cloudwatch_metrics(((template.replace("<instance>",instance)).replace("<period>",self.period)).replace("<interval>",self.interval), instance, "rds" )
            resources.append({ "exportId" : self.export_id, "resourceType" : "rds" , "resourceName" : instance , "resourceList" : instance, "metadata" : instance_info })
                
        
        self.file.write_all({ "file_name" : self.output_path + "metadata.json", "open_mode" : "w", "content" : json.dumps(metadata, indent=4, default=self.default) })
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

    # constructor
    def __init__(self, params):
        # store the event
        self.uid = params["uid"]
        self.region = params["region"]
        self.database = params["database"]
        self.table = params["table"]
        self.file = classFile()
        self.output_path = "output/"
        self.file.create_folder(self.output_path)
        self.client = boto3.Session(region_name=self.region).client("timestream-write")
        self.import_id = datetime.now().strftime("%Y%m%d%H%M%S")
        self.dyn = classDynamoMetadata()


    
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
            result = self.client.write_records(DatabaseName=self.database,
                                                TableName=self.table,
                                                CommonAttributes=common_attributes,
                                                Records=records)
            status = result['ResponseMetadata']['HTTPStatusCode']
            #print("Processed %d records. WriteRecords HTTPStatusCode: %s" %
            #      (len(records), status))
        except self.client.exceptions.RejectedRecordsException as err:
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
    
    

    #-----| Import Process
    def import_metrics(self,archive_file):
        print("--#| Importing metrics")
        
        files = self.extract_archive(archive_file)
        self.import_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        resources = json.loads((self.file.read_all({"file_name" : self.output_path + "resources.json" })))
        self.dyn.write_metadata({ "uid" : self.uid, "importId" : self.import_id, "resources" : resources  })
        
        for file in files:
            if ( file != "metadata.json" and file != "resources.json" and file != "template.json"):
                self.import_file(self.output_path + file)
            
        