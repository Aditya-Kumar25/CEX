import { pushToQueueAndWait } from "./queue.service";

export async function fetchBalances(currentUser: string, identifier: string) {
  return pushToQueueAndWait({
    req_type: "get-balance",
    currentUser,
  }, identifier);
}
