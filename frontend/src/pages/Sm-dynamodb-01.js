import {useState,useEffect,useRef} from 'react'
import Axios from 'axios'
import { configuration } from './Configs';
import { metricCatalog } from './MetricCatalog';

import { useSearchParams } from 'react-router-dom';

import { applicationVersionUpdate, classMetrics } from '../components/Functions';
import { createLabelFunction, customFormatNumberLong, customFormatNumber, customFormatNumberShort } from '../components/Functions';

import DateRangePicker from "@cloudscape-design/components/date-range-picker";
import Flashbar from "@cloudscape-design/components/flashbar";
import FormField from "@cloudscape-design/components/form-field";
import Textarea from "@cloudscape-design/components/textarea";

import { SplitPanel } from '@cloudscape-design/components';
import AppLayout from '@cloudscape-design/components/app-layout';
import ProgressBar from "@cloudscape-design/components/progress-bar";
import Select from "@cloudscape-design/components/select";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import CustomHeader from "../components/Header";
import { ColumnLayout } from '@cloudscape-design/components';
import Tabs from "@cloudscape-design/components/tabs";


import CompMetric01  from '../components/Metric01';
import ChartLine02  from '../components/ChartLine02';
import ChartLine04  from '../components/ChartLine04';
import CustomTable02 from "../components/Table02";
import CustomLabel from "../components/Label01";
import CustomDateTimePicker from "../components/DateTimePicker";
import ChartProgressBar01 from '../components/ChartProgressBar-01';

import Header from "@cloudscape-design/components/header";
import '@aws-amplify/ui-react/styles.css';

export const splitPanelI18nStrings: SplitPanelProps.I18nStrings = {
  preferencesTitle: 'Split panel preferences',
  preferencesPositionLabel: 'Split panel position',
  preferencesPositionDescription: 'Choose the default split panel position for the service.',
  preferencesPositionSide: 'Side',
  preferencesPositionBottom: 'Bottom',
  preferencesConfirm: 'Confirm',
  preferencesCancel: 'Cancel',
  closeButtonAriaLabel: 'Close panel',
  openButtonAriaLabel: 'Open panel',
  resizeHandleAriaLabel: 'Resize split panel',
};


export const datePickerI18nStrings = { 
        todayAriaLabel: "Today",
        nextMonthAriaLabel: "Next month",
        previousMonthAriaLabel: "Previous month",
        customRelativeRangeDurationLabel: "Duration",
        customRelativeRangeDurationPlaceholder: "Enter duration",
        customRelativeRangeOptionLabel: "Custom range",
        customRelativeRangeOptionDescription:
          "Set a custom range in the past",
        customRelativeRangeUnitLabel: "Unit of time",
        formatRelativeRange: (e) => {
          const n = 1 === e.amount ? e.unit : `${e.unit}s`;
          return `Last ${e.amount} ${n}`;
        },
        formatUnit: (e, n) => (1 === n ? e : `${e}s`),
        relativeModeTitle: "Relative range",
        absoluteModeTitle: "Absolute range",
        relativeRangeSelectionHeading: "Choose a range",
        startDateLabel: "Start date",
        endDateLabel: "End date",
        startTimeLabel: "Start time",
        endTimeLabel: "End time",
        clearButtonLabel: "Clear and dismiss",
        cancelButtonLabel: "Cancel",
        applyButtonLabel: "Apply",
};


var CryptoJS = require("crypto-js");

