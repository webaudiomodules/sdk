import { WamParameter } from '@webaudiomodules/api';

declare const getWamParameter: (groupId?: string, moduleId?: string) => typeof WamParameter;

export default getWamParameter;
