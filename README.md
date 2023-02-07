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

Use the `PROJECTIONS_NAMESPACE` env variable to restrict all migrations to your namespace. This is useful if multiple apps share the projections service. Note: You cannot name your projection or namespace by a `Fraym` prefix. This is a reserved prefix for fraym apps.

You need to add a file that contains all built-in directives to your type schemas. The latest version of this file can be found [here](default.graphql).

### Config

Use a `.env` file or env variables to configure cte clients and the command:

```env
PROJECTIONS_SERVER_ADDRESS=127.0.0.1:9000
PROJECTIONS_SCHEMA_GLOB=./src/projections/*.graphql
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

### Get a single projection element

The name of `YourProjection` has to equal your projection name in your schema (also in casing).
The `id` has to match the id of the projection element that you want to get.

```typescript
const data = await deliveryClient.getData("tenantId", "YourProjection", "id");
```

You can specify a fourth parameter if you want to return a empty dataset instead of getting an error when querying a non existing element:

```typescript
const data = await deliveryClient.getData("tenantId", "YourProjection", "id", true);
```

### Get (paginated / filtered) data

The name of `YourProjection` has to equal your type name in your schema (also in casing).

No pagination:

```typescript
const data = await deliveryClient.getDataList("tenantId", "YourProjection");
```

With pagination:

```typescript
const limit = 50; // elements to query per page
const page = 1; // number of the page you want to select, first page starts at: 1
const data = await deliveryClient.getDataList("tenantId", "YourProjection", limit, page);
```

With filter:

```typescript
const data = await deliveryClient.getDataList("tenantId", "YourProjection", undefined, undefined, {
    fields: {
        fieldName: {
            operation: "equals",
            type: "Int",
            value: 123,
        },
    },
});
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
const data = await client.getDataList(
    "tenantId",
    "YourProjection",
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

## Development

You'll need the following apps for a smooth development experience:

-   minikube
-   lens
-   okteto
-   helm

### Running the dev environment

-   Start minikube if not already done:

```shell
minikube start
```

-   add mongodb and minio to your lokal kubernetes
    -   use Makefiles in `./.dev/*`
-   copy `.env.build` to `.env.build.local`
    -   add your personal access token (needs read access for private fraym org repositories)
-   deploy the app to your cluster

```
make init
```

-   start okteto

```
make dev
```

-   connect your IDE to that okteto instance
