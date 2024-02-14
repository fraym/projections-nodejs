# Projection schema

You create projection schemas by using the graphql schema language.

## Projection Name

The name of the projection is the name of your type. In the following example the projection will be called `User`:

```graphql
type User {
 ...
}
```

## Field Types

Supported Types:

-   String
-   ID
-   Boolean
-   Int
-   Float
-   DateTime (unix timestamp, milliseconds)
-   Arrays
-   Objects / references to other projections
-   Enums
-   All types listed above in their required form

### EventEnvelope

The field type `[EventEnvelope!]!` is a special field type that can only be used in this form at the root level of a projection (not in a nested object). It will automatically aggregate all events that are applied on the projection into an array.

### Enums

You can define Enums and use them in your schema:

```graphql
enum YourEnum {
    YOUR_VALUE
    OTHER_VALUE
}
```

### Objects

You can use the name of an other Projection as field type in order to save a relation to an other projection.
You can also define a nested type:

```graphql
type User {
    friends: [User!]! # This is an array references to other users
    nested: Profile! # This is a nested object field this field does not reference to an other projection, it directly contains the nested data
}

type Profile {
    email: String
}
```

## Type directives

All allowed options of all available directives are explained by the [schema definition](https://github.com/fraym/projections-nodejs/blob/main/base.graphql).

### Create or update projection data

Use the `@upsertOn` directive to filter which events will be used to add or update fields on a projection. It specifies which identifier to use to identify the data.

In the following example the projection will be changed by all events of the types `createUser` and `updateUser`. The `id` payload will be used to identify the data. You can use payload fields that contain arrays of (id-)strings in order to update multiple datasets by one single event.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser", "updateUser"] }, identifyBy: { payload: ["id"] }) {
 ...
}
```

You can also omit the `identifyBy` attribute. By doing that the projection will be applied to all existing data:

```graphql
type User @upsertOn(on: { eventTypes: ["createUser", "updateUser"] }) {
 ...
}
```

You can use `@upsertOn` multiple times. The projection logic will be executed for every match.

### Filter which events should be used to remove data of a projection

Use the `@removeOn` directive to filter which events will be used to remove a projection entry. It specifies which identifier to use to identify the data.

In the following example the projection will remove a projection entry on `removeUser` events.

```graphql
type User @removeOn(on: { eventTypes: ["removeUser"] }, identifyBy: { payload: ["id"] }) {
 ...
}
```

You can use `@removeOn` multiple times. The remove logic will be executed for every match.

### Expiring projection data

The `@expires` directive allows the specification of a condition on which the entry will expire.

When using the `@expires` directive, the condition environment will only have the `projection` field available for this operation.

```graphql
type Something @expires(condition: "now > projection.expiresAt") {
 expiresAt: DateTime!
 ...
}
```

### Add permissions to the projection

Use the `@permission` directive on an object to apply permissions to it. Only users having that required permissions as a scope in their token will see data of it.

```graphql
type User
  @upsertOn(
    on: { eventTypes: ["createUser"] }
    identifyBy: { payload: ["id"] }
  )
  @permission(read: [PERMISSION_KEY]) {
  ...
}
```

### Create a projection over all tenants

Use the `@global` directive on an object to get a projection over all tenants. The data of this projection will be stored as part of the global tenant (`""`).

```graphql
type User
  @upsertOn(
    on: { eventTypes: ["createUser"] }
    identifyBy: { payload: ["id"] }
  )
  @global {
  ...
}
```

### Projection data from an API

You can run a projection by calling an API by using the `@webhook` directive on the object level.
The entire projection data will be replaced by the resulting json of the called endpoint.

```graphql
type User
    @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] })
    @webhook(
        url: "https://example.com/:path"
        method: "GET"
        condition: "payload.name == ''"
        topics: ["users"]
        events: ["createUser"]
        path: [{ key: "path", value: "payload.name" }]
    ) {
    field: String!
}
```

The first `@webhook` directive that has a matching `condition` will be executed.

`url` and `path` are normal string parameters.
The `condition` is an expression (see `@from` directive).
The `topics` and `events` are arrays (see `@from` directive).
`path`, `query`, `header` and `body` are arrays of small objects that contain two fields: `key` and `value`.
The `value` field has to be an expression (see `@from` directive).

In case of the `path` argument the `key` is a placeholder that will be replaced by the calculated value (in the example above `:path` will be replaced by the `name` field of the payload).
In case of the `query` argument the `key`is the name of a query parameter that will be added along with the calculated value.
In case of the `header` argument the `key`is the name of a header that will be added along with the calculated value.
In case of the `body` argument all `key` and `value` pairs will be combined to a key cvalue map and send as json in the body of the request.

The result from the webhook must contain a json structure. The directive will take the `value` field from it and write the value of it into the projection.

## Unique constraints

You can mark field compounds as unique by using the `@unique` directive at type level:

```graphql
type User
    @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] })
    @unique(fields: ["field", "field2"], name: "field and field2 unique") {
    field: String!
    field2: String!
}
```

## Field directives

In general fields will be filled by the event payload field that matches the field name.

Example:

Event payload:

```json
{
    "id": "some-id",
    "firstName": "John",
    "lastName": "Doe"
}
```

Projection schema:

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    lastName: String
}
```

