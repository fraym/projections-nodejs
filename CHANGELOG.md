# vNext

# v0.14.2

-   (bug) Fix upsert logic
-   (improvement) Improve docs: add `@unique` documentation

# v0.14.1

-   (bug) Fix `upsertData` type
-   (bug) Return id when upserting data

# v0.14.0

-   (feature) Specify correlation and causation ids

# v0.13.0

-   (feature) Add env variable placeholders

# v0.12.1

-   (bug) Fix error handling in migrations

# v0.12.0

-   (bc) Use http migration api

# v0.11.0

-   (feature) Add total amount to pagination data

# v0.10.1

-   (bug) Fix migration logic

# v0.10.0

-   (bc) Implement new delivery api

# v0.9.0

-   (feature) Add `PERMISSIONS_SCHEMA_GLOB` env variable

# v0.8.2

-   (bug) Fix filter handling

# v0.8.1

-   (improvement) Improve error handling in migrations
-   (bug) Allow nested types in nested types

# v0.8.0

-   (feature) Add `@global` directive

# v0.7.0

-   (feature) Add `@permission` directive
-   (feature) Add `@expires` directive
-   (feature) Add `@filterFromJwtData` directive

# v0.6.0

-   (feature) Add order to list queries

# v0.5.0

-   (bc) Make filter `getData` and `getDataList` generic

# v0.4.1

-   (bug) Use working version of @grpc/grpc-js

# v0.4.0

-   (feature) Add `PROJECTIONS_NAMESPACE` env variable
-   (improvement) Do not allow type names that start with `Fraym`

# v0.3.0

-   (feature) Add `EventEnvelope` as scalar
-   (feature) Add `@aggregateEvents`
-   (feature) Add `@index`
-   (feature) Add `@webhook`
-   (feature) Add filter for `getDataList` of delivery client

# v0.2.0

-   (bc) Improve object directives

# v0.1.0

-   (feature) Add `projections` cli command
-   (feature) Delivery API
-   (feature) Management API
