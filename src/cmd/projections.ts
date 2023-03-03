#! /usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { config } from "dotenv";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchema } from "@graphql-tools/load";
import {
    ConstDirectiveNode,
    ConstValueNode,
    FieldDefinitionNode,
    GraphQLEnumType,
    GraphQLObjectType,
    GraphQLSchema,
    Kind,
    TypeNode,
} from "graphql";
import { newManagementClient } from "../management/client";

interface TypeDefinition {
    isProjection: boolean;
    schema: string;
    nestedTypes: string[];
}

const run = async () => {
    config();

    const argv = await yargs(hideBin(process.argv))
        .config({
            schemaGlob: "./src/**/*.graphql",
            serverAddress: "127.0.0.1:9000",
            namespace: "",
        })
        .pkgConf("projections").argv;

    let schemaGlob: string = argv.schemaGlob as string;
    let serverAddress: string = argv.serverAddress as string;
    let namespace: string = argv.namespace as string;

    if (process.env.PROJECTIONS_SCHEMA_GLOB) {
        schemaGlob = process.env.PROJECTIONS_SCHEMA_GLOB;
    }

    if (process.env.PROJECTIONS_SERVER_ADDRESS) {
        serverAddress = process.env.PROJECTIONS_SERVER_ADDRESS;
    }

    if (process.env.PROJECTIONS_NAMESPACE) {
        namespace = process.env.PROJECTIONS_NAMESPACE;
    }

    if (namespace === "Fraym") {
        throw new Error("Cannot use Fraym as namespace as it is reserved for fraym apps");
    }

    const schema = await loadSchema(`${schemaGlob}`, {
        loaders: [new GraphQLFileLoader()],
    });

    const definitions = getTypeDefinition(schema, namespace);

    await migrateSchemas(definitions, serverAddress, namespace);
};

run();

const getTypeDefinition = (
    schema: GraphQLSchema,
    namespace: string
): Record<string, TypeDefinition> => {
    const definitions: Record<string, TypeDefinition> = {};

    schema.toConfig().types.forEach(t => {
        if (!(t instanceof GraphQLObjectType) && !(t instanceof GraphQLEnumType)) {
            return;
        }

        const name = `${namespace}${t.toString()}`;
        ensureValidName(name);

        if (definitions[name]) {
            throw new Error(
                `duplicate definition for type "${name}" detected, try renaming one of them as they have to be uniquely named`
            );
        }

        if (t instanceof GraphQLObjectType) {
            definitions[name] = getTypeDefinitionFromGraphQLObjectType(t, namespace);
            return;
        }

        if (t instanceof GraphQLEnumType) {
            definitions[name] = getTypeDefinitionFromGraphQLEnumType(t, namespace);
            return;
        }
    });

    return definitions;
};

const getTypeDefinitionFromGraphQLEnumType = (
    t: GraphQLEnumType,
    namespace: string
): TypeDefinition => {
    const name = `${namespace}${t.toString()}`;
    ensureValidName(name);

    let enumValuesString = "";

    t.astNode?.values?.forEach(value => {
        enumValuesString += `\n\t${value.name.value}`;
    });

    const schema = `enum ${name} {${enumValuesString}\n}`;

    return {
        isProjection: false,
        nestedTypes: [],
        schema,
    };
};

const getTypeDefinitionFromGraphQLObjectType = (
    t: GraphQLObjectType,
    namespace: string
): TypeDefinition => {
    let isProjection = false;

    if (t.astNode?.directives && t.astNode?.directives.length > 0) {
        const directiveNames = t.astNode.directives.map(directive => directive.name.value);
        isProjection = directiveNames.includes("upsertOn");
    }

    const name = `${namespace}${t.toString()}`;
    ensureValidName(name);

    let objectDirectivesString = "";
    let objectFieldsString = "";
    let nestedTypes: string[] = [];

    t.astNode?.directives?.forEach(d => {
        objectDirectivesString += getDirectiveString(d);
    });

    t.astNode?.fields?.forEach(f => {
        const { str, nestedTypes: newNestedTypes } = getFieldStringAndNestedTypes(f, namespace);
        objectFieldsString += str;

        newNestedTypes.forEach(nested => {
            if (nestedTypes.indexOf(nested) === -1) {
                nestedTypes.push(nested);
            }
        });
    });

    const schema = `type ${name}${objectDirectivesString} {${objectFieldsString}\n}`;

    return {
        isProjection,
        nestedTypes,
        schema,
    };
};

