import { WamEventRingBuffer } from './types';

declare const getWamEventRingBuffer: (groupId?: string, moduleId?: string) => typeof WamEventRingBuffer;

export default getWamEventRingBuffer;
