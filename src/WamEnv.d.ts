import { WamEnv } from "@webaudiomodules/api";

declare const initializeWamEnv: (apiVersion: string) => typeof WamEnv;

export default initializeWamEnv;
