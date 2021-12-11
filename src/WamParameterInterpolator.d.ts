import { WamParameterInterpolator } from './types';

declare const getWamParameterInterpolator: (groupId?: string, moduleId?: string) => typeof WamParameterInterpolator;

export default getWamParameterInterpolator;
