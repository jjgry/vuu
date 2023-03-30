import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { ChangeEvent, useState } from "react";
import { FilterComponent } from "./filter-components/filter-selector";
import { IRange } from "./filter-components/range-filter";
import "./filter-panel.css";

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
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(
    null
  );
  const [allQueries, setAllQueries] = useState<{
    [key: string]: string;
  }>({});
  const [filters, setFilters] = useState<{
    [key: string]: string[] | IRange | undefined;
  }>({});

  const getSelectedColumnType = () =>
    columns.find((column) => column.name === selectedColumnName)
      ?.serverDataType;

  const handleColumnSelect = (e: ChangeEvent<HTMLSelectElement>) =>
    setSelectedColumnName(e.currentTarget.value);

  const handleClear = () => {
    setSelectedColumnName(null);
    setAllQueries({});
    setFilters({});
    onFilterSubmit("");
  };

  const localOnFilterSubmit = (
    newFilter: string[] | IRange | undefined,
    newQuery: string
  ) => {
    if (!selectedColumnName) return;

    const newQueries = { ...allQueries, [selectedColumnName]: newQuery };
    const newFilters = { ...filters, [selectedColumnName]: newFilter };

    setAllQueries(newQueries);
    setFilters(newFilters);
    onFilterSubmit(getFilterQuery(newQueries));
  };

  const getColumnSelectorOption = (name: string) => <option>{name}</option>;

  return (
    <fieldset id="filter-panel">
      <div className="inline-block">
        <div>
          <label id="column-selector-label" className="block">
            Column
          </label>
          <select
            onChange={handleColumnSelect}
            id="column-selector"
            className="block"
          >
            <option disabled selected></option>
            {columns.map(({ name }) => getColumnSelectorOption(name))}
          </select>
        </div>
      </div>
      <div id="filter-component" className="inline-block">
        {selectedColumnName ? (
          <div>
            <FilterComponent
              columnType={getSelectedColumnType()}
              defaultTypeaheadParams={[table, selectedColumnName]}
              filterValues={filters[selectedColumnName]}
              onFilterSubmit={localOnFilterSubmit}
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

function getFilterQuery(
  allQueries: {
    [key: string]: string;
  } | null
) {
  let newQuery = "";

  if (allQueries) {
    Object.values(allQueries).forEach((query) => {
      if (query && query != "") {
        newQuery += query + " and ";
      }
    });

    newQuery = newQuery.slice(0, newQuery.length - 5);
  }

  return newQuery;
}
