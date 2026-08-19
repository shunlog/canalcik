import { Alert, Center, Loader } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

/** Loading / error / data, so no page has to spell out the three states itself. */
export function QueryBoundary<T>({
  query,
  children,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (query.isError) {
    return (
      <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Nu s-au putut încărca datele">
        {query.error instanceof Error ? query.error.message : "Eroare necunoscută"}
      </Alert>
    );
  }
  return <>{children(query.data)}</>;
}
