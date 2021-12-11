import { WamArrayRingBuffer } from './types';

declare const getWamArrayRingBuffer: (groupId?: string, moduleId?: string) => typeof WamArrayRingBuffer;

export default getWamArrayRingBuffer;
