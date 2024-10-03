export type Test = {
  name: string;
  run: () => Promise<void>;
  skip: boolean;
};
