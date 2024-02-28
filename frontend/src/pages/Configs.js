

export const configuration = 
{
    "apps-settings": {
        "refresh-interval": 5*1000,
        "api-url": "",
        "release" : "0.1.0",
        "application-title": "Deep Performance Analyzer 360",
        "version-code-url" : "https://version.code.ds.wwcs.aws.dev/",
        "convert-Gbps-Bytesps" : 125000000,
        "table-metadata-dynamodb" : "tblDPA360",
        "table-metadata-metric-calog" : "tblDPA360MetricCatalog",
        "table-metric-catalog" : "tblClwMetricCatalog",
        "table-metrics-elasticache" : "dbDPA360.tblElasticache",
        "table-metrics-dynamodb" : "dbDPA360.tblDynamoDB",
    },
    "colors": {
        "fonts" : {
            "metric102" : "#4595dd",
            "metric101" : "#e59400",
            "metric100" : "#e59400",
        },
        "lines" : {
            "separator100" : "#737c85",
            "separator101" : "#e7eaea",
            
        }
    }
    
};

export const SideMainLayoutHeader = { text: 'Home', href: '/' };

export const SideMainLayoutMenu = [
    {
      text: 'Dashboard',
      type: 'section',
      defaultExpanded: true,
      items: [
          { type: "link", text: "Analyzer processes", href: "/dashboard/" },
      ],
    },
    { type: "divider" },
    { type: "link", text: "Settings", href: "#" },
    {
          type: "link",
          text: "Documentation",
          href: "https://github.com/snunezcode/db-workload-tool/",
          external: true,
          externalIconAriaLabel: "Opens in a new tab"
    },
     
  ];

export const breadCrumbs = [{text: 'Service',href: '#',},{text: 'Resource search',href: '#',},];



  