interface FieldData {
    str: string;
    nestedTypes: string[];
}

const getFieldStringAndNestedTypes = (f: FieldDefinitionNode, namespace: string): FieldData => {
    let directivesString = "";

    f.directives?.forEach(d => {
        directivesString += getDirectiveString(d);
    });

    const { nestedType, str: typeString } = getTypeData(f.type, namespace);

    const nestedTypes: string[] = [];

    if (nestedType) {
        nestedTypes.push(nestedType);
    }

    return {
        str: `\n\t${f.name.value}: ${typeString}${directivesString}`,
        nestedTypes,
    };
};

interface TypeData {
    str: string;
    nestedType?: string;
}

const getTypeData = (t: TypeNode, namespace: string): TypeData => {
    switch (t.kind) {
        case Kind.NAMED_TYPE:
            const name = t.name.value;
            ensureValidName(`${namespace}${name}`);

            return name === "String" ||
                name === "Float" ||
                name === "ID" ||
                name === "Boolean" ||
                name === "Int" ||
                name === "DateTime" ||
                name === "EventEnvelope"
                ? {
                      str: name,
                  }
                : {
                      str: `${namespace}${name}`,
                      nestedType: `${namespace}${name}`,
                  };
        case Kind.LIST_TYPE:
            const { nestedType: listNestedType, str: listStr } = getTypeData(t.type, namespace);

            return {
                str: `[${listStr}]`,
                nestedType: listNestedType,
            };
        case Kind.NON_NULL_TYPE:
            const { nestedType: nonNullNestedType, str: nonNullStr } = getTypeData(
                t.type,
                namespace
            );

            return {
                str: `${nonNullStr}!`,
                nestedType: nonNullNestedType,
            };
    }
};

const getDirectiveString = (d: ConstDirectiveNode): string => {
    if (!d.arguments || d.arguments.length == 0) {
        return ` @${d.name.value}`;
    }

    let argsString = "";

    d.arguments.forEach(a => {
        if (argsString !== "") {
            argsString += ", ";
        }

        argsString += `${a.name.value}: ${getValueString(a.value)}`;
    });

    return ` @${d.name.value}(${argsString})`;
};

const getValueString = (v: ConstValueNode): string => {
    switch (v.kind) {
        case Kind.LIST:
            let valuesString = "";

            v.values.forEach(el => {
                if (valuesString !== "") {
                    valuesString += ", ";
                }

                valuesString += getValueString(el);
            });

            return `[${valuesString}]`;
        case Kind.STRING:
            return `"${v.value}"`;
        case Kind.FLOAT:
        case Kind.INT:
        case Kind.BOOLEAN:
            return `${v.value}`;
        case Kind.NULL:
            return `null`;
        case Kind.ENUM:
            return `${v.value}`;
        case Kind.OBJECT:
            let objectString = "";

            v.fields.forEach(f => {
                if (objectString !== "") {
                    objectString += ", ";
                }

                objectString += `${f.name.value}: ${getValueString(f.value)}`;
            });

            return `{${objectString}}`;
    }
};

interface NestedSchemaData {
    schema: string;
    nestedTypes: string[];
}

