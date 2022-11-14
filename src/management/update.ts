import { ManagementServiceClient } from "@fraym/projections-proto";

export const updateProjections = async (
    schema: string,
    serviceClient: ManagementServiceClient
): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        serviceClient.updateProjections(
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
