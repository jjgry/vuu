import { TypeaheadParams, VuuColumnDataType } from "@finos/vuu-protocol-types";
import { IRange, RangeFilter } from "./range-filter";
import { TypeaheadFilter } from "./typeahead-filter";

type FilterComponentProps = {
  columnType: VuuColumnDataType | undefined;
  defaultTypeaheadParams: TypeaheadParams;
  filterValues: IRange | string[] | undefined;
  onFilterSubmit: (
    newFilter: string[] | IRange,
    newQuery: string
  ) => void;
};

export const FilterComponent = ({
  columnType,
  defaultTypeaheadParams,
  filterValues,
  onFilterSubmit,
}: FilterComponentProps) => {
  switch (columnType) {
    case "string":
    case "char":
      return (
        <TypeaheadFilter
          defaultTypeaheadParams={defaultTypeaheadParams}
          filterValues={filterValues as string[] | undefined} // TODO: Remove assertion
          onFilterSubmit={onFilterSubmit}
        />
      );
    case "int":
    case "long":
    case "double":
      return (
        <RangeFilter
          defaultTypeaheadParams={defaultTypeaheadParams}
          filterValues={filterValues as IRange | undefined} // TODO: Remove assertion
          onFilterSubmit={onFilterSubmit}
        />
      );
    default:
      console.log("column type is undefined");
      return null;
  }
};
