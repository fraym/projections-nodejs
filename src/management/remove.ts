import { ManagementServiceClient } from "@fraym/projections-proto";

export const removeProjections = async (
    projectionNames: string[],
    serviceClient: ManagementServiceClient
): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        serviceClient.removeProjections(
            {
                projectionNames,
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
