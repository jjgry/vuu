import { useTypeaheadSuggestions } from "@finos/vuu-data";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import "./typeahead-filter.css";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, Icon } from "../icons";

type TypeaheadFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  existingFilters?: string[];
  onFilterSubmit: (
    newQuery: string,
    selectedFilters: string[],
    columnName: string
  ) => void;
};

export const TypeaheadFilter = ({
  defaultTypeaheadParams,
  existingFilters,
  onFilterSubmit,
}: TypeaheadFilterProps) => {
  const [tableName, columnName] = defaultTypeaheadParams;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>(
    existingFilters ?? []
  );
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const startsWithFilter = useRef<boolean>(false);

  useEffect(() => {
    setSearchValue("");
    if (showDropdown && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showDropdown]);

  const ref = useRef<HTMLDivElement>(null);

  const getSuggestions = useTypeaheadSuggestions();

  // get suggestions & filters on column select
  useEffect(() => {
    getSuggestions(defaultTypeaheadParams).then((response) => {
      setSuggestions(response);
    });

    setSelectedSuggestions(existingFilters ?? []);
  }, [columnName, existingFilters, getSuggestions, defaultTypeaheadParams]);

  //close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }); // TODO: Empty dependency array??

  // get suggestions while typing
  useEffect(() => {
    getSuggestions([tableName, columnName, searchValue]).then((options) => {
      if (searchValue) options.unshift(`${searchValue}...`);
      setSuggestions(options);
    });
  }, [searchValue, columnName, tableName, getSuggestions]);

  // on select new, check if "starts with" filter selected and rebuild query
  useEffect(() => {
    const isStartsWithFilter = () => {
      // Last three characters are ...
      const endsWithElipsis = /\.\.\.$/.test(selectedSuggestions[0]);
      return selectedSuggestions.length === 1 && endsWithElipsis;
    };

    startsWithFilter.current = isStartsWithFilter();
    const filterQuery = getTypeaheadQuery(
      selectedSuggestions,
      columnName,
      startsWithFilter.current
    );
    if (filterQuery === undefined) return;
    onFilterSubmit(filterQuery, selectedSuggestions, columnName);
  }, [columnName, onFilterSubmit, selectedSuggestions]);

  const handleDropdownToggle = (event: React.MouseEvent): void => {
    event.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const onSearch = ({ target }: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchValue(target.value);
  };

  const suggestionSelected = (value: string) => {
    setSelectedSuggestions(getUpdatedSelection(value));
  };

  const getUpdatedSelection = (selectedValue: string) => {
    if (isAlreadySelected(selectedValue))
      return selectedSuggestions.filter(
        (suggestion) => suggestion !== selectedValue
      );

    if (isStartsWithVal(selectedValue) || startsWithFilter.current)
      return [selectedValue];

    return [...(selectedSuggestions ?? []), selectedValue];
  };

  const getDisplay = () => {
    if (selectedSuggestions.length === 0) return "Filter";

    return (
      <div className="dropdown-tags">
        {selectedSuggestions.map((suggestion) => (
          <div key={suggestion} className="dropdown-tag-item">
            {suggestion}
            <span
              onClick={(e) => onTagRemove(e, suggestion)}
              className="dropdown-tag-close"
            >
              <CloseIcon />
            </span>
          </div>
        ))}
      </div>
    );
  };

  const onTagRemove = (
    e: React.MouseEvent<HTMLSpanElement>,
    suggestion: string
  ): void => {
    e.stopPropagation();
    const newSelection = selectedSuggestions.filter((x) => x !== suggestion);
    setSelectedSuggestions(newSelection);
    const filterQuery = getTypeaheadQuery(
      newSelection,
      columnName,
      startsWithFilter.current
    );
    if (filterQuery === undefined) return;
    onFilterSubmit(filterQuery, selectedSuggestions, columnName);
  };

  const isSelected = (selected: string) =>
    selectedSuggestions.includes(selected);

  const isStartsWithVal = (selectedVal: string) => {
    return selectedVal === searchValue + "...";
  };

  const isAlreadySelected = (selectedValue: string) =>
    selectedSuggestions.includes(selectedValue);

  return (
    <div className="dropdown-container" ref={ref}>
      <div onClick={handleDropdownToggle} className="dropdown-input">
        <div className="dropdown-selected-value">{getDisplay()}</div>
        <div className="dropdown-tools">
          <div className="dropdown-tool">
            <Icon />
          </div>
        </div>
      </div>
      {showDropdown && (
        <div className="dropdown-menu">
          <div className="search-box">
            <input
              onChange={onSearch}
              value={searchValue}
              ref={searchRef}
              id="input-field"
            />
          </div>
          {suggestions.map((suggestion: string) => (
            <div
              key={suggestion}
              className={`dropdown-item ${
                isSelected(suggestion) && "selected"
              }`}
              onClick={() => {
                suggestionSelected(suggestion);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getTypeaheadQuery = (
  filterValues: string[],
  column: string,
  isStartsWithFilter?: boolean
) => {
  if (filterValues.length === 0) {
    return;
  }

  if (isStartsWithFilter) {
    const startsWith = filterValues[0].substring(0, filterValues[0].length - 3);
    return `${column} starts ${startsWith}`; // multiple starts with filters not currently supported
  }

  return `${column} in ${JSON.stringify(filterValues)}`;
};
