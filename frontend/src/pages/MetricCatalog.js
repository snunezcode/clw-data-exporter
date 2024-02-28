export const metricCatalog = 
{
   "dynamodb" :
        [
            {
              "label": "Capacity Metrics",
              "options": [
                { "label": "ConsumedReadCapacityUnits", "value": "measure_name = 'ConsumedReadCapacityUnits'", "ratio" : 60 },
                { "label": "ConsumedWriteCapacityUnits", "value": "measure_name = 'ConsumedWriteCapacityUnits'", "ratio" : 60 },
                { "label": "ReadThrottleEvents", "value": "measure_name = 'ReadThrottleEvents'", "ratio" : 60 },
                { "label": "WriteThrottleEvents", "value": "measure_name = 'WriteThrottleEvents'", "ratio" : 60 },
                { "label": "ProvisionedWriteCapacityUnits", "value": "measure_name = 'ProvisionedWriteCapacityUnits'", "ratio" : 60 },
                { "label": "ProvisionedReadCapacityUnits", "value": "measure_name = 'ProvisionedReadCapacityUnits'", "ratio" : 60 }
              ]
            },
            {
              "label": "SuccessfulRequestLatency",
              "options": [
                { "label": "GetItem", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'GetItem' ", "ratio" : 1 },
                { "label": "PutItem", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'PutItem' ", "ratio" : 1 },
                { "label": "Query", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'Query' ", "ratio" : 1 },
                { "label": "DeleteItem", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'DeleteItem' ", "ratio" : 1 },
                { "label": "UpdateItem", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'UpdateItem' ", "ratio" : 1 },
                { "label": "BatchGetItem", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'BatchGetItem' ", "ratio" : 1 },
                { "label": "TransactWriteItems", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'TransactWriteItems' ", "ratio" : 1 },
                { "label": "TransactGetItems", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'TransactGetItems' ", "ratio" : 1 },
                { "label": "ExecuteTransaction", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'ExecuteTransaction' ", "ratio" : 1 },
                { "label": "BatchExecuteStatement", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'BatchExecuteStatement' ", "ratio" : 1 },
                { "label": "ExecuteStatement", "value": "measure_name = 'SuccessfulRequestLatency' and Operation = 'ExecuteStatement' ", "ratio" : 1 }
              ]
            },
            {
              "label": "ThrottledRequests",
              "options": [
                { "label": "GetItem", "value": "measure_name = 'ThrottledRequests' and Operation = 'GetItem' ", "ratio" : 60 },
                { "label": "PutItem", "value": "measure_name = 'ThrottledRequests' and Operation = 'PutItem' ", "ratio" : 60 },
                { "label": "Query", "value": "measure_name = 'ThrottledRequests' and Operation = 'Query' ", "ratio" : 60 },
                { "label": "DeleteItem", "value": "measure_name = 'ThrottledRequests' and Operation = 'DeleteItem' ", "ratio" : 60 },
                { "label": "UpdateItem", "value": "measure_name = 'ThrottledRequests' and Operation = 'UpdateItem' ", "ratio" : 60 },
                { "label": "BatchGetItem", "value": "measure_name = 'ThrottledRequests' and Operation = 'BatchGetItem' " },
                { "label": "TransactWriteItems", "value": "measure_name = 'ThrottledRequests' and Operation = 'TransactWriteItems' ", "ratio" : 60 },
                { "label": "TransactGetItems", "value": "measure_name = 'ThrottledRequests' and Operation = 'TransactGetItems' ", "ratio" : 60 },
                { "label": "ExecuteTransaction", "value": "measure_name = 'ThrottledRequests' and Operation = 'ExecuteTransaction' " },
                { "label": "BatchExecuteStatement", "value": "measure_name = 'ThrottledRequests' and Operation = 'BatchExecuteStatement' ", "ratio" : 60 },
                { "label": "ExecuteStatement", "value": "measure_name = 'ThrottledRequests' and Operation = 'ExecuteStatement' ", "ratio" : 60 }
              ]
            },
            {
              "label": "SystemErrors",
              "options": [
                { "label": "GetItem", "value": "measure_name = 'SystemErrors' and Operation = 'GetItem' ", "ratio" : 60 },
                { "label": "PutItem", "value": "measure_name = 'SystemErrors' and Operation = 'PutItem' ", "ratio" : 60 },
                { "label": "Query", "value": "measure_name = 'SystemErrors' and Operation = 'Query' ", "ratio" : 60 },
                { "label": "DeleteItem", "value": "measure_name = 'SystemErrors' and Operation = 'DeleteItem' ", "ratio" : 60 },
                { "label": "UpdateItem", "value": "measure_name = 'SystemErrors' and Operation = 'UpdateItem' ", "ratio" : 60 },
                { "label": "BatchGetItem", "value": "measure_name = 'SystemErrors' and Operation = 'BatchGetItem' ", "ratio" : 60 },
                { "label": "TransactWriteItems", "value": "measure_name = 'SystemErrors' and Operation = 'TransactWriteItems' ", "ratio" : 60 },
                { "label": "TransactGetItems", "value": "measure_name = 'SystemErrors' and Operation = 'TransactGetItems' ", "ratio" : 60 },
                { "label": "ExecuteTransaction", "value": "measure_name = 'SystemErrors' and Operation = 'ExecuteTransaction' ", "ratio" : 60 },
                { "label": "BatchExecuteStatement", "value": "measure_name = 'SystemErrors' and Operation = 'BatchExecuteStatement' ", "ratio" : 60 },
                { "label": "ExecuteStatement", "value": "measure_name = 'SystemErrors' and Operation = 'ExecuteStatement' ", "ratio" : 60 }
              ]
            }
    ]
};