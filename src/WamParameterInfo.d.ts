import { WamParameterInfo } from '@webaudiomodules/api';

declare const getWamParameterInfo: (groupId?: string, moduleId?: string) => typeof WamParameterInfo;

export default getWamParameterInfo;
