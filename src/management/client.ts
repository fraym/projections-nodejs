import { ManagementServiceClient } from "@fraym/projections-proto";
import { credentials } from "@grpc/grpc-js";
import { ClientConfig, useConfigDefaults } from "../config/config";
import { createProjections } from "./create";
import { getAllProjections } from "./getAll";
import { removeProjections } from "./remove";
import { updateProjections } from "./update";

export interface ManagementClient {
    create: (schema: string) => Promise<void>;
    update: (schema: string) => Promise<void>;
    remove: (projectionNames: string[]) => Promise<void>;
    getAll: () => Promise<string[]>;
    close: () => Promise<void>;
}

export const newManagementClient = async (config: ClientConfig): Promise<ManagementClient> => {
    config = useConfigDefaults(config);
    const serviceClient = new ManagementServiceClient(
        config.serverAddress,
        credentials.createInsecure(),
        {
            "grpc.keepalive_time_ms": config.keepaliveInterval,
            "grpc.keepalive_timeout_ms": config.keepaliveTimeout,
            "grpc.keepalive_permit_without_calls": 1,
        }
    );

    const create = async (schema: string) => {
        await createProjections(schema, serviceClient);
    };

    const update = async (schema: string) => {
        await updateProjections(schema, serviceClient);
    };

    const remove = async (projectionNames: string[]) => {
        await removeProjections(projectionNames, serviceClient);
    };

    const getAll = async (): Promise<string[]> => {
        return await getAllProjections(serviceClient);
    };

    const close = async () => {
        serviceClient.close();
    };

    return {
        create,
        update,
        remove,
        getAll,
        close,
    };
};
