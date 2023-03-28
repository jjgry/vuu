import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { useEffect, useState } from "react";
import "./range-filter.css";

export type IRange = {
  start?: number;
  end?: number;
};

export type RangeFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  onFilterSubmit: (
    filterColumn: string,
    query?: string
  ) => void;
};

export const RangeFilter = ({
  defaultTypeaheadParams,
  onFilterSubmit,
}: RangeFilterProps) => {
  const columnName = defaultTypeaheadParams[1];
  const [rangeStart, setRangeStart] = useState<number| undefined>();
  const [rangeEnd, setRangeEnd] = useState<number| undefined>();
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.log("submitting range filter:", query)
    onFilterSubmit(columnName, query);
  }, [columnName, query]) // TODO: Add onFilterSubmit to this without breaking everything

  useEffect(() => {
    const x = getRangeQuery(columnName, rangeStart, rangeEnd);
    console.log("new query:", x)
    setQuery(x);
  }, [columnName, rangeStart, rangeEnd]);

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
