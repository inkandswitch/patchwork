import { Value } from "../eval";
import { isNumber } from "lodash";
import { FilterSelection } from "../components/AmbSheet";
import { Position } from "../datatype";
import { Histogram } from "../components/Histogram";

import RangeSlider from "react-range-slider-input";
import "../range-slider.css";
import { useEffect, useMemo, useState } from "react";
import { printRawValue } from "../print";
import { ValueViewer, ValueViewerProps } from ".";

type NumberRange = {
  min: number;
  max: number;
};

export const ResultHistogram = ({
  values,
  setFilterSelection,
}: ValueViewerProps) => {
  const numbers = useMemo(
    () => values.map((v) => v.value.rawValue).filter(isNumber),
    [values]
  );
  const filteredNumbers = values
    .filter((v) => v.include)
    .map((n) => n.value.rawValue)
    .filter(isNumber);

  const selectValuesBetween = (range: NumberRange | null) => {
    if (!range) {
      setFilterSelection(null);
    } else {
      const numbersToSelect = numbers.filter(
        (n) => n >= range.min && n < range.max
      );

      setFilterSelection(numbersToSelect);
    }
  };

  const numbersMin = useMemo(() => Math.min(...numbers), [numbers]);
  const numbersMax = useMemo(() => Math.max(...numbers), [numbers]);

  const minWithPadding = numbersMin - 0.1;
  const maxWithPadding = numbersMax + 0.1;

  console.log({ minWithPadding, maxWithPadding });

  const [filterMinMax, setFilterMinMax] = useState<{
    min: number;
    max: number;
  }>({ min: minWithPadding, max: maxWithPadding });

  // if the numbers change, we need to reset the filter range
  useEffect(() => {
    setFilterMinMax({ min: minWithPadding, max: maxWithPadding });
  }, [numbersMin, numbersMax]);

  useEffect(() => {
    if (
      filterMinMax.min === minWithPadding &&
      filterMinMax.max === maxWithPadding
    ) {
      selectValuesBetween(null);
    } else {
      selectValuesBetween(filterMinMax);
    }
  }, [filterMinMax]);

  if (numbers.length < 2) {
    return (
      <div className="text-gray-400 text-xs">
        Need at least two numbers to display a histogram
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-2 items-start">
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
            min={minWithPadding}
            max={maxWithPadding}
            width={200}
            value={[filterMinMax.min, filterMinMax.max]}
            onInput={([min, max]) => setFilterMinMax({ min, max })}
          />
        </div>
      </div>
      <table className="text-xs text-gray-500 w-full">
        <thead>
          <tr>
            <th className="text-left font-medium"></th>
            <th className="text-left font-medium">All</th>
            <th className="text-left font-medium bg-blue-100">Filtered</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium">Count:</td>
            <td>{printRawValue(numbers.length)}</td>
            <td className="bg-blue-100">
              {printRawValue(filteredNumbers.length)}
            </td>
          </tr>
          <tr>
            <td className="font-medium">Mean:</td>
            <td>
              {printRawValue(
                numbers.reduce((acc, v) => acc + v, 0) / numbers.length
              )}
            </td>
            <td className="bg-blue-100">
              {printRawValue(
                filteredNumbers.reduce((acc, v) => acc + v, 0) /
                  filteredNumbers.length
              )}
            </td>
          </tr>
          <tr>
            <td className="font-medium">Min:</td>
            <td>{printRawValue(Math.min(...numbers))}</td>
            <td className="bg-blue-100">
              {printRawValue(Math.min(...filteredNumbers))}
            </td>
          </tr>
          <tr>
            <td className="font-medium">Max:</td>
            <td>{printRawValue(Math.max(...numbers))}</td>
            <td className="bg-blue-100">
              {printRawValue(Math.max(...filteredNumbers))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const histogramViewer: ValueViewer = {
  name: "Histogram",
  shouldRender: (values) =>
    values.length > 10 ? "high" : values.length > 1 ? "normal" : "hide",
  component: ResultHistogram,
};
