import {useState,useEffect,useRef} from 'react'
import Axios from 'axios'
import { configuration, SideMainLayoutHeader,SideMainLayoutMenu } from './Configs';
import { createSearchParams } from "react-router-dom";

import { applicationVersionUpdate, getMatchesCountText, paginationLabels, pageSizePreference, EmptyState } from '../components/Functions';
import { createLabelFunction } from '../components/Functions';


import SideNavigation from '@cloudscape-design/components/side-navigation';
import AppLayout from '@cloudscape-design/components/app-layout';

import { useCollection } from '@cloudscape-design/collection-hooks';
import {CollectionPreferences,Pagination } from '@cloudscape-design/components';
import TextFilter from "@cloudscape-design/components/text-filter";

import Table from "@cloudscape-design/components/table";

import Flashbar from "@cloudscape-design/components/flashbar";

import { SplitPanel } from '@cloudscape-design/components';
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import CustomHeader from "../components/Header";

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


//-- Encryption
var CryptoJS = require("crypto-js");

function Application() {

    //-- Application Version
    const [versionMessage, setVersionMessage] = useState([]);
    const [importProcessList, setImportProcessList] = useState([]);
  
    //-- Add Header Cognito Token
    Axios.defaults.headers.common['x-csrf-token'] = sessionStorage.getItem("x-csrf-token");
    Axios.defaults.headers.common['x-token-cognito'] = sessionStorage.getItem("x-token-cognito");
    Axios.defaults.withCredentials = true;
    
    //-- Split Panel
    const [splitPanelShow,setsplitPanelShow] = useState(false);
    const [splitPanelSize, setSplitPanelSize] = useState(400);
    
    
    //-- Table Variables
    
    const columnsTable = [
                  {id: 'resource_id',header: 'Identifer',cell: item => item['resource_id'],ariaLabel: createLabelFunction('resource_id'),sortingField: 'seq',},
                  {id: 'resource_type',header: 'ResorceType',cell: item => item['resource_type'] || "-",ariaLabel: createLabelFunction('resource_type'),sortingField: 'resource_type',},
                  {id: 'resource_name',header: 'ResourceName',cell: item => item['resource_name'],ariaLabel: createLabelFunction('resource_name'),sortingField: 'resource_name',},
                  {id: 'user_id',header: 'Owner',cell: item => item['user_id'],ariaLabel: createLabelFunction('user_id'),sortingField: 'user_id',},
                  {id: 'region',header: 'Region',cell: item => item['region'],ariaLabel: createLabelFunction('region'),sortingField: 'region',},
                  {id: 'interval',header: 'Interval',cell: item => item['interval'],ariaLabel: createLabelFunction('interval'),sortingField: 'interval',},
                  {id: 'period',header: 'Period',cell: item => item['period'],ariaLabel: createLabelFunction('period'),sortingField: 'period',},
                  {id: 'start_date',header: 'StartDate',cell: item => item['start_date'],ariaLabel: createLabelFunction('start_date'),sortingField: 'start_date',},
                  {id: 'end_date',header: 'endDate',cell: item => item['end_date'],ariaLabel: createLabelFunction('end_date'),sortingField: 'end_date',},
                  {id: 'exp_id',header: 'ExportId',cell: item => item['exp_id'],ariaLabel: createLabelFunction('exp_id'),sortingField: 'exp_id',},
                  {id: 'imp_id',header: 'ImportId',cell: item => item['imp_id'],ariaLabel: createLabelFunction('imp_id'),sortingField: 'imp_id',},
    ];
    const visibleContent = ['resource_id', 'resource_type', 'resource_name', 'user_id', 'exp_id', 'imp_id', 'region', 'interval', 'period'];
    
    const [selectedItems,setSelectedItems] = useState([{ seq : "" }]);

    const visibleContentPreference = {
              title: 'Select visible content',
              options: [
                {
                  label: 'Main properties',
                  options: columnsTable.map(({ id, header }) => ({ id, label: header, editable: id !== 'id' })),
                },
              ],
    };

   const collectionPreferencesProps = {
            pageSizePreference,
            visibleContentPreference,
            cancelLabel: 'Cancel',
            confirmLabel: 'Confirm',
            title: 'Preferences',
    };
    
    
    const [preferences, setPreferences] = useState({ pageSize: 10, visibleContent: visibleContent });
    
    const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
                importProcessList,
                {
                  filtering: {
                    empty: <EmptyState title="No records" />,
                    noMatch: (
                      <EmptyState
                        title="No matches"
                        action={<Button onClick={() => actions.setFiltering('')}>Clear filter</Button>}
                      />
                    ),
                  },
                  pagination: { pageSize: preferences.pageSize },
                  sorting: {},
                  selection: {},
                }
    );
    
    
    
    
    
   
   //-- Gather Import Process
   async function gatherImportProcess (){
    
        try {
            
            
            var api_url = configuration["apps-settings"]["api-url"];
            var params = {
                            userId : "snmatus@amazon.com",
                            tableName : configuration["apps-settings"]["table-metadata-dynamodb"],
                            
            };
            Axios.get(`${api_url}/api/aws/metric/analyzer/clw/get/imports/`,{
                      params: params, 
                  }).then((data)=>{
                   console.log(data);
                   setImportProcessList(data.data.items);
                   if (data.data.items.length > 0) {
                        setSelectedItems([data.data.items[0]]);
                        setsplitPanelShow(true);
                   }
                        
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/aws/metric/analyzer/clw/get/imports/' );
                  console.log(err);
                  
              });
            
        }
        catch{
        
          console.log('Timeout API error : /api/aws/metric/analyzer/clw/get/imports/');                  
          
        }
    
    }
    
    function onClickOpenAnalyzer(){
        
            // Add CSRF Token
            Axios.defaults.headers.common['x-csrf-token'] = sessionStorage.getItem("x-csrf-token");
            
            
            
            
            // Select engine type
            var pathName = "";
             switch (selectedItems[0]['resource_type']) {
                  case "elasticache":
                    pathName = "/sm-elasticache-01";
                    break;
                  
                  case "dynamodb":
                    pathName = "/sm-dynamodb-01";
                    break;
                  
                  default:
                     break;
            }
            
            var id = CryptoJS.AES.encrypt(JSON.stringify({
                                                                    userId: selectedItems[0]['user_id'],
                                                                    resourceId: selectedItems[0]['resource_id'],
                                                                    expId: selectedItems[0]['exp_id'],
                                                                    impId: selectedItems[0]['imp_id'],
                                                                    resourceName : selectedItems[0]['resource_name'],
                                                                    resourceType : selectedItems[0]['resource_type'],
                                                                    startDate : selectedItems[0]['start_date'],
                                                                    endDate : selectedItems[0]['end_date'],
                                                                            }), 
                                                            sessionStorage.getItem("x-token-cognito")
                                                            ).toString();
                                                            
            window.open( pathName + '?' + createSearchParams({
                                id: id
                                }).toString() ,'_blank');

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
        gatherImportProcess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    
    
    
  return (
    <div>
        <CustomHeader/>
        <AppLayout
            disableContentPaddings
            toolsHide
            navigation={<SideNavigation activeHref={"/dashboard/"} items={SideMainLayoutMenu} header={SideMainLayoutHeader} />}
            contentType="default"
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
                                    header={
                                        <Header
                                          variant="h3"
                                          actions={
                                                  <SpaceBetween
                                                    direction="horizontal"
                                                    size="xs"
                                                  >
                                                    <Button variant="primary" onClick={() => { onClickOpenAnalyzer(); }}>Open Analyzer</Button>
                                                  </SpaceBetween>
                                          }
                                          
                                        >
                                         {"Identifier : " + selectedItems[0]['resource_id']}
                                        </Header>
                                    } 
                                    i18nStrings={splitPanelI18nStrings} 
                                    closeBehavior="hide"
                                    onSplitPanelToggle={({ detail }) => {
                                        
                                        }
                                      }
                      >
                            <table style={{"width":"100%", "padding": "1em"}}>
                                <tr>  
                                    <td style={{"width":"100%", "padding-left": "1em"}}>  
                                        {selectedItems[0]['resource_type']}
                                    </td>
                                </tr>
                            </table>  
                            
                            
                      </SplitPanel>
            }
            content={
                
                <div style={{"padding" : "2em"}}>
                    <Table
                          {...collectionProps}
                          selectionType="single"
                          header={
                            <Header
                              variant="h2"
                              counter= {"(" + importProcessList.length + ")"} 
                              description={"List of processed metrics for analysis"}
                              actions={
                                    <SpaceBetween
                                      direction="horizontal"
                                      size="xs"
                                    >
                                      <Button variant="primary" onClick={onClickOpenAnalyzer}>Open Analyzer</Button>
                                    </SpaceBetween>
                                  }
                            >
                              Analyzer Processes
                            </Header>
                          }
                          columnDefinitions={columnsTable}
                          visibleColumns={preferences.visibleContent}
                          items={items}
                          pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
                          filter={
                            <TextFilter
                              {...filterProps}
                              countText={getMatchesCountText(filteredItemsCount)}
                              filteringAriaLabel="Filter records"
                            />
                          }
                          preferences={
                            <CollectionPreferences
                              {...collectionPreferencesProps}
                              preferences={preferences}
                              onConfirm={({ detail }) => setPreferences(detail)}
                            />
                          }
                          onSelectionChange={({ detail }) => {
                              setSelectedItems(detail.selectedItems);
                              setsplitPanelShow(true);
                              }
                            }
                          selectedItems={selectedItems}
                          resizableColumns
                          stickyHeader
                          loadingText="Loading records"
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

