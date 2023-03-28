import { TypeaheadParams, VuuColumnDataType } from "@finos/vuu-protocol-types";
import { RangeFilter } from "./range-filter";
import { TypeaheadFilter } from "./typeahead-filter";

type FilterComponentProps = {
  columnType: VuuColumnDataType | undefined;
  defaultTypeaheadParams: TypeaheadParams;
  onFilterSubmit: (columnName: string, newQuery: string) => void;
};

export const FilterComponent = ({
  columnType,
  defaultTypeaheadParams,
  onFilterSubmit,
}: FilterComponentProps) => {
  if (columnType) {
    const SelectedFilter = filterComponent[columnType];
    return (
      <SelectedFilter
        defaultTypeaheadParams={defaultTypeaheadParams}
        onFilterSubmit={onFilterSubmit}
      />
    );
  }

  console.log("column type is undefined");
  return null;
};

const filterComponent: { [key: string]: React.FC<any> } = {
  string: TypeaheadFilter,
  char: TypeaheadFilter,
  int: RangeFilter,
  long: RangeFilter,
  double: RangeFilter,
};
