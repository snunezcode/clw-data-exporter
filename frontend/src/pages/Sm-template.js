import {useState,useEffect,useRef} from 'react'
import Axios from 'axios'
import { configuration } from './Configs';

import { applicationVersionUpdate, classMetrics, customFormatNumber } from '../components/Functions';
import { createLabelFunction } from '../components/Functions';

import Flashbar from "@cloudscape-design/components/flashbar";
import FormField from "@awsui/components-react/form-field";

import ProgressBar from "@awsui/components-react/progress-bar";
import Select from "@awsui/components-react/select";
import ExpandableSection from "@awsui/components-react/expandable-section";
import SpaceBetween from "@awsui/components-react/space-between";
import Box from "@awsui/components-react/box";
import Button from "@awsui/components-react/button";
import Container from "@awsui/components-react/container";
import CustomHeader from "../components/Header";

import CompMetric01  from '../components/Metric01';
import ChartLine02  from '../components/ChartLine02';
import CustomTable from "../components/Table01";
import ChartProgressBar01 from '../components/ChartProgressBar-01';

import Header from "@awsui/components-react/header";
import '@aws-amplify/ui-react/styles.css';

function Application() {

    //-- Application Version
    const [versionMessage, setVersionMessage] = useState([]);
    const workloadStarted = useRef(false);
    const workloadStatus = useRef("");
    const [workloadState, setWorkloadState] = useState(new Date());
  
    //-- Add Header Cognito Token
    Axios.defaults.headers.common['x-csrf-token'] = sessionStorage.getItem("x-csrf-token");
    Axios.defaults.headers.common['x-token-cognito'] = sessionStorage.getItem("x-token-cognito");
    Axios.defaults.withCredentials = true;
    
    //-- Input Fields
    const inputThreadsPutItem = useRef(5);
    const inputThreadsGetItem = useRef(2);
    const inputThreadsQuery = useRef(1);
    const inputThreadsIndex = useRef(1);
    const inputDelay = useRef(0);
    const inputMasterCycle = useRef(200);
    const inputChildCycle = useRef(10);
    const inputItemSize = useRef(128);
    const inputRangeId = useRef(1000);
    const inputMode = useRef("Eventually");
    
    const [selectedMode,setSelectedMode] = useState({label: "Eventually",value: "Eventually"});
    const [selectedTable,setSelectedTable] = useState({label: "",value: ""});
    const [tableList,setTableList] = useState([]);
    const tableDetails = useRef({});
    
    const [regionList,setRegionList] = useState([]);
    const [selectedRegion,setSelectedRegion] = useState({label: "us-east-1",value: "us-east-1"});
    const regionDetails = useRef({ label : "us-east-1", value : "us-east-1" });
    
    
    const objMetrics = useRef(new classMetrics({ metrics :
                                                        [
                                                            { name : "operations", type : 1, history : 40 },
                                                            { name : "writeCalls", type : 1, history : 40 },
                                                            { name : "readCalls", type : 1, history : 40 },
                                                            { name : "wcu", type : 1, history : 40 },
                                                            { name : "rcu", type : 1, history : 40 },
                                                            { name : "wcuTotal", type : 2, history : 40 },
                                                            { name : "rcuTotal", type : 2, history : 40 },
                                                            { name : "totalCu", type : 1, history : 40 },
                                                            { name : "errors", type : 1, history : 40 },
                                                            { name : "totalErrors", type : 2, history : 40 },
                                                            { name : "threads", type : 2, history : 40 },
                                                        ]
                                                })
                            );
    
    const [workloadStats, setWorkloadStats] = useState({
                                                            status : "-",
                                                            operations : 0,
                                                            totalOperations : 0,
                                                            operationsCompleted : 0,
                                                            totalErrors : 0,
                                                            writeCalls : 0,
                                                            readCalls : 0,
                                                            wcu : 0,
                                                            rcu : 0,
                                                            totalCu : 0,
                                                            wcuTotal : 0,
                                                            rcuTotal : 0,
                                                            errors : 0,
                                                            threads : 0,
                                                            progress : 0,
                                                            threadList : [],
                                                            history : {
                                                                operations : [],
                                                                writeCalls : [],
                                                                readCalls : [],
                                                                wcu : [],
                                                                rcu : [],
                                                                totalCu : [],
                                                                errors : [],
                                                                threads : [],
                                                            }
                    
        
    });
    
    
    //-- Table Variables
    const columnsTable = [
                  {id: 'threadId',header: 'ThreadId',cell: item => item['threadId'],ariaLabel: createLabelFunction('threadId'),sortingField: 'threadId',},
                  {id: 'type',header: 'Type',cell: item => item['type'] || "-",ariaLabel: createLabelFunction('type'),sortingField: 'type',},
                  {id: 'operations',header: 'Operations',cell: item => item['operations'].toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0}),ariaLabel: createLabelFunction('operations'),sortingField: 'operations',},
                  {id: 'rcu',header: 'RCU Consumed',cell: item => item['rcu'].toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0}) || "-",ariaLabel: createLabelFunction('rcu'),sortingField: 'rcu',},
                  {id: 'wcu',header: 'WCU Consumed',cell: item => item['wcu'].toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0}),ariaLabel: createLabelFunction('wcu'),sortingField: 'wcu',},
                  {id: 'errors',header: 'Errors',cell: item => item['errors'].toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0}),ariaLabel: createLabelFunction('errors'),sortingField: 'errors',},
                  {id: 'progress',header: 'Progress',cell: item => <ProgressBar value={item['progress']} />,ariaLabel: createLabelFunction('progress'),sortingField: 'progress',},
    ];
    const visibleContent = ['threadId', 'type', 'operations', 'rcu', 'wcu', 'errors', 'progress'];
    
    
    
    
   
   //-- Call API to Start Workload
   async function startWorkload (){
    
        try {
            
            console.log(regionDetails.current.value);
            
            var tableInfo = tableDetails.current.value.split("|");
            var api_url = configuration["apps-settings"]["api-url"];
            var params = {
                            region : regionDetails.current.value,
                            tableName : tableInfo[0],
                            tablePK : tableDetails.current.pkName,
                            indexName : tableInfo[1],
                            indexPK : tableDetails.current.pkNameIndex,
                            delay : inputDelay.current.value,
                            masterCycle : inputMasterCycle.current.value,
                            childCycle : inputChildCycle.current.value,
                            putItemThreads : inputThreadsPutItem.current.value,
                            getItemThreads : inputThreadsGetItem.current.value,
                            queryThreads : inputThreadsQuery.current.value,
                            indexThreads : (tableInfo[1] == "baseTable" ? 0 : inputThreadsIndex.current.value),
                            itemSize : inputItemSize.current.value,
                            rangeId : inputRangeId.current.value,
                            mode : inputMode.current,
            };
            Axios.get(`${api_url}/api/workload/dynamodb/start`,{
                      params: params, 
                  }).then((data)=>{
                   console.log(data);
                   workloadStatus.current = "-";
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/workload/dynamodb/start' );
                  console.log(err);
                  
              });
             
            
        }
        catch{
        
          console.log('Timeout API error : /api/workload/dynamodb/start');                  
          
        }
        
        workloadStarted.current = true;
        setWorkloadState(new Date());
    }
    
    
    
    //-- Call API to Stop Workload
    async function stopWorkload (){
        
    
        try{
        
            var api_url = configuration["apps-settings"]["api-url"];
            var params = {};
            Axios.get(`${api_url}/api/workload/dynamodb/stop`,{
                      params: params, 
                  }).then((data)=>{
                   
                   console.log(data);
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/workload/dynamodb/stop' );
                  console.log(err);
                  
              });
              
        }
        catch{
        
          console.log('Timeout API error : /api/workload/dynamodb/stop');                  
          
        }
        
        workloadStarted.current = false;
        setWorkloadState(new Date());
        
    }
    
    
    
    
    
    //-- Call API to Terminate Workload
    async function terminateWorkload (){
        stopWorkload ();
    }
    
    
    
    
    
    
    //-- Call API to gather tables
    async function gatherTables (){
        
        try{
        
            var api_url = configuration["apps-settings"]["api-url"];
            var params = {
                            region : regionDetails.current.value,
                         };
            Axios.get(`${api_url}/api/workload/dynamodb/table/list`,{
                      params: params, 
                  }).then((data)=>{
                   
                   console.log(data);
                   
                        
                   if (data.data.tables.length > 0) {
                        var options = [];
                        data.data.tables.forEach(function(item) {
                            
                            options.push({ label : item.tableName + " | " + item.index, value : item.tableName + "|" + item.index, capacity : (item.rcu == -1 ? "On-Demand" : "RCU:" + String(item.rcu) + ", WCU:" + String(item.wcu) ),  ...item });
                           
                        });
                        setTableList(options);
                        //-- Testing
                        setSelectedTable(options[9]);
                        tableDetails.current = options[9];
                   }
                   else {
                       setTableList([]);
                       setSelectedTable({});
                       tableDetails.current = {};
                        
                   }
                   
                   
                   
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/workload/dynamodb/table/list' );
                  console.log(err);
                  setTableList([]);
                  setSelectedTable({});
                  tableDetails.current = {};
                  
              });
              
              
              
              
        }
        catch{
        
          console.log('Timeout API error : /api/workload/dynamodb/table/list');                  
          
        }
        
        workloadStarted.current = false;
        setWorkloadState(new Date());
        
    }
    
    
    //-- Call API to gather tables
    async function gatherRegions (){
        
        try{
        
            var api_url = configuration["apps-settings"]["api-url"];
            var params = {};
              
              Axios.get(`${api_url}/api/workload/dynamodb/region/list`,{
                      params: params, 
                  }).then((data)=>{
                   
                   console.log(data);
                   if (data.data.regions.length > 0) {
                       
                        var regions = [];
                        data.data.regions.forEach(function(item) {
                            
                            regions.push({ label : item, value : item });
                           
                        });
                        setRegionList(regions);
                        //-- Testing
                        setSelectedRegion(regions[19]);
                        regionDetails.current = regions[19];
                        
                        
                   }
                   
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/workload/dynamodb/region/list' );
                  console.log(err);
                  
              });
              
        }
        catch{
        
          console.log('Timeout API error : /api/workload/dynamodb/region/list');                  
          
        }
        
        
    }
    
   
   //-- Call API to Status Workload
   async function statusWorkload (){
        
         
        try{
        
            var api_url = configuration["apps-settings"]["api-url"];
        
            Axios.get(`${api_url}/api/workload/dynamodb/status`).then((data)=>{
                   
                    console.log(data);
                    
                    if (data.data.status == "completed" ){
                        workloadStarted.current = false;
                        setWorkloadState(new Date());
                    }
                    objMetrics.current.newSnapshot({ 
                                                        operations : data.data.operationsCompleted,
                                                        writeCalls : data.data.writeCalls,
                                                        readCalls : data.data.readCalls,
                                                        wcu : data.data.wcu,
                                                        rcu : data.data.rcu,
                                                        totalCu : data.data.totalCu,
                                                        wcuTotal : data.data.wcu,
                                                        rcuTotal : data.data.rcu,
                                                        errors : data.data.errors,
                                                        totalErrors : data.data.errors,
                                                        threads : data.data.threads
                                                },
                                                (new Date()).getTime()
                    );
                    
                    setWorkloadStats({
                                        ...objMetrics.current.getMetricList(), 
                                        progress : data.data.progress, 
                                        totalOperations : data.data.totalOperations, 
                                        operationsCompleted : data.data.operationsCompleted,
                                        status : data.data.operationsCompleted,
                                        threadList : data.data.threadList,
                    });
                    
                           
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/workload/dynamodb/status' );
                  console.log(err);
                  
              });

        }
        catch{
        
          console.log('Timeout API error : /api/workload/dynamodb/status');                  
          
        }
        
        
        
    }
    
    
    function onClickStartWorkload(){
        startWorkload();
    }
    
    function onClickStopWorkload(){
        stopWorkload();
    }
    
    
    function onClickTerminateWorkload(){
        terminateWorkload();
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
        gatherVersion();
        gatherRegions();
        gatherTables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        const id = setInterval(statusWorkload, configuration["apps-settings"]["refresh-interval"]);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    
    
  return (
    <div>
        <CustomHeader
            activeHref={"/dynamodb/single"}
            content={
                
                <>
                                <br/>
                                <Container
                                    header={
                                        <Header
                                          variant="h2"
                                          description={"Model to perform table workload testing for Amazon DynamoDB service"}
                                        >
                                          Table Workload Model
                                        </Header>
                                      }
                                >   
                                        <table style={{"width":"100%"}}>
                                            <tr> 
                                                <td style={{"width":"15%", "padding-left": "1em", "padding-right": "2em"}}>  
                                                        <FormField
                                                            description="Region"
                                                            stretch={true}
                                                          > 
                                                            <Select
                                                                    disabled={(workloadStarted.current)}
                                                                    selectedOption={selectedRegion}
                                                                    onChange={({ detail }) => {
                                                                            setSelectedRegion(detail.selectedOption);
                                                                            regionDetails.current = detail.selectedOption;
                                                                            gatherTables();
                                                                            }
                                                                        }
                                                                    options={regionList}
                                                                    filteringType="auto"
                                                            />
                                                                    
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"35%", "padding-left": "1em", "padding-right": "2em"}}>  
                                                        <FormField
                                                            description="Table | GSI"
                                                            stretch={true}
                                                          > 
                                                            <Select
                                                                    disabled={(workloadStarted.current)}
                                                                    selectedOption={selectedTable}
                                                                    onChange={({ detail }) => {
                                                                            setSelectedTable(detail.selectedOption);
                                                                            tableDetails.current = detail.selectedOption;
                                                                            }
                                                                        }
                                                                    options={tableList}
                                                                    filteringType="auto"
                                                            />
                                                                    
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                    <Box variant="awsui-key-label">Partition Key</Box>
                                                    <div>{selectedTable['pkName']}</div>
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                    <Box variant="awsui-key-label">Items</Box>
                                                    <div>{parseFloat(selectedTable['items']).toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0})}</div>
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                    <Box variant="awsui-key-label">Size(Bytes)</Box>
                                                    <div>{customFormatNumber(selectedTable['size'],1)}</div>
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                    <Box variant="awsui-key-label">Capacity</Box>
                                                    <div>{selectedTable['capacity']}</div>
                                                </td>
                                            </tr> 
                                        </table>
                                        <br/>
                                        <ExpandableSection
                                          variant="footer"
                                          headerText="Configuration"
                                        >
                                        <table style={{"width":"100%"}}>
                                            <tr> 
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="PutItem(Threads)"
                                                            stretch={true}
                                                          >
                                                        <input type="number" ref={inputThreadsPutItem} disabled={(workloadStarted.current)} defaultValue="5" />
                                                        </FormField>
                                                </td> 
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="GetItem(Threads)"
                                                            stretch={true}
                                                        >
                                                        <input type="number" ref={inputThreadsGetItem} disabled={(workloadStarted.current)} defaultValue="2" />
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="Query(Threads)"
                                                            stretch={true}
                                                          >
                                                        <input type="number" ref={inputThreadsQuery} disabled={(workloadStarted.current)} defaultValue="1" />
                                                        </FormField>
                                                </td> 
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="GSI(Threads)"
                                                            stretch={true}
                                                          > 
                                                            <input type="number" ref={inputThreadsIndex} disabled={(workloadStarted.current)} defaultValue="1" />
                                                                    
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="MasterCycle"
                                                            stretch={true}
                                                          > 
                                                            <input type="number" ref={inputMasterCycle} disabled={(workloadStarted.current)} defaultValue="200" />
                                                        </FormField>
                                                </td>
                                            </tr>
                                        </table>
                                        <table style={{"width":"100%"}}>
                                            <tr> 
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="ChildCycle"
                                                            stretch={true}
                                                          > 
                                                            <input type="number" ref={inputChildCycle} disabled={(workloadStarted.current)} defaultValue="10" />
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="Delay"
                                                            stretch={true}
                                                          > 
                                                            <input type="number" ref={inputDelay} disabled={(workloadStarted.current)} defaultValue="0" />
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="ItemSize(Bytes)"
                                                            stretch={true}
                                                          > 
                                                            <input type="number" ref={inputItemSize} disabled={(workloadStarted.current)} defaultValue="128" />
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="RangeId"
                                                            stretch={true}
                                                          > 
                                                            <input type="number" ref={inputRangeId} disabled={(workloadStarted.current)} defaultValue="1000" />
                                                        </FormField>
                                                </td>
                                                <td style={{"width":"20%", "padding-left": "1em"}}>  
                                                        <FormField
                                                            description="Read mode"
                                                            stretch={true}
                                                          > 
                                                            <Select
                                                                    disabled={(workloadStarted.current)}
                                                                    selectedOption={selectedMode}
                                                                    onChange={({ detail }) => {
                                                                            setSelectedMode(detail.selectedOption);
                                                                            inputMode.current = detail.selectedOption.value;
                                                                            }
                                                                        }
                                                                    options={[
                                                                        {   
                                                                          label: "Eventually",
                                                                          value: "Eventually"
                                                                        },
                                                                        {
                                                                          label: "Strongly",
                                                                          value: "Strongly"
                                                                        },
                                                                    ]}
                                                            />
                                                                    
                                                        </FormField>
                                                </td> 
                                            </tr> 
                                        </table>
                                        </ExpandableSection>
                                        <br/>
                                        <Box float="right">
                                              <SpaceBetween direction="horizontal" size="xs">
                                                <Button variant="secondary" onClick={onClickTerminateWorkload}>Terminate Workload</Button>
                                                <Button disabled={!(workloadStarted.current)}  variant="primary" onClick={onClickStopWorkload}>Stop Workload</Button>
                                                <Button disabled={workloadStarted.current}  variant="primary" onClick={onClickStartWorkload}>Start Workload</Button>
                                              </SpaceBetween>
                                        </Box>
                                </Container>
                                <br/>
                                <Container
                                    
                                    header={
                                        <Header
                                          variant="h2"
                                        >
                                          Performance Metrics
                                        </Header>
                                      }
                                
                                >
                                    
                                    
                                    
                                    <table style={{"width":"100%"}}>
                                            <tr>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                        <CompMetric01 
                                                            value={workloadStats['threads'] || 0}
                                                            title={"Total threads"}
                                                            precision={0}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"16px"}
                                                        />
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                        <CompMetric01 
                                                            value={workloadStats['totalOperations'] || 0}
                                                            title={"Operations (Total)"}
                                                            precision={0}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"16px"}
                                                        />
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                        <CompMetric01 
                                                            value={workloadStats['operationsCompleted'] || 0}
                                                            title={"Operations (Completed)"}
                                                            precision={0}
                                                            format={3}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"16px"}
                                                        />
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                        <CompMetric01 
                                                            value={workloadStats['totalErrors'] || 0}
                                                            title={"Total errors"}
                                                            precision={0}
                                                            format={1}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"16px"}
                                                        />
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                        <CompMetric01 
                                                            value={workloadStats['rcuTotal'] || 0}
                                                            title={"Total RCUs Consumed"}
                                                            precision={0}
                                                            format={1}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"16px"}
                                                        />
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                        <CompMetric01 
                                                            value={workloadStats['wcuTotal'] || 0}
                                                            title={"Total WCUs Consumed"}
                                                            precision={0}
                                                            format={1}
                                                            fontColorValue={configuration.colors.fonts.metric100}
                                                            fontSizeValue={"16px"}
                                                        />
                                                </td>
                                                <td style={{"width":"10%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                    <ProgressBar
                                                      value={workloadStats['progress']}
                                                      label="Progress"
                                                    />
                                                </td>
                                            </tr>
                                    </table>  
                                    
                                    <br />
                                    <br />
                                    <table style={{"width":"100%"}}>
                                      <tr>  
                                        <td style={{"width":"10%","padding-left": "1em"}}> 
                                                <CompMetric01 
                                                    value={workloadStats['operations'] || 0}
                                                    title={"Operations/sec"}
                                                    precision={0}
                                                    format={1}
                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                    fontSizeValue={"24px"}
                                                />
                                        </td>
                                        <td style={{"width":"10%","padding-left": "1em"}}> 
                                                <CompMetric01 
                                                    value={workloadStats['writeCalls'] || 0}
                                                    title={"WriteCalls/sec"}
                                                    precision={0}
                                                    format={1}
                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                    fontSizeValue={"16px"}
                                                />
                                            <br/>
                                            <br/>
                                                <CompMetric01 
                                                    value={workloadStats['readCalls'] || 0}
                                                    title={"ReadCalls/sec"}
                                                    precision={0}
                                                    format={1}
                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                    fontSizeValue={"16px"}
                                                />
                                            <br/>
                                            <br/>
                                                <CompMetric01 
                                                    value={workloadStats['errors'] || 0}
                                                    title={"Errors/sec"}
                                                    precision={0}
                                                    format={1}
                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                    fontSizeValue={"16px"}
                                                />
                                        </td>
                                        <td style={{"width":"50%","padding-left": "1em"}}> 
                                                <ChartLine02 series={JSON.stringify([
                                                                           workloadStats['history']['readCalls'],
                                                                           workloadStats['history']['writeCalls'],
                                                                           workloadStats['history']['errors'],
                                                                        ])} 
                                                                        title={"Operations/sec"} height="230px" 
                                                />
                                                
                                        </td>
                                      </tr>
                                    </table>
                                    <br />
                                    <br />
                                    <table style={{"width":"100%"}}>
                                      <tr>  
                                        <td style={{"width":"10%","padding-left": "1em"}}> 
                                                <CompMetric01 
                                                    value={workloadStats['totalCu'] || 0}
                                                    title={"TotalCapacityUnits/sec"}
                                                    precision={0}
                                                    format={1}
                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                    fontSizeValue={"24px"}
                                                />
                                        </td>
                                        <td style={{"width":"10%","padding-left": "1em"}}> 
                                                <CompMetric01 
                                                    value={workloadStats['wcu'] || 0}
                                                    title={"WriteCapacityUnits/sec"}
                                                    precision={0}
                                                    format={1}
                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                    fontSizeValue={"16px"}
                                                />
                                            <br/>
                                            <br/>
                                                <CompMetric01 
                                                    value={workloadStats['rcu'] || 0}
                                                    title={"ReadCapacityUnits/sec"}
                                                    precision={0}
                                                    format={1}
                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                    fontSizeValue={"16px"}
                                                />
                                        </td>
                                        <td style={{"width":"50%","padding-left": "1em"}}> 
                                                <ChartLine02 series={JSON.stringify([
                                                                           workloadStats['history']['rcu'],
                                                                           workloadStats['history']['wcu'],
                                                                        ])} 
                                                                        title={"CapacityUnitsConsumed/sec"} height="230px" 
                                                />
                                                
                                        </td>
                                      </tr>
                                    </table>
                                    
                                </Container>
                            
                                <br/>
                                <Container
                                    disableContentPaddings
                                >
                                    <CustomTable
                                      columnsTable={columnsTable}
                                      visibleContent={visibleContent}
                                      dataset={workloadStats['threadList']}
                                      title={"Workload Threads"}
                                      description={""}
                                    />
                                </Container>
                                
         
                </>
                
                
                
            }
        />
    </div>
  );
}

export default Application;

