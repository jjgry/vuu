import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { useState } from "react";
import { FilterComponent } from "./filter-components/filter-selector";
import { IRange } from "./filter-components/range-filter";
import "./filter-panel.css";

type Query = { [key: string]: string };
type Filter = { [key: string]: string[] | IRange | undefined };

type FilterPanelProps = {
  table: VuuTable;
  columns: ColumnDescriptor[];
  onFilterSubmit: (filterQuery: string) => void;
};

export const FilterPanel = ({
  table,
  columns,
  onFilterSubmit,
}: FilterPanelProps) => {
  const [selectedColumnName, setSelectedColumnName] = useState("");
  const [queries, setQueries] = useState<Query>({});
  const [filters, setFilters] = useState<Filter>({});

  const handleClear = () => {
    setSelectedColumnName("");
    setQueries({});
    setFilters({});
    onFilterSubmit("");
  };

  const handleFilterSubmit = (
    newFilter: string[] | IRange,
    newQuery: string
  ) => {
    if (selectedColumnName === "") return;

    setFilters({
      ...filters,
      [selectedColumnName]: newFilter,
    });

    const newQueries = {
      ...queries,
      [selectedColumnName]: newQuery,
    };
    setQueries(newQueries);
    onFilterSubmit(getFilterQuery(newQueries));
  };

  const selectedColumnType = columns.find(
    (column) => column.name === selectedColumnName
  )?.serverDataType;

  const getColumnSelectorOption = (columnName: string) => {
    const hasFilter =
      queries[columnName] !== undefined && queries[columnName] !== "";
    return (
      <option className={hasFilter ? "has-filter" : undefined}>
        {columnName}
      </option>
    );
  };

  return (
    <fieldset id="filter-panel">
      <div className="inline-block">
        <div>
          <label id="column-selector-label" className="block">
            Column
          </label>
          <select
            onChange={(e) => setSelectedColumnName(e.target.value)}
            id="column-selector"
            className="block"
            value={selectedColumnName}
          >
            <option disabled selected></option>
            {columns.map(({ name }) => getColumnSelectorOption(name))}
          </select>
        </div>
      </div>
      <div id="filter-component" className="inline-block">
        {selectedColumnName !== "" ? (
          <div>
            <FilterComponent
              columnType={selectedColumnType}
              defaultTypeaheadParams={[table, selectedColumnName]}
              filterValues={filters[selectedColumnName]}
              onFilterSubmit={handleFilterSubmit}
            />
            <button
              className="clear-button"
              type="button"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>
    </fieldset>
  );
};

const getFilterQuery = (queries: Query) =>
  Object.values(queries)
    .filter((query) => query != null && query !== "")
    .join(" and ");
