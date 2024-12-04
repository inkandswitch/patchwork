import { Value } from "../eval";
import { isNumber } from "lodash";
import { FilterSelection } from "./AmbSheet";
import { Position } from "../datatype";
import { Histogram } from "./Histogram";

import RangeSlider from "react-range-slider-input";
import "../range-slider.css";
import { useEffect, useMemo, useState } from "react";
import { printRawValue } from "../print";

export const ResultHistogram = ({
  selectedCell,
  results,
  filterSelection,
  setFilterSelectionForCell,
  selectedCellResult,
}: {
  selectedCell: Position;
  results: { value: Value; include: boolean }[];
  filterSelection: FilterSelection;
  setFilterSelectionForCell: (
    cell: Position,
    selectedIndexes: number[]
  ) => void;
  selectedCellResult: { value: Value; include: boolean }[];
}) => {
  const numbers = useMemo(
    () => results.map((r) => r.value.rawValue).filter(isNumber),
    [results]
  );
  const filteredNumbers = results
    .filter((n, i) => filterSelection?.selectedValueIndexes.includes(i))
    .map((n) => n.value.rawValue)
    .filter(isNumber);

  const selectValuesBetween = (range) => {
    if (!range) {
      setFilterSelectionForCell(selectedCell, null);
    } else {
      const numbersToSelect = numbers.filter(
        (n) => n >= range.min && n < range.max
      );

      const indexesToSelect = [];
      for (let i = 0; i < results.length; i++) {
        if (numbersToSelect.includes(results[i].value.rawValue as number)) {
          indexesToSelect.push(i);
        }
      }

      setFilterSelectionForCell(selectedCell, indexesToSelect);
    }
  };

  const numbersMin = useMemo(() => Math.min(...numbers), [numbers]);
  const numbersMax = useMemo(() => Math.max(...numbers), [numbers]);

  const [filterBarLimits, setFilterBarLimits] = useState<{
    min: number;
    max: number;
  }>({ min: numbersMin, max: numbersMax });

  useEffect(() => {
    setFilterBarLimits({ min: numbersMin, max: numbersMax });
  }, [numbersMin, numbersMax]);

  useEffect(() => {
    if (
      filterBarLimits.min === numbersMin &&
      filterBarLimits.max === numbersMax
    ) {
      selectValuesBetween(null);
    } else {
      selectValuesBetween(filterBarLimits);
    }
  }, [filterBarLimits]);

  if (numbers.length < 2) {
    return (
      <div className="text-gray-400 text-xs">
        Need at least two numbers to display a histogram
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-4 items-start">
      <div>
        <Histogram
          data={numbers}
          filteredData={filteredNumbers}
          width={200}
          height={100}
          selectValuesBetween={selectValuesBetween}
        />
        <div className="w-[200px] mt-2">
          <RangeSlider
            min={numbersMin}
            max={numbersMax}
            width={200}
            value={[filterBarLimits.min, filterBarLimits.max]}
            onInput={([min, max]) => setFilterBarLimits({ min, max })}
          />
        </div>
      </div>
      <table className="text-xs text-gray-500 w-full ">
        <tbody>
          <tr>
            <td className="font-medium">Count:</td>
            <td>{printRawValue(selectedCellResult.length)}</td>
          </tr>
          <tr>
            <td className="font-medium">Mean:</td>
            <td>
              {printRawValue(
                selectedCellResult
                  .map((v) => v.value.rawValue)
                  .filter(isNumber)
                  .reduce((acc, v) => acc + v, 0) / selectedCellResult.length
              )}
            </td>
          </tr>
          <tr>
            <td className="font-medium">Min:</td>
            <td>
              {printRawValue(
                Math.min(
                  ...selectedCellResult
                    .map((v) => v.value.rawValue)
                    .filter(isNumber)
                )
              )}
            </td>
          </tr>
          <tr>
            <td className="font-medium">Max:</td>
            <td>
              {printRawValue(
                Math.max(
                  ...selectedCellResult
                    .map((v) => v.value.rawValue)
                    .filter(isNumber)
                )
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
