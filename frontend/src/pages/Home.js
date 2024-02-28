import {useState,useEffect} from 'react'

import { applicationVersionUpdate } from '../components/Functions';
import Flashbar from "@cloudscape-design/components/flashbar";
import CustomHeader from "../components/Header";
import ContentLayout from '@awsui/components-react/content-layout';
import { configuration } from './Configs';

import Button from "@awsui/components-react/button";
import Container from "@awsui/components-react/container";
import Header from "@awsui/components-react/header";
import Box from "@awsui/components-react/box";
import ColumnLayout from "@awsui/components-react/column-layout";
import Badge from "@awsui/components-react/badge";

import '@aws-amplify/ui-react/styles.css';


function Home() {
  
  //-- Application Version
  const [versionMessage, setVersionMessage] = useState([]);
  
  
  //-- Call API to App Version
   async function gatherVersion (){

        //-- Application Update
        var appVersionObject = await applicationVersionUpdate({ codeId : "dbwcmp", moduleId: "home"} );
        
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
  return (
      
    <div>
      <CustomHeader
            activeHref={"/#"}
            content={
            
            
            <ContentLayout 
                    header = {
                             <>
                                <Flashbar items={versionMessage} />
                                <br/>
                                <Header variant="h1">
                                            Welcome to {configuration["apps-settings"]["application-title"]}
                                </Header>
                                <Box fontSize="heading-s">
                                    Generate Real-Time Database Workloads on your AWS Database instances and clusters, so you can quickly simulate real world loads and visualize how your system respond.
                                </Box>
                                <br/>
                            </>
                              
                              
                          }
                          
              >
            
              <div>
                    <ColumnLayout columns={2} >
                      
                      <div>
                          <Container
                                header = {
                                  <Header variant="h2">
                                    How it works?
                                  </Header>
                                  
                                }
                            >
                                  <div>
                                            <Badge>1</Badge> Select database resources for workload testing
                                            <br/>
                                            <br/>
                                            <Badge>2</Badge> Setup workload scenario
                                            <br/>
                                            <br/>
                                            <Badge>3</Badge> Start workload testing
                                            <br/>
                                            <br/>
                                            <Badge>4</Badge> Visualize on real-time workload metrics
                                  </div>
                        </Container>
                        
                    </div>
                    
                    <div>
                          <Container
                                header = {
                                  <Header variant="h2">
                                    Getting Started
                                  </Header>
                                  
                                }
                            >
                                  <div>
                                    <Box variant="p">
                                        Start performing database workloads for your AWS RDS instances or Amazon Aurora, ElastiCache, MemoryDB, DocumentDB clusters.
                                    </Box>
                                    <br/>
                                    <Button variant="primary" href="/elasticache/single" >Get Started</Button>
                                    <br/>
                                    <br/>
                                  </div>
                        </Container>
                        
                    </div>
                    
                
                </ColumnLayout>
                <br/>
                <Container
                            header = {
                              <Header variant="h2">
                                Use cases
                              </Header>
                              
                            }
                        >
                               <ColumnLayout columns={1} variant="text-grid">
                                    <div>
                                      <Header variant="h3">
                                        Compare Database Architectures
                                      </Header>
                                      <Box variant="p">
                                        Perform workload testing to compare database architectures, different instance sizes or number of nodes.
                                      </Box>
                                    </div>
                                    <div>
                                      <Header variant="h3">
                                        Compare Database Versions
                                      </Header>
                                      <Box variant="p">
                                        Perform workload testing to compare database versions, minor or major releases.
                                      </Box>
                                    </div>
                                    <div>
                                      <Header variant="h3">
                                        Compare Database Configurations
                                      </Header>
                                      <Box variant="p">
                                        Perform workload testing to compare configurations parameters and database settings.
                                      </Box>
                                    </div>
                                    
                              </ColumnLayout>
      
                    </Container>
                    
                    
                </div>
                </ContentLayout>
            
            
            }
        />
    </div>
    
  );
}

export default Home;
