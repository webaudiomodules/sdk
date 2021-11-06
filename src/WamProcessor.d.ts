import { WamProcessor } from './types';

declare const getWamProcessor: (uuid?: string) => typeof WamProcessor;

export default getWamProcessor;
