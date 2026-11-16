export type SearchBoxProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};
