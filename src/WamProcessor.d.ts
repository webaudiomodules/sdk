import { WamProcessor } from './types';

declare const getWamProcessor: (groupId?: string, moduleId?: string, dependencies?: { RingBuffer: string; WamEventRingBuffer: string; WamParameter: string; WamParameterInterpolator: string; }) => typeof WamProcessor;

export default getWamProcessor;