function Application() {

    //-- Application Version
    const [versionMessage, setVersionMessage] = useState([]);
    const [objectConfiguration, setObjectConfiguration] = useState({ resourceName : "", resourceType : "", expId : "", impId : "", resources : {} , metadata : {} });
  
    //-- Add Header Cognito Token
    Axios.defaults.headers.common['x-csrf-token'] = sessionStorage.getItem("x-csrf-token");
    Axios.defaults.headers.common['x-token-cognito'] = sessionStorage.getItem("x-token-cognito");
    Axios.defaults.withCredentials = true;
  
    //-- Gather Parameters
    const [params]=useSearchParams();
    
    const parameter_id=params.get("id");  
    var parameter_object_bytes = CryptoJS.AES.decrypt(parameter_id, sessionStorage.getItem("x-token-cognito"));
    var parameter_object_values = JSON.parse(parameter_object_bytes.toString(CryptoJS.enc.Utf8));
    
    //-- Variable for Active Tabs
    const [activeTabId, setActiveTabId] = useState("tab01");
    const currentTabId = useRef("tab01");
    
    
    //-- Split Panel
    const [splitPanelShow,setsplitPanelShow] = useState(false);
    const [splitPanelSize, setSplitPanelSize] = useState(400);
    
    
    //-- Performance Information
    const [objectPerformanceChart, setObjectPerformanceChart] = useState({
                                                        summaryChart : {}
                                                        
        
    });
    
    
    const [objectPerformanceSummary, setObjectPerformanceSummary] = useState({
                                                        summaryNumbers : {},
                                                        summaryTable : []
                                                        
        
    });
    
    const [nodeStats, setNodeStats] = useState({ nodeChart : [] });
    
    
    //-- Table Nodes
    
    const columnsTableNodes =  [
                  {id: 'GlobalSecondaryIndexName', header: 'ResourceName',cell: item => item['GlobalSecondaryIndexName'],ariaLabel: createLabelFunction('GlobalSecondaryIndexName'),sortingField: 'GlobalSecondaryIndexName',},
                  {id: 'LevelType', header: 'ObjectType',cell: item => item['LevelType'],ariaLabel: createLabelFunction('LevelType'),sortingField: 'LevelType',},
                  {id: 'avg',header: 'Average',cell: item => customFormatNumberLong(parseFloat(item['avg']),2),ariaLabel: createLabelFunction('avg'),sortingField: 'avg', },
                  {id: 'max',header: 'Maximum',cell: item => customFormatNumberLong(parseFloat(item['max']),2),ariaLabel: createLabelFunction('max'),sortingField: 'max', },
                  {id: 'min',header: 'Minimum',cell: item => customFormatNumberLong(parseFloat(item['min']),2),ariaLabel: createLabelFunction('min'),sortingField: 'min', },
                  {id: 'p90',header: 'P90',cell: item => customFormatNumberLong(parseFloat(item['p90']),2) ,ariaLabel: createLabelFunction('p90'),sortingField: 'p90', },
                  {id: 'p95',header: 'P95',cell: item => customFormatNumberLong(parseFloat(item['p95']),2) ,ariaLabel: createLabelFunction('p95'),sortingField: 'p95', },
                  {id: 'sum',header: 'Sum',cell: item => customFormatNumberLong(parseFloat(item['sum']),2),ariaLabel: createLabelFunction('sum'),sortingField: 'sum',},
                  {id: 'pct',header: 'Percentage',cell: item => customFormatNumberLong(parseFloat(item['pct']) || 0 ,2),ariaLabel: createLabelFunction('pct'),sortingField: 'pct',},
    ];
    
    const visibleContentNodes = ['GlobalSecondaryIndexName','LevelType', 'avg', 'max', 'min', 'p90', 'p95', 'sum', 'pct' ];
    
    // List of Metrics
    const [selectedMetricAnalytics,setSelectedMetricAnalytics] = useState({ label : "ConsumedReadCapacityUnits", value : "measure_name = 'ConsumedReadCapacityUnits'" });
    const analyticsMetricName = useRef("measure_name = 'ConsumedReadCapacityUnits'");
    const [analyticsMetrics,setAnalyticsMetrics] = useState(metricCatalog['dynamodb']);
    const resourceName = useRef("");
    const [metricInfo,setMetricInfo] = useState({});
    const [dateIntervalValue,setDateIntervalValue] = useState({ "startDate" : parameter_object_values['startDate'],  "endDate" : parameter_object_values['endDate'] });
    const periodTimeGroup = useRef(1);
    var dateFilter = useRef({ "startDate" : parameter_object_values['startDate'],  "endDate" : parameter_object_values['endDate'] });
    
    const [selectedPeriod,setSelectedPeriod] = useState({ label : "12 Hours", value : 60*12 });
    var period = useRef(60*12);
    var ratio = useRef(1);
    
    
    //-- Gather Resource Stats
    async function gatherResourceDetails(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            
            //-- Measures
            var params = { 
                            sqlQuery : `SELECT 
                                            BIN(time, ${period.current}m ) as time,
                                            AVG(measure_value::double) as avg,
                                            MAX(measure_value::double) as max,
                                            MIN(measure_value::double) as min,
                                            APPROX_PERCENTILE(measure_value::double, 0.9) AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95) AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99) AS p99
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-dynamodb"]} 
                                        WHERE 
                                            time between '${dateFilter.current['startDate'].replace("T"," ")}' and '${dateFilter.current['endDate'].replace("T"," ")}'
                                            and
                                            ${analyticsMetricName.current}
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            TableName = '${parameter_object_values['resourceName']}'
                                            and 
                                            GlobalSecondaryIndexName = '${resourceName.current}' 
                                        GROUP BY 
                                            BIN(time, ${period.current}m )
                                        ORDER BY 
                                            time 
                                        DESC` 
              
            };
            
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                      
                    var avg = data.data.records.map(function (obj) {
                      return [obj.time, obj.avg];
                    });
                    
                    var min = data.data.records.map(function (obj) {
                      return [obj.time, obj.min];
                    });
                    var max = data.data.records.map(function (obj) {
                      return [obj.time, obj.max];
                    });
                    
                    var p90 = data.data.records.map(function (obj) {
                      return [obj.time, obj.p90];
                    });
                    
                    var p95 = data.data.records.map(function (obj) {
                      return [obj.time, obj.p95];
                    });
                    
                    setNodeStats({ nodeChart : { avg : avg, min : min, max : max, p90 : p90, p95 : p95 } });
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/timestream/execute/query/' );
                  console.log(err);
                  
              });
              
            
            
        }
        catch{
        
          console.log('Timeout API error : /api/aws/metric/analyzer/timestream/execute/query/');                  
          
        }
        
    
    }
    
    
    
    //-- Gather Performance Information
    async function gatherGlobalPerformanceChart(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            var metrics = {
                                                        summaryChart : {},
                                                        
        
            };
            
            //-- Chart Cluster Data
            var params = { 
                            sqlQuery : `SELECT 
                                            BIN(time, ${period.current}m ) as time,
                                            AVG(measure_value::double)/${ratio.current} as avg,
                                            MAX(measure_value::double)/${ratio.current} as max,
                                            MIN(measure_value::double)/${ratio.current} as min,
                                            APPROX_PERCENTILE(measure_value::double, 0.9)/${ratio.current} AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95)/${ratio.current} AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99)/${ratio.current} AS p99
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-dynamodb"]} 
                                        WHERE 
                                            time between '${dateFilter.current['startDate'].replace("T"," ")}' and '${dateFilter.current['endDate'].replace("T"," ")}'
                                            and
                                            ${analyticsMetricName.current}
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            TableName = '${parameter_object_values['resourceName']}' 
                                        GROUP BY 
                                            BIN(time, ${period.current}m) 
                                        ORDER BY 
                                            time 
                                        DESC` 
              
            };
            
            console.log(params.sqlQuery);
            
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                    
                    
                    var avg = data.data.records.map(function (obj) {
                      return [obj.time, obj.avg];
                    });
                    
                    var min = data.data.records.map(function (obj) {
                      return [obj.time, obj.min];
                    });
                    var max = data.data.records.map(function (obj) {
                      return [obj.time, obj.max];
                    });
                    
                    var p90 = data.data.records.map(function (obj) {
                      return [obj.time, obj.p90];
                    });
                    
                    var p95 = data.data.records.map(function (obj) {
                      return [obj.time, obj.p95];
                    });
                    
                    
                    setObjectPerformanceChart({ summaryChart : { avg : avg, min : min, max : max, p90 : p90, p95 : p95 } });
                   
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/timestream/execute/query/' );
                  console.log(err);
                  
              });
        }
        catch{
        
          console.log('Timeout API error : /api/aws/metric/analyzer/timestream/execute/query/');                  
          
        }
    
    }
    
    
    
    //-- Gather Performance Information
    async function gatherGlobalPerformanceSummary(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            var metrics = {
                                                        summaryNumbers : {},
                                                        summaryTable : []
                                                        
        
            };
            
            
            //-- Metrics Cluster Summary 
            var params = { 
                            sqlQuery : `SELECT 
                                            SUM(measure_value::double) as sum,  
                                            AVG(measure_value::double) as avg,
                                            MAX(measure_value::double) as max,
                                            MIN(measure_value::double) as min,
                                            APPROX_PERCENTILE(measure_value::double, 0.9) AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95) AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99) AS p99
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-dynamodb"]} 
                                        WHERE 
                                            time between '${dateFilter.current['startDate'].replace("T"," ")}' and '${dateFilter.current['endDate'].replace("T"," ")}'
                                            and
                                            ${analyticsMetricName.current}
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            TableName = '${parameter_object_values['resourceName']}' 
                                        ` 
              
            };
            
            
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                   
                    metrics = { ...metrics, summaryNumbers : data.data.records[0]  };
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/timestream/execute/query/' );
                  console.log(err);
                  
              });
              
              
            //-- Table Summary 
            params = { 
                            sqlQuery : `
                                        WITH summary AS (
                                            SELECT
                                                TableName,
                                                SUM(measure_value::double) as total
                                            FROM 
                                                ${configuration["apps-settings"]["table-metrics-dynamodb"]}
                                            WHERE 
                                                time between '${dateFilter.current['startDate'].replace("T"," ")}' and '${dateFilter.current['endDate'].replace("T"," ")}'
                                                and
                                                ${analyticsMetricName.current}
                                                and 
                                                ImporterId = '${parameter_object_values['impId']}' 
                                                and 
                                                TableName = '${parameter_object_values['resourceName']}'
                                            GROUP BY
                                                TableName

                                        )
                                        SELECT 
                                            a.LevelType,
                                            a.GlobalSecondaryIndexName,
                                            AVG(measure_value::double) as avg,
                                            MAX(measure_value::double) as max,
                                            MIN(measure_value::double) as min,
                                            SUM(measure_value::double) as sum,
                                            APPROX_PERCENTILE(measure_value::double, 0.9) AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95) AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99) AS p99,
                                            SUM(measure_value::double/b.total) * 100 as pct
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-dynamodb"]} a INNER JOIN summary b
                                            ON a.TableName = b.TableName 
                                        WHERE 
                                            time between '${dateFilter.current['startDate'].replace("T"," ")}' and '${dateFilter.current['endDate'].replace("T"," ")}'
                                            and
                                            ${analyticsMetricName.current}
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            a.TableName = '${parameter_object_values['resourceName']}' 
                                        GROUP BY 
                                           a.LevelType,
                                           a.GlobalSecondaryIndexName
                                        ORDER BY
                                            a.LevelType,
                                            a.GlobalSecondaryIndexName
                                        ` 
              
            };
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                    metrics = { ...metrics, summaryTable : data.data.records }
                    
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/timestream/execute/query/' );
                  console.log(err);
                  
              });
              
              setObjectPerformanceSummary({ ...metrics });
              
        }
        catch{
        
          console.log('Timeout API error : /api/aws/metric/analyzer/timestream/execute/query/');                  
          
        }
        
    
    }
    
    
    
    
    
    //-- Gather Import Details
   async function gatherImportDetails(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            var params = { 
                    userId : parameter_object_values["userId"], 
                    resourceId : parameter_object_values["resourceId"], 
                    tableName : configuration["apps-settings"]["table-metadata-dynamodb"] 
            };
            await Axios.get(`${api_url}/api/aws/metric/analyzer/clw/get/import/details/`,{
                      params: params, 
                  }).then((data)=>{
                   var item = data.data.item;
                   periodTimeGroup.current = item['period'];
                   setObjectConfiguration({...item});
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/clw/get/import/details/' );
                  console.log(err);
                  
              });
            
        }
        catch{
        
          console.log('Timeout API error : /api/aws/metric/analyzer/clw/get/import/details/');                  
          
        }
        
    
    }
    
    
    //-- Gather Metric Details Process
   async function gatherMetricInfo (){
    
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            var params = {
                            tableName : configuration["apps-settings"]["table-metric-catalog"],
                            service : "elasticache.redis",
                            metric : analyticsMetricName.current,
                            
            };
            Axios.get(`${api_url}/api/aws/metric/analyzer/clw/get/metric/details/`,{
                      params: params, 
                  }).then((data)=>{
                   setMetricInfo(data.data.item);
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/clw/get/metric/details/' );
                  console.log(err);
                  
              });
            
        }
        catch{
        
          console.log('Timeout API error : /api/aws/metric/analyzer/clw/get/metric/details/');                  
          
        }
    
    }
    
    //-- Call API to App Version
   async function gatherVersion (){

        //-- Application Update
        var appVersionObject = await applicationVersionUpdate({ codeId : "dbwcmp", moduleId: "elastic-m1"} );
        
        if (appVersionObject.release > configuration["apps-settings"]["release"] ){
          setVersionMessage([
                              {
                                type: "info",
                                content: "New Application version is available, new features and modules will improve workload capabilities and user experience.",
                                dismissible: true,
                                dismissLabel: "Dismiss message",
                                onDismiss: () => setVersionMessage([]),
                                id: "message_1"
                              }
          ]);
      
        }
        
   }
   
   
   useEffect(() => {
        //gatherVersion();
        gatherGlobalPerformanceChart();
        gatherGlobalPerformanceSummary();
        gatherImportDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    
    
    
  return (
    <div>
      <CustomHeader/>
      <AppLayout
            disableContentPaddings
            toolsHide
            navigationHide
            contentType="default"
            splitPanelOpen={splitPanelShow}
            splitPanelOpen={splitPanelShow}
            onSplitPanelToggle={() => setsplitPanelShow(false)}
            onSplitPanelResize={
                                ({ detail: { size } }) => {
                                 setSplitPanelSize(size);
                            }
            }
            splitPanelSize={splitPanelSize}
            splitPanel={
                      <SplitPanel  
                                    header={"Resource : " + resourceName.current} 
                                    i18nStrings={splitPanelI18nStrings} 
                                    closeBehavior="hide"
                                    onSplitPanelToggle={({ detail }) => {
                                        
                                        }
                                      }
                      >
                        
                        { splitPanelShow === true  &&
                            
                            <div>  
                                <table style={{"width":"100%", "padding": "1em"}}>
                                    <tr>  
                                        <td valign="top" style={{ "width":"100%"}}>
                                                <ChartLine04 series={JSON.stringify([
                                                           { name : "avg", data : nodeStats['nodeChart']?.['avg'] },
                                                           { name : "min", data : nodeStats['nodeChart']?.['min'] },
                                                           { name : "max", data : nodeStats['nodeChart']?.['max'] },
                                                           { name : "p90", data : nodeStats['nodeChart']?.['p90'] },
                                                           { name : "p95", data : nodeStats['nodeChart']?.['p95'] },
                                                           
                                                        ])} 
                                                        title={""} height="250px" 
                                                />
                                          
                                        </td>
                                    </tr>
                                </table>
                            </div>  
                        } 
                        
                        
                    </SplitPanel>
                    
            }
            content={
                <div style={{"padding" : "1em"}}>
                    <Tabs
                            disableContentPaddings
                            onChange={({ detail }) => {
                                  setActiveTabId(detail.activeTabId);
                                  currentTabId.current=detail.activeTabId;
                              }
                            }
                            activeTabId={activeTabId}
                            tabs={[
                              {
                                label: "Configuration",
                                id: "tab01",
                                content: 
                                  <div style={{"padding" : "1em"}}>
                                    
                                            <Container>
                                                <Box variant="h3" color="text-status-inactive">Resource Information</Box>
                                                <br/>
                                                <ColumnLayout columns={3} variant="text-grid">
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="TableName">{objectConfiguration['metadata']?.['Table']?.['TableName']}</CustomLabel>
                                                          <CustomLabel label="TableSize">{customFormatNumberLong(parseFloat(objectConfiguration['metadata']?.['Table']?.['TableSizeBytes']),2) }</CustomLabel>
                                                          <CustomLabel label="TableCount">{customFormatNumberLong(parseFloat(objectConfiguration['metadata']?.['Table']?.['ItemCount']),2)}</CustomLabel>
                                                    </SpaceBetween>
                                                    
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="GSI">{ ( Array.isArray(objectConfiguration['metadata']?.['Table']?.['GlobalSecondaryIndexes']) ? objectConfiguration['metadata']?.['Table']?.['GlobalSecondaryIndexes'].length : 0 ) }</CustomLabel>
                                                          <CustomLabel label="ReadCapacityUnits">{objectConfiguration['metadata']?.['Table']?.['ProvisionedThroughput']?.['ReadCapacityUnits']}</CustomLabel>
                                                          <CustomLabel label="WriteCapacityUnits">{objectConfiguration['metadata']?.['Table']?.['ProvisionedThroughput']?.['WriteCapacityUnits']}</CustomLabel>
                                                    </SpaceBetween>
                                                    
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="Replicas">{ ( Array.isArray(objectConfiguration['metadata']?.['Table']?.['Replicas']) ? objectConfiguration['metadata']?.['Table']?.['Replicas'].length : 0 ) }</CustomLabel>
                                                          <CustomLabel label="TableClass">{objectConfiguration['metadata']?.['Table']?.['TableClassSummary']?.['TableClass']}</CustomLabel>
                                                          <CustomLabel label="NumberOfDecreasesToday">{objectConfiguration['metadata']?.['Table']?.['ProvisionedThroughput']?.['NumberOfDecreasesToday']}</CustomLabel>
                                                    </SpaceBetween>
                                                </ColumnLayout>
                                                <br/>
                                                <br/>
                                                
                                                <br/>
                                                <br/>
                                                <Box variant="h3" color="text-status-inactive">Metadata</Box>
                                                <br/>
                                                <Textarea
                                                  value={ JSON.stringify(objectConfiguration, undefined, 4)}
                                                  rows={50}
                                                />
                                                
                                          </Container>
                                  </div>
                                
                              },
                              {
                                label: "Performance",
                                id: "tab02",
                                content: 
                                  <div style={{"padding" : "1em"}}>
                                    
                                            <Container
                                                header={
                                                        <Header
                                                          variant="h2"
                                                          actions={
                                                            <SpaceBetween
                                                              direction="horizontal"
                                                              size="xxl"
                                                            >
                                                              <CustomLabel label="Period">
                                                                    <Select
                                                                          selectedOption={selectedPeriod}
                                                                          onChange={({ detail }) => {
                                                                                 period.current = detail.selectedOption.value;
                                                                                 setSelectedPeriod(detail.selectedOption);
                                                                                 setsplitPanelShow(false);
                                                                                 gatherGlobalPerformanceChart();
                                                                                 gatherGlobalPerformanceSummary();
                                                                          }
                                                                          }
                                                                          options={[ 
                                                                            { label : "1 Minute", value : 1},
                                                                            { label : "5 Minutes", value : 5},
                                                                            { label : "10 Minutes", value : 10},
                                                                            { label : "30 Minutes", value : 30},
                                                                            { label : "1 Hour", value : 60},
                                                                            { label : "3 Hours", value : 60*3},
                                                                            { label : "6 Hours", value : 60*6},
                                                                            { label : "12 Hours", value : 60*12},
                                                                            { label : "24 Hours", value : 60*24},
                                                                          ]}
                                                                          filteringType="auto"
                                                                    />
                                                              </CustomLabel>
                                                              <CustomLabel label="Interval">
                                                                  <CustomDateTimePicker
                                                                          value={undefined}
                                                                          onChangeDateSelection={(detail) => {
                                                                                    dateFilter.current = detail;
                                                                                    setsplitPanelShow(false);
                                                                                    setDateIntervalValue(detail);
                                                                                    gatherGlobalPerformanceChart();
                                                                                    gatherGlobalPerformanceSummary();
                                                                          }
                                                                          }
                                                                    />
                                                              </CustomLabel>
                                                              <CustomLabel label="StartDate">{dateFilter.current['startDate']}</CustomLabel>
                                                              <CustomLabel label="EndDate">{dateFilter.current['endDate']}</CustomLabel>
                                                              <CustomLabel label="">
                                                                  <Button variant="primary"
                                                                        onClick={() => {
                                                                                        dateFilter.current = { "startDate" : parameter_object_values['startDate'],  "endDate" : parameter_object_values['endDate'] };
                                                                                        setsplitPanelShow(false);
                                                                                        gatherGlobalPerformanceChart();
                                                                                        gatherGlobalPerformanceSummary();
                                                                                        gatherResourceDetails();
                                                                              }
                                                                          }
                                                                    >
                                                                        Reset Filter
                                                                    </Button>
                                                                </CustomLabel>
                                                            </SpaceBetween>
                                                          }
                                                        >
                                                          Performance Metric Analyzer
                                                        </Header>
                                                      }
                                            >
                                                    <Box float="right">
                                                        
                                                            
                                                    </Box>
                                                    <br/>
                                                    <br/>
                                                    <table style={{"width":"100%"}}>
                                                        <tr>
                                                            <td valign="top" style={{"width":"25%", "padding-right": "1em"}}>  
                                                                    <Box variant="h4" color="text-status-inactive">Metric Name</Box>
                                                                     <Select
                                                                          selectedOption={selectedMetricAnalytics}
                                                                          onChange={({ detail }) => {
                                                                                 analyticsMetricName.current = detail.selectedOption.value;
                                                                                 ratio.current = detail.selectedOption.value['ratio'];
                                                                                 setSelectedMetricAnalytics(detail.selectedOption);
                                                                                 setsplitPanelShow(false);
                                                                                 gatherGlobalPerformanceChart();
                                                                                 gatherGlobalPerformanceSummary();
                                                                                 gatherMetricInfo();
                                                                                 
                                                                          }
                                                                          }
                                                                          options={analyticsMetrics}
                                                                          filteringType="auto"
                                                                    />
                                                            </td>
                                                            <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "2em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectPerformanceSummary['summaryNumbers']?.['avg'] || 0}
                                                                        title={"Average"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectPerformanceSummary['summaryNumbers']?.['max'] || 0}
                                                                        title={"Maximum"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectPerformanceSummary['summaryNumbers']?.['min'] || 0}
                                                                        title={"Minimum"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectPerformanceSummary['summaryNumbers']?.['sum'] || 0}
                                                                        title={"Sum"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectPerformanceSummary['summaryNumbers']?.['p90'] || 0}
                                                                        title={"p90"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectPerformanceSummary['summaryNumbers']?.['p95'] || 0}
                                                                        title={"p95"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                        </tr>
                                                </table>  
                                                <br/>
                                                <table style={{"width":"100%"}}>
                                                        <tr>
                                                            <td style={{"width":"50%", "padding-right": "1em"}}>  
                                                                    <CustomLabel label="Description">{metricInfo['description']}</CustomLabel>
                                                            </td>
                                                            <td style={{"width":"25%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "2em"}}>  
                                                                   <CustomLabel label="Advise">{metricInfo['advise']}</CustomLabel>
                                                            </td>
                                                            <td style={{"width":"25%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "2em"}}>  
                                                                   <CustomLabel label="Unit">{metricInfo['unit']}</CustomLabel>
                                                            </td>
                                                        </tr>
                                                </table>  
                                                <br/>       
                                                <ChartLine04 series={JSON.stringify([
                                                                           { name : "avg", data : objectPerformanceChart['summaryChart']?.['avg'] },
                                                                           { name : "min", data : objectPerformanceChart['summaryChart']?.['min'] },
                                                                           { name : "max", data : objectPerformanceChart['summaryChart']?.['max'] },
                                                                           { name : "p90", data : objectPerformanceChart['summaryChart']?.['p90'] },
                                                                           { name : "p95", data : objectPerformanceChart['summaryChart']?.['p95'] },
                                                                           
                                                                        ])} 
                                                                        title={""} height="280px"
                                                                        onZoom={( item ) => {
                                                                                dateFilter.current = item;
                                                                                setDateIntervalValue(item);
                                                                                //gatherGlobalPerformanceSummary();
                                                                          }
                                                                        }
                                                />
                                                
                                                
                                                <CustomTable02
                                                        columnsTable={columnsTableNodes}
                                                        visibleContent={visibleContentNodes}
                                                        dataset={objectPerformanceSummary['summaryTable']}
                                                        title={"Resources"}
                                                        description={""}
                                                        pageSize={20}
                                                        onSelectionItem={( item ) => {
                                                            resourceName.current = item[0]?.["GlobalSecondaryIndexName"];
                                                            setsplitPanelShow(true);
                                                            gatherResourceDetails();
                                                          }
                                                        }
                                                        extendedTableProperties = {
                                                            { variant : "borderless" }
                                                            
                                                        }
                                                        
                                                        
                                                        
                                                        
                                                />
                                                
                                                
                                          </Container>
                                  </div>
                                
                              },
                            ]}
                    
                    />
                    
                    
                
                </div>
                
            }
            disableContentHeaderOverlap={true}
            headerSelector="#h" 
        />
    </div>
  );
}

export default Application;

