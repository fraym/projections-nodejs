import { ManagementClientConfig, useManagementConfigDefaults } from "../config/config";
import { getAllProjections } from "./getAll";
import { removeProjections } from "./remove";
import { upsertProjections } from "./upsert";

export interface ManagementClient {
    upsert: (schema: string) => Promise<void>;
    remove: (projectionNames: string[]) => Promise<void>;
    getAll: () => Promise<string[]>;
}

export const newManagementClient = async (
    config?: ManagementClientConfig
): Promise<ManagementClient> => {
    const currentConfig = useManagementConfigDefaults(config);

    const upsert = async (schema: string) => {
        await upsertProjections(schema, currentConfig);
    };

    const remove = async (projectionNames: string[]) => {
        await removeProjections(projectionNames, currentConfig);
    };

    const getAll = async (): Promise<string[]> => {
        return await getAllProjections(currentConfig);
    };

    return {
        upsert,
        remove,
        getAll,
    };
};
