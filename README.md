# projections-nodejs

Client implementation in javascript for the [projections service](https://github.com/fraym/projections).

## Installation

```shell
npm i @fraym/projections
```

## GraphQL

You can access the graphQL api at `http://projections:3000/delivery/graphql`.
There is a sandbox available at `http://projections:3000/delivery/graphql/sandbox`.

You need to add the `Tenant-Id` header in order to use the graphQL Endpoint and the sandbox.

### Config

Use a `.env` file or env variables to configure cte clients and the command:

```env
PROJECTIONS_SERVER_ADDRESS=127.0.0.1:9000
```

## Env variable placeholders in migrations

You can use placeholders that match environment variables in argument strings in your schema definitions:

In the following example the `{{env.BACKEND_HOSTNAME}}` part will be replaced by the value of the `BACKEND_HOSTNAME` environment variable.
Please add your used env variables to the `.env` file that is used to [configure the migration command](#config).

```graphql
type TestType {
    value: String
        @webhook(
            url: "http://{{env.BACKEND_HOSTNAME}}/event-organizing/contingent/projections/frontend/contingent-management/webhook"
            method: "GET"
            header: [{ key: "Content-Type", value: "'application/json'" }]
            body: [
                { key: "metadata", value: "metadata" }
                { key: "payload", value: "payload" }
                { key: "projection", value: "projection" }
            ]
        )
}
```

## Usage

### Create the client

```typescript
const deliveryClient = await newDeliveryClient();
```

### Authorization

All delivery client functions make use of the `AuthData` object.
This data is used to check access for the desired action.

You can add the `FRAYM_AUTH_OWNER` scope in case you are performing an action that is no subject to restrictions.

Fields:

-   `tenantId`: Id of the tenant to use
-   `scopes`: Slice of scopes to use for the action
-   `data`: Data that is used in directives like `@filterFromJwtData`

### Event Metadata

You can specify the correlation and causation IDs for the upsert and delete functions. The `eventMetadata` parameter is optional for all these functions and has the following structure:

```typescript
const eventMetadata = {
    correlationId: "some-correlation-id",
    causationId: "some-causation-id",
};
```

### Upsert data in projection

In general you upsert data by publishing events on the event stream.
There are cases where you want to improve performance and get detailed validation output. In these cases you can use the client to directly upsert data. Do not worry, this is still event based under the hood.

```typescript
const response = await client.upsertData<{ fieldName: string }>(
    "ProjectionName",
    authData,
    "dataId",
    {
        fieldName: "value",
    },
    eventMetadata
);
```

The response contains the following fields:

In case of no validation errors:

-   `data`: The new data after your upsert action

In case of validation errors:

-   `validationErrors`: List of global validation errors that are not related to a single field
-   `fieldValidationErrors`: Validation errors mapped by the name of the field that they relate to

### Delete data from projection

In general you delete data by publishing events on the event stream.
There are cases where you want to improve performance and get detailed validation output. In these cases you can use the client to directly delete data. Do not worry, this is still event based under the hood.

Delete by Id:

```go
const numberOfDeletedEntries = await client.deleteDataById("ProjectionName", authData, "dataId", eventMetadata)
```

Delete by filter:

```go
const numberOfDeletedEntries = client.deleteDataByFilter("ProjectionName", authData, filter, eventMetadata)
```

### Get a single projection element

A filter could look like this:

```go
const filter := {
	fields: {
        fieldName: {
            operation: "equals",
            type: "Int",
            value: 123,
        },
    },
}
```

The name of `YourProjection` has to equal your projection name in your schema (also in casing).
The `id` has to match the id of the projection element that you want to get.

```typescript
const data = await deliveryClient.getData(
    "YourProjection",
    authData,
    "id",
    filter,
    returnEmptyDataIfNotFound
);
```

### Get (paginated / filtered / ordered) data

The name of `YourProjection` has to equal your type name in your schema (also in casing).

No pagination:

```typescript
const dataList = await deliveryClient.getDataList("YourProjection", authData);
```

The dataList response contains the following fields:

-   `limit`: The pagination limit
-   `page`: The pagination page
-   `total`: The total amount of elements matching the given filter
-   `data`: The selected data

With pagination:

```typescript
const limit = 50; // elements to query per page
const page = 1; // number of the page you want to select, first page starts at: 1
const dataList = await deliveryClient.getDataList("YourProjection", authData, limit, page);
```

With filter:

```typescript
const dataList = await deliveryClient.getDataList(
    "YourProjection",
    authData,
    undefined,
    undefined,
    {
        fields: {
            fieldName: {
                operation: "equals",
                type: "Int",
                value: 123,
            },
        },
    }
);
```

All `Filter`s are evaluated by:

-   checking that all field filters match
-   checking that all `and` filters match
-   checking that one of the `or` filters match

Avaliable types:

-   `String`
-   `ID`
-   `DateTime`
-   `Int`
-   `Float`
-   `Boolean`

Avaliable operators for all types:

-   `equals`
-   `notEquals`

Avaliable options for the filter type `DateTime`:

-   `inArray`
-   `notInArray`
-   `after`
-   `before`

Avaliable options for the filter type `String` and `ID`:

-   `inArray`
-   `notInArray`

Avaliable options for the filter type `Int` and `Float`:

-   `lessThan`
-   `greaterThan`
-   `lessThanOrEqual`
-   `greaterThanOrEqual`

With order:

All order definitions are prioritized in the order that they are defined (the first definition is prioritized over the second).

```typescript
const dataList = await client.getDataList(
    "YourProjection",
    authData,
    undefined,
    undefined,
    undefined,
    [
        {
            field: "fieldName",
            descending: true, // omit this value for asc order
        },
    ]
);
```

### Gracefully close the delivery client

You won't lose any data if you don't. Use it for your peace of mind.

```typescript
client.close();
```
