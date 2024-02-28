import {useState,useEffect,useRef} from 'react'
import Axios from 'axios'
import { configuration } from './Configs';
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
    const [activeTabId, setActiveTabId] = useState("tab02");
    const currentTabId = useRef("tab02");
    
    
    //-- Split Panel
    const [splitPanelShow,setsplitPanelShow] = useState(false);
    const [splitPanelSize, setSplitPanelSize] = useState(400);
    
    
    //-- Performance Information
    
    
    const [objectStats, setObjectStats] = useState({
                                                        clusterSummary : {},
                                                        clusterChart : [],
                                                        nodes : []
                                                        
        
    });
    
    const [nodeStats, setNodeStats] = useState({ nodeChart : [] });
    
    
    //-- Table Nodes
    
    const columnsTableNodes =  [
                  {id: 'CacheClusterId', header: 'CacheClusterId',cell: item => item['CacheClusterId'],ariaLabel: createLabelFunction('CacheClusterId'),sortingField: 'CacheClusterId',},
                  {id: 'avg',header: 'Average',cell: item => customFormatNumberLong(parseFloat(item['avg']),2),ariaLabel: createLabelFunction('avg'),sortingField: 'avg', },
                  {id: 'max',header: 'Maximum',cell: item => customFormatNumberLong(parseFloat(item['max']),2),ariaLabel: createLabelFunction('max'),sortingField: 'max', },
                  {id: 'min',header: 'Minimum',cell: item => customFormatNumberLong(parseFloat(item['min']),2),ariaLabel: createLabelFunction('min'),sortingField: 'min', },
                  {id: 'p90',header: 'P90',cell: item => customFormatNumberLong(parseFloat(item['p90']),2) ,ariaLabel: createLabelFunction('p90'),sortingField: 'p90', },
                  {id: 'p95',header: 'P95',cell: item => customFormatNumberLong(parseFloat(item['p95']),2) ,ariaLabel: createLabelFunction('p95'),sortingField: 'p95', },
                  {id: 'sum',header: 'Sum',cell: item => customFormatNumberLong(parseFloat(item['sum']),2),ariaLabel: createLabelFunction('sum'),sortingField: 'sum',},
                  {id: 'pct',header: 'Percentage',cell: item => customFormatNumberLong(parseFloat(item['pct']) || 0 ,2),ariaLabel: createLabelFunction('pct'),sortingField: 'pct',},
    ];
    
    const visibleContentNodes = ['CacheClusterId', 'avg', 'max', 'min', 'p90', 'p95', 'sum', 'pct' ];
    
    
    
    // List of Metrics
    const [selectedMetricAnalytics,setSelectedMetricAnalytics] = useState({ label : "CPUUtilization", value : 'CPUUtilization' });
    const analyticsMetricName = useRef("CPUUtilization");
    const [analyticsMetrics,setAnalyticsMetrics] = useState([]);
    const cacheClusterId = useRef("");
    const [metricInfo,setMetricInfo] = useState({});
    const [dateIntervalValue,setDateIntervalValue] = useState(undefined);
    const periodTimeGroup = useRef(1);
   
                            
    
    //-- Gather Measure List
    async function gatherMeasureList(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            
            //-- Measures
            var params = { 
                            sqlQuery : `SELECT 
                                            measure_name
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-elasticache"]} 
                                        WHERE 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            ClusterName = '${parameter_object_values['resourceName']}' 
                                        GROUP BY 
                                            measure_name
                                        ORDER BY 
                                            measure_name
                                        ` 
              
            };
            
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                      
                    var metrics = [];
                    data.data.records.forEach(function (item) {
                        metrics.push({ label : item['measure_name'], value : item['measure_name'] });
                    });
                    
                    if (metrics.some(el => el.value === "CPUUtilization")) {
                        setSelectedMetricAnalytics({ label : "CPUUtilization", value : 'CPUUtilization' });
                        analyticsMetricName.current = "CPUUtilization";
                    } else
                        if (metrics.length > 0) {
                            setSelectedMetricAnalytics(metrics[0]);
                            analyticsMetricName.current = metrics[0]['value'];
                        }
                    setAnalyticsMetrics(metrics);
                    gatherMetricInfo();
                    
                     
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
    
    //-- Gather Node Stats
    async function gatherNodeStats(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            
            //-- Measures
            var params = { 
                            sqlQuery : `SELECT 
                                            BIN(time, 10m) as time,
                                            AVG(measure_value::double) as avg,
                                            MAX(measure_value::double) as max,
                                            MIN(measure_value::double) as min,
                                            APPROX_PERCENTILE(measure_value::double, 0.9) AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95) AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99) AS p99
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-elasticache"]} 
                                        WHERE 
                                            measure_name = '${analyticsMetricName.current}' 
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            ClusterName = '${parameter_object_values['resourceName']}'
                                            and 
                                            CacheClusterId = '${cacheClusterId.current}' 
                                        GROUP BY 
                                            BIN(time, 10m) 
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
    async function gatherPerformanceInformation(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            var metrics = {
                                                        clusterSummary : {},
                                                        clusterChart : [],
                                                        nodes : []
                                                        
        
            };
            
            //-- Chart Cluster Data
            var params = { 
                            sqlQuery : `SELECT 
                                            BIN(time, 10m) as time,
                                            AVG(measure_value::double) as avg,
                                            MAX(measure_value::double) as max,
                                            MIN(measure_value::double) as min,
                                            APPROX_PERCENTILE(measure_value::double, 0.9) AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95) AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99) AS p99
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-elasticache"]} 
                                        WHERE 
                                            measure_name = '${analyticsMetricName.current}' 
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            ClusterName = '${parameter_object_values['resourceName']}' 
                                        GROUP BY 
                                            BIN(time, 10m) 
                                        ORDER BY 
                                            time 
                                        DESC` 
              
            };
            
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                    
                    console.log(data.data);
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
                    
                    metrics = { clusterChart : { avg : avg, min : min, max : max, p90 : p90, p95 : p95 } };
                   
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/timestream/execute/query/' );
                  console.log(err);
                  
              });
              
             
            //-- Metrics Cluster Summary 
            params = { 
                            sqlQuery : `SELECT 
                                            AVG(measure_value::double) as avg,
                                            MAX(measure_value::double) as max,
                                            MIN(measure_value::double) as min,
                                            APPROX_PERCENTILE(measure_value::double, 0.9) AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95) AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99) AS p99
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-elasticache"]} 
                                        WHERE 
                                            measure_name = '${analyticsMetricName.current}' 
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            ClusterName = '${parameter_object_values['resourceName']}' 
                                        ` 
              
            };
            
            
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                   console.log(data);
                   
                    metrics = { ...metrics, clusterSummary : data.data.records[0]  }
                    
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/timestream/execute/query/' );
                  console.log(err);
                  
              });
              
              
            //-- Table Node Summary 
            params = { 
                            sqlQuery : `
                                        WITH summary AS (
                                            SELECT
                                                ClusterName,
                                                SUM(measure_value::double) as total
                                            FROM 
                                                ${configuration["apps-settings"]["table-metrics-elasticache"]}
                                            WHERE 
                                                measure_name = '${analyticsMetricName.current}'
                                                and 
                                                ImporterId = '${parameter_object_values['impId']}' 
                                                and 
                                                ClusterName = '${parameter_object_values['resourceName']}'
                                            GROUP BY
                                                ClusterName
                                        )
                                        SELECT 
                                            CacheClusterId,
                                            AVG(measure_value::double) as avg,
                                            MAX(measure_value::double) as max,
                                            MIN(measure_value::double) as min,
                                            SUM(measure_value::double) as sum,
                                            APPROX_PERCENTILE(measure_value::double, 0.9) AS p90,
                                            APPROX_PERCENTILE(measure_value::double, 0.95) AS p95,
                                            APPROX_PERCENTILE(measure_value::double, 0.99) AS p99,
                                            SUM(measure_value::double/b.total) * 100 as pct
                                        FROM 
                                            ${configuration["apps-settings"]["table-metrics-elasticache"]} a INNER JOIN summary b
                                            ON a.ClusterName = b.ClusterName
                                        WHERE 
                                            measure_name = '${analyticsMetricName.current}' 
                                            and 
                                            ImporterId = '${parameter_object_values['impId']}' 
                                            and 
                                            a.ClusterName = '${parameter_object_values['resourceName']}' 
                                        GROUP BY 
                                            CacheClusterId
                                        ` 
              
            };
            
            
            await Axios.get(`${api_url}/api/aws/metric/analyzer/timestream/execute/query/`,{
                      params: params, 
                  }).then((data)=>{
                   console.log(data);
                   
                    metrics = { ...metrics, nodes : data.data.records }
                    
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/timestream/execute/query/' );
                  console.log(err);
                  
              });
              
              
              setObjectStats({ ...metrics });
              
              
            
        }
        catch{
        
          console.log('Timeout API error : /api/aws/metric/analyzer/timestream/execute/query/');                  
          
        }
        
    
    }
    
    
    
    
    
    //-- Gather Import Details
   async function gatherImportDetails(){
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            var params = { uid : parameter_object_values["uid"], seq : parameter_object_values["seq"], tableName : "tblClwAnalyzer"   };
            await Axios.get(`${api_url}/api/aws/metric/analyzer/clw/get/import/details/`,{
                      params: params, 
                  }).then((data)=>{
                   console.log(data);
                   periodTimeGroup.current = data.data.item['metadata']?.['ExportParameters']?.['period'] / 60 ;
                   setObjectConfiguration({ 
                                            resourceName : data.data.item.resourceName, 
                                            resourceType : data.data.item.resourceType, 
                                            expId : data.data.item.expId, 
                                            impId : data.data.item.impId, 
                                            resources : data.data.item.resources, 
                                            metadata : {
                                                        ...data.data.item['metadata']['ReplicationGroups'][0], 
                                                        InstanceType : {...data.data.item['metadata']['InstanceTypes'][0] } ,  
                                                        vCPUs : data.data.item['metadata']['InstanceTypes'][0]['VCpuInfo']['DefaultVCpus'],
                                                        Memory : data.data.item['metadata']['InstanceTypes'][0]['MemoryInfo']['SizeInMiB']/1024,
                                                        NetworkPerformance : data.data.item['metadata']['InstanceTypes'][0]['NetworkInfo']['NetworkPerformance'],
                                                        BaselineBandwidthInGbps : data.data.item['metadata']['InstanceTypes'][0]?.['NetworkInfo']?.['NetworkCards']?.[0]?.['BaselineBandwidthInGbps'],
                                                        BaselineBandwidthInBytesps : data.data.item['metadata']['InstanceTypes'][0]?.['NetworkInfo']?.['NetworkCards']?.[0]?.['BaselineBandwidthInGbps'] * configuration["apps-settings"]["convert-Gbps-Bytesps"],
                                                        PeakBandwidthInGbps : data.data.item['metadata']['InstanceTypes'][0]?.['NetworkInfo']?.['NetworkCards']?.[0]?.['PeakBandwidthInGbps'],
                                                        PeakBandwidthInBytesps : data.data.item['metadata']['InstanceTypes'][0]?.['NetworkInfo']?.['NetworkCards']?.[0]?.['PeakBandwidthInGbps'] * configuration["apps-settings"]["convert-Gbps-Bytesps"],
                                                        ExportParameters : { ...data.data.item['metadata']?.['ExportParameters']}

                                            }
                   });
                   
                                                    
                     
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
                   console.log(data);
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
        gatherMeasureList();
        gatherPerformanceInformation();
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
                                    header={"CacheClusterId : " + cacheClusterId.current} 
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
                                                <Box variant="h3" color="text-status-inactive">Cluster Information</Box>
                                                <br/>
                                                <ColumnLayout columns={3} variant="text-grid">
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="ClusterName">{objectConfiguration['resourceName']}</CustomLabel>
                                                          <CustomLabel label="ClusterEnabled">{String(objectConfiguration['metadata']['ClusterEnabled'])}</CustomLabel>
                                                          <CustomLabel label="DataTiering">{String(objectConfiguration['metadata']['DataTiering'])}</CustomLabel>
                                                    </SpaceBetween>
                                                    
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="Nodes">{ ( Array.isArray(objectConfiguration['metadata']['MemberClusters']) ? objectConfiguration['metadata']['MemberClusters'].length : 0) }</CustomLabel>
                                                          <CustomLabel label="Shards">{ ( Array.isArray(objectConfiguration['metadata']['NodeGroups']) ? objectConfiguration['metadata']['NodeGroups'].length : 0 ) }</CustomLabel>
                                                          <CustomLabel label="NodeType">{objectConfiguration['metadata']['CacheNodeType']}</CustomLabel>
                                                    </SpaceBetween>
                                                    
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="MultiAZ">{String(objectConfiguration['metadata']['MultiAZ'])}</CustomLabel>
                                                          <CustomLabel label="AutomaticFailover">{objectConfiguration['metadata']['AutomaticFailover']}</CustomLabel>
                                                    </SpaceBetween>
                                                </ColumnLayout>
                                                <br/>
                                                <br/>
                                                <Box variant="h3" color="text-status-inactive">Hardware Information</Box>
                                                <br/>
                                                <ColumnLayout columns={3} variant="text-grid">
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="vCPU">{objectConfiguration['metadata']['vCPUs']}</CustomLabel>
                                                          <CustomLabel label="Memory(GB)">{ (objectConfiguration['metadata']['Memory'])?.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0})}</CustomLabel>
                                                          <CustomLabel label="MemoryTotalStore(GB)">{objectConfiguration['metadata']['Memory'] * ( Array.isArray(objectConfiguration['metadata']['NodeGroups']) ? objectConfiguration['metadata']['NodeGroups'].length : 0 )}</CustomLabel>
                                                          <CustomLabel label="NetworkPerformance">{objectConfiguration['metadata']['NetworkPerformance']}</CustomLabel>
                                                    </SpaceBetween>
                                                    
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="NetworkBaselineBandwidth(Gbps)">{objectConfiguration['metadata']['BaselineBandwidthInGbps']}</CustomLabel>
                                                          <CustomLabel label="NetworkBaselineBandwidth(Bytes/Sec)">{ (objectConfiguration['metadata']['BaselineBandwidthInBytesps'])?.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0}) }</CustomLabel>
                                                          <CustomLabel label="NetworkBaselineBandwidth(MB/Sec)">{ (objectConfiguration['metadata']['BaselineBandwidthInBytesps']/1024/1024)?.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0}) }</CustomLabel>
                                                    </SpaceBetween>
                                                    
                                                    <SpaceBetween size="l">
                                                          <CustomLabel label="NetworkPeakBandwidth(Gbps)">{objectConfiguration['metadata']['PeakBandwidthInGbps']}</CustomLabel>
                                                          <CustomLabel label="NetworkPeakBandwidth(Bytes/sec)">{(objectConfiguration['metadata']['PeakBandwidthInBytesps'])?.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0})}</CustomLabel>
                                                          <CustomLabel label="NetworkPeakBandwidth(MB/sec)">{(objectConfiguration['metadata']['PeakBandwidthInBytesps']/1024/1024)?.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0})}</CustomLabel>
                                                    </SpaceBetween>
                                                    
                                                </ColumnLayout>
                                                <br/>
                                                <br/>
                                                <Box variant="h3" color="text-status-inactive">Metadata</Box>
                                                <br/>
                                                <Textarea
                                                  value={ JSON.stringify(objectConfiguration['metadata'], undefined, 4)}
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
                                                              size="xs"
                                                            >
                                                              <CustomDateTimePicker
                                                                      value={undefined}
                                                                      onChangeDateSelection={(detail) => {
                                                                             console.log(detail);
                                                                             setDateIntervalValue(detail);
                                                                      }
                                                                      }
                                                                />
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
                                                                    <Box variant="h4" color="text-status-inactive">MetricName</Box>
                                                                     <Select
                                                                          selectedOption={selectedMetricAnalytics}
                                                                          onChange={({ detail }) => {
                                                                                 analyticsMetricName.current = detail.selectedOption.value;
                                                                                 setSelectedMetricAnalytics(detail.selectedOption);
                                                                                 setsplitPanelShow(false);
                                                                                 gatherPerformanceInformation();
                                                                                 gatherMetricInfo();
                                                                                 
                                                                          }
                                                                          }
                                                                          options={analyticsMetrics}
                                                                          filteringType="auto"
                                                                    />
                                                            </td>
                                                            <td style={{"width":"15%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "2em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectStats['clusterSummary']?.['avg'] || 0}
                                                                        title={"Average"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"15%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectStats['clusterSummary']?.['max'] || 0}
                                                                        title={"Maximum"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"15%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectStats['clusterSummary']?.['min'] || 0}
                                                                        title={"Minimum"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"15%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectStats['clusterSummary']?.['p90'] || 0}
                                                                        title={"p90"}
                                                                        precision={2}
                                                                        format={4}
                                                                        fontColorValue={configuration.colors.fonts.metric100}
                                                                        fontSizeValue={"24px"}
                                                                    />
                                                            </td>
                                                            <td style={{"width":"15%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                    <CompMetric01 
                                                                        value={objectStats['clusterSummary']?.['p95'] || 0}
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
                                                            <td style={{"width":"55%", "padding-right": "1em"}}>  
                                                                    <CustomLabel label="Description">{metricInfo['description']}</CustomLabel>
                                                            </td>
                                                            <td style={{"width":"30%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "2em"}}>  
                                                                   <CustomLabel label="Advise">{metricInfo['advise']}</CustomLabel>
                                                            </td>
                                                            <td style={{"width":"15%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "2em"}}>  
                                                                   <CustomLabel label="Unit">{metricInfo['unit']}</CustomLabel>
                                                            </td>
                                                        </tr>
                                                </table>  
                                                <br/>       
                                                <ChartLine04 series={JSON.stringify([
                                                                           { name : "avg", data : objectStats['clusterChart']?.['avg'] },
                                                                           { name : "min", data : objectStats['clusterChart']?.['min'] },
                                                                           { name : "max", data : objectStats['clusterChart']?.['max'] },
                                                                           { name : "p90", data : objectStats['clusterChart']?.['p90'] },
                                                                           { name : "p95", data : objectStats['clusterChart']?.['p95'] },
                                                                           
                                                                        ])} 
                                                                        title={""} height="280px" 
                                                />
                                                
                                                
                                                <CustomTable02
                                                        columnsTable={columnsTableNodes}
                                                        visibleContent={visibleContentNodes}
                                                        dataset={objectStats['nodes']}
                                                        title={"Nodes"}
                                                        description={""}
                                                        pageSize={20}
                                                        onSelectionItem={( item ) => {
                                                            cacheClusterId.current = item[0]?.["CacheClusterId"];
                                                            setsplitPanelShow(true);
                                                            gatherNodeStats();
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

