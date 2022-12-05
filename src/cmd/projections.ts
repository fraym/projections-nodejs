#! /usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { config } from "dotenv";
// import { buildSchema, buildASTSchema, printSchema } from "graphql/utilities";
// import { Kind } from "graphql/language/kinds";
// import { newManagementClient } from "../management/client";

const run = async () => {
    config();

    const argv = await yargs(hideBin(process.argv))
        .config({ schemaGlob: "./src", serverAddress: "127.0.0.1:9000" })
        .pkgConf("projections").argv;

    let schemaGlob: string = argv.schemaGlob as string;
    let serverAddress: string = argv.serverAddress as string;

    if (process.env.PROJECTIONS_SCHEMA_GLOB) {
        schemaGlob = process.env.PROJECTIONS_SCHEMA_GLOB;
    }

    if (process.env.PROJECTIONS_SERVER_ADDRESS) {
        serverAddress = process.env.PROJECTIONS_SERVER_ADDRESS;
    }

    console.log(schemaGlob, serverAddress);
};

run();

// const getSchemas = (schemaPath: string): Record<string, string> => {
//     const schemaFiles = fs.readdirSync(schemaPath);
//     const schemas: Record<string, string> = {};

//     schemaFiles.forEach(fileName => {
//         const astSchema = buildSchema(fs.readFileSync(schemaPath + "/" + fileName, "utf-8"));

//         astSchema.toConfig().types.forEach(t => {
//             if (!t.astNode?.kind) {
//                 return;
//             }

//             const name = t.toString();

//             const typeSchema = buildASTSchema(
//                 {
//                     definitions: [
//                         t.astNode,
//                         {
//                             kind: Kind.DIRECTIVE_DEFINITION,
//                             name: {
//                                 kind: Kind.NAME,
//                                 value: "identifyBy",
//                             },
//                             repeatable: false,
//                             locations: [],
//                         },
//                     ],
//                     kind: Kind.DOCUMENT,
//                 },
//                 {
//                     assumeValid: true,
//                     assumeValidSDL: true,
//                 }
//             );

//             if (schemas[name]) {
//                 throw new Error(
//                     `duplicate schema for projection "${name}" detected, try renaming one of them as they have to be unique`
//                 );
//             }

//             schemas[name] = printSchema(typeSchema);
//         });
//     });

//     return schemas;
// };

// const migrateSchemas = async (schemas: Record<string, string>, serverAddress: string) => {
//     const managementClient = await newManagementClient({ serverAddress });
//     const existingTypeNames = await managementClient.getAll();

//     let createSchema = "";
//     let updateSchema = "";
//     const typesToCreate: string[] = [];
//     const typesToUpdate: string[] = [];
//     const typesToRemove: string[] = [];

//     existingTypeNames.forEach(existingName => {
//         if (!schemas[existingName]) {
//             typesToRemove.push(existingName);
//         } else {
//             typesToUpdate.push(existingName);
//             updateSchema += `\n${schemas[existingName]}`;
//             delete schemas[existingName];
//         }
//     });

//     Object.keys(schemas).forEach(newName => {
//         typesToCreate.push(newName);
//         createSchema += `\n${schemas[newName]}`;
//     });

//     if (typesToRemove.length > 0) {
//         console.log(`Removing ${typesToRemove.length} projections: ${typesToRemove}...`);
//         await managementClient.remove(typesToRemove);
//         console.log(`Removed ${typesToRemove.length} projections`);
//     }

//     if (typesToUpdate.length > 0) {
//         console.log(`Updating ${typesToUpdate.length} projections: ${typesToUpdate}...`);
//         await managementClient.update(updateSchema);
//         console.log(`Updated ${typesToUpdate.length} projections`);
//     }

//     if (typesToCreate.length > 0) {
//         console.log(`Creating ${typesToCreate.length} projections: ${typesToCreate}...`);
//         await managementClient.create(createSchema);
//         console.log(`Created ${typesToCreate.length} projections`);
//     }
// };