When the event containing the example payload is thrown, the `User` prrojection will have an entry with the id `some-id` and data:

```json
{
    "lastName": "Doe"
}
```

Required fields (e.g. `String!`): Required fields will default to their zero value (`""` for strings, `0` for numbers, `false` for booleans).

You can add special annotations to fields to add custom logic:

### Add a field that contains the ID of the projection entry

Use the `@identifier` directive on a field to add the projection entry id to that field.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: ID! @identifier
}
```

### Add a field that contains the last change time

Use the `@changedAt` directive on a field to add the time on which the projection entry was last changed to that field.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @changedAt
}
```

### Add a field that contains the creation time

Use the `@createdAt` directive on a field to add the time on which the projection entry was created to that field.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @createdAt
}
```

### Mark a field to contain a valid UUIDv4

Use the `@uuidv4` directive on a field to mark it as having to contain a valid UUIDv4.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: ID! @uuidv4
}
```

In addition to that the `generate` argument can be used to automaticly generate a valid UUIDv4, if the projection entry is empty on that field.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: ID! @uuidv4(generate: true)
}
```

### Mark a field to validate against a validation rule

Use the `@validate` directive on a field to add validation against a rule tag from the [go-playground/validator](https://github.com/go-playground/validator#baked-in-validations) package.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @validate(tags: ["email"])
}
```

### Mark a field to have a defined default value

Use the `@default` directive on a field to define its default value if the projection entry is empty on that field.

The type can be either a non-null type or a nullable type. On a non-null type the respective zero type is replaced by the default value, whilst on the nullable type the null value is replaced by the default.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @default(value: "John Appleseed")
}
```

### Mark a field as filterable

Use the `@index` directive on a field to enable filtering on it in all list queries and graphql subscriptions.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @index
}
```

### Filter field in graphql queries by jwt data

Use the `@filterFromJwtData` directive on a field to filter it automatically by the given value from the jwt claims in all queries and graphql subscriptions.
The value that is used for the filter will be extracted from the jwt claims data object's field that is identified by the given `key` (in this example this would be `data.yourJwtDataKey`).
Note: If the filter value from the jwt contains array data, the filter will check if that field matchesthe first element of that array. If the value from the jwt is null or empty no filter will be applied.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @filterFromJwtData(key: "yourJwtDataKey")
}
```

### Add permissions to a field

Use the `@permission` directive on a field to apply permissions to it. Only users having that required permissions as a scope in their token will see that field.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @permission(read: [PERMISSION_KEY])
}
```

