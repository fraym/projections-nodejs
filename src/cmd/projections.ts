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
        .config({ schemaGlob: "./src/**/*.graphql", serverAddress: "127.0.0.1:9000" })
        .pkgConf("projections").argv;

    let schemaGlob: string = argv.schemaGlob as string;
    let serverAddress: string = argv.serverAddress as string;

    if (process.env.PROJECTIONS_SCHEMA_GLOB) {
        schemaGlob = process.env.PROJECTIONS_SCHEMA_GLOB;
    }

    if (process.env.PROJECTIONS_SERVER_ADDRESS) {
        serverAddress = process.env.PROJECTIONS_SERVER_ADDRESS;
    }

    const schema = await loadSchema(`${schemaGlob}`, {
        loaders: [new GraphQLFileLoader()],
    });

    const definitions = getTypeDefinition(schema);

    await migrateSchemas(definitions, serverAddress);
};

run();

const getTypeDefinition = (schema: GraphQLSchema): Record<string, TypeDefinition> => {
    const definitions: Record<string, TypeDefinition> = {};

    schema.toConfig().types.forEach(t => {
        if (!(t instanceof GraphQLObjectType) && !(t instanceof GraphQLEnumType)) {
            return;
        }

        const name = t.toString();

        if (definitions[name]) {
            throw new Error(
                `duplicate definition for type "${name}" detected, try renaming one of them as they have to be uniquely named`
            );
        }

        if (t instanceof GraphQLObjectType) {
            definitions[name] = getTypeDefinitionFromGraphQLObjectType(t);
            return;
        }

        if (t instanceof GraphQLEnumType) {
            definitions[name] = getTypeDefinitionFromGraphQLEnumType(t);
            return;
        }
    });

    return definitions;
};

const getTypeDefinitionFromGraphQLEnumType = (t: GraphQLEnumType): TypeDefinition => {
    const name = t.toString();
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

const getTypeDefinitionFromGraphQLObjectType = (t: GraphQLObjectType): TypeDefinition => {
    let isProjection = false;

    if (t.astNode?.directives && t.astNode?.directives.length > 0) {
        const directiveNames = t.astNode.directives.map(directive => directive.name.value);
        isProjection = directiveNames.includes("upsertOn");
    }

    const name = t.toString();
    let objectDirectivesString = "";
    let objectFieldsString = "";
    let nestedTypes: string[] = [];

    t.astNode?.directives?.forEach(d => {
        objectDirectivesString += getDirectiveString(d);
    });

    t.astNode?.fields?.forEach(f => {
        const { str, nestedTypes: newNestedTypes } = getFieldStringAndNestedTypes(f);
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

const getFieldStringAndNestedTypes = (f: FieldDefinitionNode): FieldData => {
    let directivesString = "";

    f.directives?.forEach(d => {
        directivesString += getDirectiveString(d);
    });

    const { nestedType, str: typeString } = getTypeData(f.type);

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

const getTypeData = (t: TypeNode): TypeData => {
    switch (t.kind) {
        case Kind.NAMED_TYPE:
            const name = t.name.value;

            return name === "String" ||
                name === "Float" ||
                name === "ID" ||
                name === "Boolean" ||
                name === "Int" ||
                name === "DateTime"
                ? {
                      str: name,
                  }
                : {
                      str: name,
                      nestedType: name,
                  };
        case Kind.LIST_TYPE:
            const { nestedType: listNestedType, str: listStr } = getTypeData(t.type);

            return {
                str: `[${listStr}]`,
                nestedType: listNestedType,
            };
        case Kind.NON_NULL_TYPE:
            const { nestedType: nonNullNestedType, str: nonNullStr } = getTypeData(t.type);

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
        case Kind.OBJECT:
            let objectString = "";

            v.fields.forEach(f => {
                if (objectString !== "") {
                    objectString += ", ";
                }

                objectString += `${f.name.value}: ${getValueString(f.value)}`;
            });

            return `{${objectString}}`;
        default:
            throw new Error(`values of kind ${v.kind} are currently not supported`);
    }
};

const migrateSchemas = async (
    definitions: Record<string, TypeDefinition>,
    serverAddress: string
) => {
    const managementClient = await newManagementClient({ serverAddress });
    let existingProjections = (await managementClient.getAll()).filter(
        projectionName => !projectionName.startsWith("Crud")
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
                if (
                    nestedTypesToUpdate.indexOf(nestedTypeName) !== -1 ||
                    (definitions[nestedTypeName] && definitions[nestedTypeName].isProjection)
                ) {
                    return;
                }

                updateSchema += `\n${definitions[nestedTypeName].schema}`;

                nestedTypesToUpdate.push(nestedTypeName);
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
            if (
                nestedTypesToCreate.indexOf(nestedTypeName) !== -1 ||
                (definitions[nestedTypeName] && definitions[nestedTypeName].isProjection)
            ) {
                return;
            }

            createSchema += `\n${definitions[nestedTypeName].schema}`;

            nestedTypesToCreate.push(nestedTypeName);
        });
    });

    if (projectionsToCreate.length > 0) {
        console.log(
            `Creating ${projectionsToCreate.length} projections: ${projectionsToCreate}...`
        );
        await managementClient.create(createSchema).catch(console.log);
        console.log(`Created ${projectionsToCreate.length} projections`);
    }

    if (projectionsToUpdate.length > 0) {
        console.log(
            `Updating ${projectionsToUpdate.length} projections: ${projectionsToUpdate}...`
        );
        await managementClient.update(updateSchema).catch(console.log);
        console.log(`Updated ${projectionsToUpdate.length} projections`);
    }

    if (projectionsToRemove.length > 0) {
        console.log(
            `Removing ${projectionsToRemove.length} projections: ${projectionsToRemove}...`
        );
        await managementClient.remove(projectionsToRemove).catch(console.log);
        console.log(`Removed ${projectionsToRemove.length} projections`);
    }
};
