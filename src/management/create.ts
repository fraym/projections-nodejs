import { ManagementServiceClient } from "@fraym/projections-proto";

export const createProjections = async (
    schema: string,
    serviceClient: ManagementServiceClient
): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        serviceClient.createProjections(
            {
                schema,
            },
            error => {
                if (error) {
                    reject(error.message);
                    return;
                }

                resolve();
            }
        );
    });
};