### Mark single fields as unique

Use the `@unique` directive on a field to mark it as unique.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @unique
}
```

### Project data from a specific field

Use the `@from` directive on a field to project data from a specified field to this field.
Because of the rather complex nature that are projections rules, one has access to a simple expression language called [expr](https://github.com/antonmedv/expr/blob/master/docs/Language-Definition.md). The directive then allows to specify a value and a condition expression. However whilst the value does not have to, the condition must evaluate to a boolean value.

#### Variables

the from directive has access to the following variables:

-   `metatata`: Event metadata. Possible fields:
    -   `metadata.id`: The id of the event (string)
    -   `metadata.tenantId`: The tenant id of the event (string)
    -   `metadata.stream`: The stream name of the event (string)
    -   `metadata.type`: The type name of the event (string)
    -   `metadata.correlationId`: The tenant correlation id of the event (string)
    -   `metadata.causationId`: The causation id of the event (string)
    -   `metadata.reason`: The reason string of the event (string)
    -   `metadata.topic`: The topic of the event (string)
    -   `metadata.raisedAt`: The time when this event was raised, represented as unix timestamp (milliseconds) (int64)
-   `payload`
    -   all fields that the event payload contains
    -   if your payload field is an object (not a reference to an other projection), you can access all object fields, too: `payload.user.name` would access the name field of the user object in the user field of the event payload
-   `projection`
    -   all fields that the event projection contains
    -   the `projection` variable contains the state of the projection before the event is applied to the projection and will therefore be empty for the first event that generates a new projection data entry
    -   if your projection field is an object (not a reference to an other projection), you can access all object fields, too: `payload.user.name` would access the name field of the user object in the user field of the projection

#### Additional functions

In additon to the functions build into [expr](https://github.com/antonmedv/expr/blob/master/docs/Language-Definition.md) projections provides the following functions:

-   `append(array, value)`: appends the `value` to the `array`
-   `intSum(arrayOfInts)`: calculates the sum of all elements in the `arrayOfInts` (requires actual `int` values in the array, maybe make use of `map(arrayOfNumbers, {int(#)})`to convert all values to integers)

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @from(value: "payload.id")
}
```

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @from(value: "payload.id", condition: "metadata.stream == 'users'")
}
```

In addition to that the behviour can only be triggered on a specified set of events using the `events` agrument.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String! @from(events: ["UserCreated"], value: "payload.id")
}
```

You can access already projected data by `projection.YOUR_FIELD_NAME`. If the projection logix is running the first time for a given identifier, the data in `projection` will be empty. Therefore `projection.YOUR_FIELD_NAME == nil` will evaluate to `true`.

### Projection data from an API

You can get data from an API into a field by using the `@webhook` directive.

```graphql
type User @upsertOn(on: { eventTypes: ["createUser"] }, identifyBy: { payload: ["id"] }) {
    field: String!
        @webhook(
            url: "https://example.com/:path"
            method: "GET"
            condition: "payload.name == ''"
            path: [
                { key: "path", value: { value: "payload.name", condition: "payload.name == ''" } }
            ]
        )
}
```

The first `@webhook` directive that has a matching `condition` will be executed.

`url` and `path` are normal string parameters. The `condition` is an expression (see `@from` directive). `path`, `query`, `header` and `body` are arrays of small objects that contain two fields: `key` and `value`. The `value` is similar to the `@from` directive.

In case of the `path` argument the `key` is a placeholder that will be replaced by the calculated value (in the example above `:path` will be replaced by the `name` field of the payload).
In case of the `query` argument the `key`is the name of a query parameter that will be added along with the calculated value.
In case of the `header` argument the `key`is the name of a header that will be added along with the calculated value.
In case of the `body` argument all `key` and `value` pairs will be combined to a key cvalue map and send as json in the body of the request.

The result from the webhook must contain a json structure. The directive will take the `value` field from it and write the value of it into the field.
