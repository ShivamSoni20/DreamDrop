import { appConfig } from "./config";

function explorerPath(kind: "tx" | "address", value: string) {
  return `${appConfig.explorerUrl.replace(/\/$/, "")}/${kind}/${encodeURIComponent(value)}`;
}

export const getExplorerTxUrl = (hash: string) => explorerPath("tx", hash);
export const getExplorerAddressUrl = (address: string) => explorerPath("address", address);
