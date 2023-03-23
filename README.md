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

## CLI command

Use the `projections` cli command to automatically apply your projection schemas to the projections service.

Your type schemas have to match the glob you specify in the `PROJECTIONS_SCHEMA_GLOB` env variable (default: `./src/**/*.graphql`).
You can specify the address (and port) of the projections service instance you use in the `PROJECTIONS_SERVER_ADDRESS` env variable (default: `127.0.0.1:9000`).

You might have a seperate permissions directory or file. As soon as your permissions schema enum is not part of the projections glob you can specify a `PERMISSIONS_SCHEMA_GLOB` env variable. It is empty by default but as soon as you provide it it will add the files in that glob to your projections schema, too.

Use the `PROJECTIONS_NAMESPACE` env variable to restrict all migrations to your namespace. This is useful if multiple apps share the projections service. Note: You cannot name your projection or namespace by a `Fraym` prefix. This is a reserved prefix for fraym apps.

You need to add a file that contains all built-in directives to your type schemas. The latest version of this file can be found [here](default.graphql).

### Config

Use a `.env` file or env variables to configure cte clients and the command:

```env
PROJECTIONS_SERVER_ADDRESS=127.0.0.1:9000
PROJECTIONS_SCHEMA_GLOB=./src/projections/*.graphql
PERMISSIONS_SCHEMA_GLOB=
PROJECTIONS_NAMESPACE=
```

## Usage

### Create the clients

delivery client:

```typescript
const deliveryClient = await newDeliveryClient();
```

management client:

```typescript
const managementClient = await newManagementClient();
```

### Create one or multipe projections

Projectionw are defined by schemas. A schema can contain more than one projection definition. See [SCHEMA.md](https://github.com/fraym/projections/blob/develop/SCHEMA.md) for a reference.

```typescript
await managementClient.create("your schema here");
```

### Update one or multipe projections

Projectionw are defined by schemas. A schema can contain more than one projection definition. See [SCHEMA.md](https://github.com/fraym/projections/blob/develop/SCHEMA.md) for a reference.

```typescript
await managementClient.update("your schema here");
```

### Remove one or multipe projections

The name of `YourProjection` has to equal your projection name in your schema (also in casing).

```typescript
await managementClient.remove(["YourProjection"]);
```

### Get list of existing projections

```typescript
const list = await managementClient.getAll();
```

### Authorization

All delivery client functions make use of the `AuthData` object.
This data is used to check access for the desired action.

You can add the `FRAYM_AUTH_OWNER` scope in case you are performing an action that is no subject to restrictions.

Fields:

-   `tenantId`: Id of the tenant to use
-   `scopes`: Slice of scopes to use for the action
-   `data`: Data that is used in directives like `@filterFromJwtData`

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
    }
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
const numberOfDeletedEntries = await client.deleteDataById("ProjectionName", authData, "dataId")
```

Delete by filter:

```go
const numberOfDeletedEntries = client.deleteDataByFilter("ProjectionName", authData, filter)
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

### Get (paginated / filtered) data

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

### Gracefully close the clients

You won't lose any data if you don't. Use it for your peace of mind.

```typescript
client.close();
```
