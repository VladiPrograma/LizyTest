import { Filter } from 'bad-words';

const filter = new Filter();

export const cleanMessage = (message: string): string => {
  return filter.clean(message);
};

export const isProfane = (message: string): boolean => {
  return filter.isProfane(message);
};
