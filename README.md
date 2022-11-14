# projections-nodejs

Client implementation in javascript for the projections service [streams](https://github.com/fraym/projections).

## Installation

```shell
npm i @fraym/projections
```

## CLI command

Use the `projections` cli command to automatically apply your projection schemas to the projections service.

The `--config ./path/projections.config.json` flag can be used to configure the pat to your config file.

Your projection schemas have to live directly below the path that you specified in `schemaPath` of your config file.

### CLI command config

```json
{
    "schemaPath": "./src/projections", // path to your projection schema files
    "serverAddress": "127.0.0.1:9000" // address of the projections service
}
```

## Usage

### Create the clients

delivery client:

```typescript
const client = await newClient({
    serverAddress: "127.0.0.1:9000",
});
```

### Create one or multipe projections

Projection types are defined by schemas. A schema can contain more than one projection definition. See [SCHEMA.md](https://github.com/fraym/projections/blob/develop/SCHEMA.md) for a reference.

```typescript
await client.createTypes("your schema here");
```

### Update one or multipe projections


Projection types are defined by schemas. A schema can contain more than one projection definition. See [SCHEMA.md](https://github.com/fraym/projections/blob/develop/SCHEMA.md) for a reference.

```typescript
await client.updateTypes("your schema here");
```

### Remove one or multipe projections

The name of `YourProjection` has to equal your projection name in your schema (also in casing).

```typescript
await client.removeTypes(["YourProjection"]);
```

### Get list of existing projections

```typescript
const list = await client.getAllTypes();
```

### Gracefully close the client

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
