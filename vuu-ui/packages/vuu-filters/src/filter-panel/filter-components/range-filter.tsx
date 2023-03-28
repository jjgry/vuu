import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { useEffect, useState } from "react";
import "./range-filter.css";

export type IRange = {
  start?: number;
  end?: number;
};

type RangeFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  existingFilters: IRange;
  onFilterSubmit: (
    newQuery: string,
    selectedFilters: IRange,
    columnName: string
  ) => void;
};

export const RangeFilter = ({
  defaultTypeaheadParams,
  existingFilters,
  onFilterSubmit,
}: RangeFilterProps) => {
  const columnName = defaultTypeaheadParams[1];
  const [rangeStart, setRangeStart] = useState(existingFilters.start);
  const [rangeEnd, setRangeEnd] = useState(existingFilters.end);

  useEffect(() => {
    const range = { start: rangeStart, end: rangeEnd };
    const query = getRangeQuery(columnName, rangeStart, rangeEnd);
    onFilterSubmit(query, range, columnName);
  }, [columnName, rangeStart, rangeEnd, onFilterSubmit]);

  const startChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    isNaN(value) ? setRangeStart(undefined) : setRangeStart(value);
  };

  const endChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    isNaN(value) ? setRangeEnd(undefined) : setRangeEnd(value);
  };

  return (
    <div className="range-filter-container">
      <input
        className="range-input"
        name="start"
        onChange={startChangeHandler}
        value={rangeStart ?? ""}
        type="number"
      />
      {" to "}
      <input
        className="range-input"
        name="end"
        onChange={endChangeHandler}
        value={rangeEnd ?? ""}
      />
    </div>
  );
};

const getRangeQuery = (
  column: string,
  rangeStart?: number,
  rangeEnd?: number
) => {
  const startIsDefined = rangeStart !== undefined;
  const endIsDefined = rangeEnd !== undefined;

  if (startIsDefined && endIsDefined)
    return `${column} > ${rangeStart - 1} and ${column} < ${rangeEnd + 1}`;

  if (startIsDefined && !endIsDefined) return `${column} > ${rangeStart - 1}`;

  if (!startIsDefined && endIsDefined) return `${column} < ${rangeEnd + 1}`;

  return "";
};