const addNestedTypesToSchema = (
    definitions: Record<string, TypeDefinition>,
    nestedTypeName: string,
    nestedTypes: string[]
): NestedSchemaData => {
    const nestedTypeDefinition = definitions[nestedTypeName];

    if (
        nestedTypes.indexOf(nestedTypeName) !== -1 ||
        (nestedTypeDefinition && nestedTypeDefinition.isProjection)
    ) {
        return {
            schema: "",
            nestedTypes: [],
        };
    }

    let newSchema = definitions[nestedTypeName].schema;
    nestedTypes.push(nestedTypeName);

    nestedTypeDefinition.nestedTypes.forEach(nestedNestedTypeName => {
        const nestedSchemaData = addNestedTypesToSchema(
            definitions,
            nestedNestedTypeName,
            nestedTypes
        );

        if (nestedSchemaData.schema === "") {
            return;
        }

        newSchema += `\n${nestedSchemaData.schema}`;
        nestedTypes.push(...nestedSchemaData.nestedTypes);
    });

    return {
        schema: newSchema,
        nestedTypes: nestedTypes,
    };
};

const migrateSchemas = async (
    definitions: Record<string, TypeDefinition>,
    serverAddress: string,
    namespace: string
) => {
    const managementClient = await newManagementClient({ serverAddress });
    let existingProjections = (await managementClient.getAll()).filter(
        projectionName =>
            !projectionName.startsWith("Crud") &&
            !projectionName.startsWith("Fraym") &&
            projectionName.startsWith(namespace)
    );

    let createSchema = "";
    let updateSchema = "";
    const projectionsToCreate: string[] = [];
    const nestedTypesToCreate: string[] = [];
    const projectionsToUpdate: string[] = [];
    const nestedTypesToUpdate: string[] = [];
    const projectionsToRemove: string[] = [];

    existingProjections.forEach(projectionName => {
        if (!definitions[projectionName] || !definitions[projectionName].isProjection) {
            projectionsToRemove.push(projectionName);
        } else {
            projectionsToUpdate.push(projectionName);
            updateSchema += `\n${definitions[projectionName].schema}`;

            definitions[projectionName].nestedTypes.forEach(nestedTypeName => {
                const nestedSchemaData = addNestedTypesToSchema(
                    definitions,
                    nestedTypeName,
                    nestedTypesToUpdate
                );

                if (nestedSchemaData.schema === "") {
                    return;
                }

                updateSchema += `\n${nestedSchemaData.schema}`;
                nestedTypesToUpdate.push(...nestedSchemaData.nestedTypes);
            });
        }
    });

    Object.keys(definitions).forEach(newName => {
        if (!definitions[newName].isProjection || existingProjections.includes(newName)) {
            return;
        }

        projectionsToCreate.push(newName);
        createSchema += `\n${definitions[newName].schema}`;

        definitions[newName].nestedTypes.forEach(nestedTypeName => {
            const nestedSchemaData = addNestedTypesToSchema(
                definitions,
                nestedTypeName,
                nestedTypesToCreate
            );

            if (nestedSchemaData.schema === "") {
                return;
            }

            createSchema += `\n${nestedSchemaData.schema}`;
            nestedTypesToCreate.push(...nestedSchemaData.nestedTypes);
        });
    });

    if (projectionsToCreate.length > 0) {
        console.log(
            `Creating ${projectionsToCreate.length} projections: ${projectionsToCreate}...`
        );
        await managementClient.update(createSchema);
        console.log(`Created ${projectionsToCreate.length} projections`);
    }

    if (projectionsToUpdate.length > 0) {
        console.log(
            `Updating ${projectionsToUpdate.length} projections: ${projectionsToUpdate}...`
        );
        await managementClient.update(updateSchema);
        console.log(`Updated ${projectionsToUpdate.length} projections`);
    }

    if (projectionsToRemove.length > 0) {
        console.log(
            `Removing ${projectionsToRemove.length} projections: ${projectionsToRemove}...`
        );
        await managementClient.remove(projectionsToRemove);
        console.log(`Removed ${projectionsToRemove.length} projections`);
    }
};

const ensureValidName = (name: string): void | never => {
    if (name.startsWith("Fraym")) {
        throw new Error(
            `Cannot use Fraym as projection name prefix as it is reserved for fraym apps, got ${name}`
        );
    }
};
